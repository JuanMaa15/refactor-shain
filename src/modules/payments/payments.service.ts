import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { OrderStatus, UserRole } from '@/generated/prisma/enums';
import { addDays } from 'date-fns';
import { EmailService } from './email.service';
import * as crypto from 'crypto';

type TransactionData = {
  wompiId: string | null;
  status: string;
  reference: string | null;
  amountInCents: number;
  paymentMethodType: string | null;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async processWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!rawBody?.length) {
      throw new BadRequestException('Payload de webhook inválido');
    }

    const payloadString = rawBody.toString('utf8');
    const webhookSecret = this.configService.get<string>(
      'payments.wompi.webhookSecret',
    );

    if (webhookSecret) {
      if (!signature) {
        throw new UnauthorizedException('Firma de webhook faltante');
      }
      if (!this.verifySignature(payloadString, signature, webhookSecret)) {
        throw new UnauthorizedException('Firma de webhook inválida');
      }
    }

    const payload = this.parsePayload(payloadString);
    const transactionData = this.extractTransactionData(payload);

    if (!transactionData.wompiId) {
      throw new BadRequestException(
        'El identificador de la transacción no está presente',
      );
    }

    if (!transactionData.reference) {
      throw new BadRequestException('No se encontró la referencia de la orden');
    }

    const order = await this.prisma.order.findUnique({
      where: { reference: transactionData.reference },
      include: { plan: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { wompiId: transactionData.wompiId },
    });

    if (existingTransaction) {
      this.logger.log(
        `Transacción Wompi duplicada recibida: ${transactionData.wompiId}`,
      );
      return { success: true };
    }

    await this.prisma.transaction.create({
      data: {
        wompiId: transactionData.wompiId,
        status: transactionData.status,
        reference: transactionData.reference,
        amountInCents: transactionData.amountInCents,
        paymentMethodType: transactionData.paymentMethodType,
        rawPayload: payload,
        orderId: order.id,
      },
    });

    const mappedStatus = this.mapStatus(transactionData.status);

    if (order.status === OrderStatus.APPROVED) {
      this.logger.log(
        `Orden ${order.reference} ya fue aprobada, webhook ignorado`,
      );
      return { success: true };
    }

    if (mappedStatus === order.status) {
      this.logger.log(
        `Orden ${order.reference} ya está en estado ${order.status}, sin cambios`,
      );
      return { success: true };
    }

    if (mappedStatus === OrderStatus.PENDING) {
      this.logger.log(
        `Orden ${order.reference} sigue en estado PENDING, no se aplica actualización`,
      );
      return { success: true };
    }

    const updateData: Record<string, unknown> = { status: mappedStatus };

    if (mappedStatus === OrderStatus.APPROVED) {
      const startDate = new Date();
      const durationDays = order.plan.type === 'MONTHLY' ? 30 : 365;
      const endDate = addDays(startDate, durationDays);

      updateData.startDate = startDate;
      updateData.endDate = endDate;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    this.logger.log(
      `Orden ${order.reference} actualizada de ${order.status} a ${mappedStatus}`,
    );

    if (mappedStatus === OrderStatus.APPROVED) {
      await this.createEntryCodes(order);
    }

    return { success: true };
  }

  private async createEntryCodes(order: {
    id: string;
    email: string;
    quantityUsers: number;
    reference: string;
    plan: { type: string };
  }) {
    const roles = await this.prisma.role.findMany({
      where: {
        name: { in: [UserRole.BUSINESS_OWNER, UserRole.SERVICE_PROVIDER] },
      },
    });

    const ownerRole = roles.find(
      (role) => role.name === UserRole.BUSINESS_OWNER,
    );
    const serviceProviderRole = roles.find(
      (role) => role.name === UserRole.SERVICE_PROVIDER,
    );

    if (!ownerRole || !serviceProviderRole) {
      throw new InternalServerErrorException(
        'No se encontraron los roles necesarios para generar los códigos',
      );
    }

    const entryCodeRecords = [] as Array<{ code: string }>;

    const ownerEntryCode = await this.prisma.entryCode.create({
      data: {
        code: this.generateEntryCode(),
        orderId: order.id,
        roleId: ownerRole.id,
      },
    });

    entryCodeRecords.push({ code: ownerEntryCode.code });

    const remainingCodes = order.quantityUsers - 1;
    for (let index = 0; index < remainingCodes; index += 1) {
      const serviceCode = await this.prisma.entryCode.create({
        data: {
          code: this.generateEntryCode(),
          orderId: order.id,
          roleId: serviceProviderRole.id,
        },
      });
      entryCodeRecords.push({ code: serviceCode.code });
    }

    const codes = entryCodeRecords.map((entry) => entry.code);
    await this.emailService.sendOrderCodes(order.email, order.reference, codes);
  }

  private parsePayload(payloadString: string) {
    try {
      return JSON.parse(payloadString);
    } catch (error) {
      throw new BadRequestException(
        'El payload de webhook no es un JSON válido',
      );
    }
  }

  private extractTransactionData(payload: unknown) {
    const transaction =
      payload?.data?.transaction ?? payload?.transaction ?? payload;

    return {
      wompiId: transaction?.id ?? payload?.id ?? null,
      status: transaction?.status ?? transaction?.payment_status ?? 'UNKNOWN',
      reference:
        transaction?.reference ?? transaction?.payment_reference ?? null,
      amountInCents:
        transaction?.amount_in_cents ?? transaction?.amountInCents ?? 0,
      paymentMethodType:
        transaction?.payment_method_type ??
        transaction?.paymentMethodType ??
        null,
    };
  }

  private verifySignature(
    payloadString: string,
    signature: string,
    secret: string,
  ) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    return expectedSignature === signature;
  }

  private mapStatus(sourceStatus: string) {
    const normalized = String(sourceStatus).toUpperCase();

    if (['APPROVED', 'COMPLETED', 'AUTHORIZED'].includes(normalized)) {
      return 'APPROVED';
    }

    if (['PENDING', 'PENDIENTE'].includes(normalized)) {
      return 'PENDING';
    }

    return 'REJECTED';
  }

  private generateReference() {
    return `SHN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  }

  private generateEntryCode() {
    return `SHN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
