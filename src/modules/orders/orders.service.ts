import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateOrderDto } from '@/modules/orders/dto/create-order.dto';
import { UpdateOrderDto } from '@/modules/orders/dto/update-order.dto';
import { Order, Transaction } from '@/generated/prisma/client';
import { OrderStatus } from '@/generated/prisma/enums';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto): Promise<{ reference: string }> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('El plan no existe o no está activo');
    }

    if (dto.quantityUsers < 1 || dto.quantityUsers > plan.maxUsers) {
      throw new BadRequestException('La cantidad de usuarios es inválida');
    }

    const total = Number(plan.pricePerUser) * dto.quantityUsers;
    const reference = this.generateReference();

    const order = await this.prisma.order.create({
      data: {
        reference,
        planId: plan.id,
        name: dto.name,
        email: dto.email,
        quantityUsers: dto.quantityUsers,
        pricePerUser: Number(plan.pricePerUser).toFixed(2),
        total: total.toFixed(2),
      },
    });

    return { reference: order.reference };
  }

  async findAll(): Promise<Order[]> {
    return this.prisma.order.findMany({
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { plan: true },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    const data: Record<string, unknown> = {};

    if (dto.name !== undefined) data['name'] = dto.name;
    if (dto.email !== undefined) data['email'] = dto.email;

    if (dto.quantityUsers !== undefined) {
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          'Solo se puede actualizar la cantidad en órdenes pendientes',
        );
      }
      const plan = await this.prisma.plan.findUnique({
        where: { id: order.planId },
      });
      if (!plan) throw new NotFoundException('Plan asociado no encontrado');

      if (dto.quantityUsers < 1 || dto.quantityUsers > plan.maxUsers) {
        throw new BadRequestException('La cantidad de usuarios es inválida');
      }

      data['quantityUsers'] = dto.quantityUsers;
      data['total'] = Number(order.pricePerUser) * dto.quantityUsers;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No se encontraron campos para actualizar');
    }

    return this.prisma.order.update({
      where: { id },
      data,
      include: { plan: true },
    });
  }

  async findTransactionsByOrder(orderId: string): Promise<Transaction[]> {
    await this.findOne(orderId);
    return this.prisma.transaction.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private generateReference(): string {
    return `SHN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  }
}
