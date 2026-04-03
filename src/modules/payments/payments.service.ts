import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { OrderStatus, UserRole } from '@/generated/prisma/enums';
import { addDays } from 'date-fns';
import { EmailService } from '@/modules/payments/email.service';
import * as crypto from 'crypto';

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
      if (!signature)
        throw new UnauthorizedException('Firma de webhook faltante');
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
    if (!order) throw new NotFoundException('Orden no encontrada');

    // Deduplicación
    const existing = await this.prisma.transaction.findUnique({
      where: { wompiId: transactionData.wompiId },
    });
    if (existing) {
      this.logger.log(`Transacción duplicada: ${transactionData.wompiId}`);
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
      this.logger.log(`Orden ${order.reference} ya aprobada, ignorando`);
      return { success: true };
    }
    if (mappedStatus === order.status || mappedStatus === OrderStatus.PENDING) {
      return { success: true };
    }

    const updateData: Record<string, unknown> = { status: mappedStatus };

    if (mappedStatus === OrderStatus.APPROVED) {
      const startDate = new Date();
      const durationDays = order.plan.type === 'MONTHLY' ? 30 : 365;
      updateData['startDate'] = startDate;
      updateData['endDate'] = addDays(startDate, durationDays);
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });
    this.logger.log(
      `Orden ${order.reference}: ${order.status} → ${mappedStatus}`,
    );

    if (mappedStatus === OrderStatus.APPROVED) {
      await this.createEntryCodes(order);
    }

    return { success: true };
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

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

    const ownerRole = roles.find((r) => r.name === UserRole.BUSINESS_OWNER);
    const providerRole = roles.find(
      (r) => r.name === UserRole.SERVICE_PROVIDER,
    );

    if (!ownerRole || !providerRole) {
      throw new InternalServerErrorException('Roles necesarios no encontrados');
    }

    const codes: string[] = [];

    const ownerCode = await this.prisma.entryCode.create({
      data: {
        code: this.generateEntryCode(),
        orderId: order.id,
        roleId: ownerRole.id,
      },
    });
    codes.push(ownerCode.code);

    for (let i = 0; i < order.quantityUsers - 1; i++) {
      const c = await this.prisma.entryCode.create({
        data: {
          code: this.generateEntryCode(),
          orderId: order.id,
          roleId: providerRole.id,
        },
      });
      codes.push(c.code);
    }

    await this.emailService.sendOrderCodes(order.email, order.reference, codes);
  }

  private parsePayload(payloadString: string) {
    try {
      return JSON.parse(payloadString);
    } catch {
      throw new BadRequestException('El payload no es JSON válido');
    }
  }

  private extractTransactionData(payload: unknown) {
    const t =
      (payload as any)?.data?.transaction ??
      (payload as any)?.transaction ??
      payload;
    return {
      wompiId: t?.id ?? (payload as any)?.id ?? null,
      status: t?.status ?? t?.payment_status ?? 'UNKNOWN',
      reference: t?.reference ?? t?.payment_reference ?? null,
      amountInCents: t?.amount_in_cents ?? t?.amountInCents ?? 0,
      paymentMethodType: t?.payment_method_type ?? t?.paymentMethodType ?? null,
    };
  }

  private verifySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return expected === signature;
  }

  private mapStatus(source: string): string {
    const s = String(source).toUpperCase();
    if (['APPROVED', 'COMPLETED', 'AUTHORIZED'].includes(s)) return 'APPROVED';
    if (['PENDING', 'PENDIENTE'].includes(s)) return 'PENDING';
    return 'REJECTED';
  }

  private generateEntryCode(): string {
    return `SHN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
