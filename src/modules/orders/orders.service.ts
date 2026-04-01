import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '@/generated/prisma/enums';
import { Order, Transaction } from '@/generated/prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto): Promise<{ reference: string }> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: createOrderDto.planId },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('El plan no existe o no está activo');
    }

    if (
      createOrderDto.quantityUsers < 1 ||
      createOrderDto.quantityUsers > plan.maxUsers
    ) {
      throw new BadRequestException('La cantidad de usuarios es inválida');
    }

    const unitPrice = Number(plan.pricePerUser);
    const total = unitPrice * createOrderDto.quantityUsers;
    const reference = this.generateReference();

    const order = await this.prisma.order.create({
      data: {
        reference,
        planId: plan.id,
        name: createOrderDto.name,
        email: createOrderDto.email,
        quantityUsers: createOrderDto.quantityUsers,
        pricePerUser: unitPrice.toFixed(2),
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

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    const data: Partial<UpdateOrderDto> & { total?: number } = {};

    if (updateOrderDto.name !== undefined) {
      data.name = updateOrderDto.name;
    }

    if (updateOrderDto.email !== undefined) {
      data.email = updateOrderDto.email;
    }

    if (updateOrderDto.quantityUsers !== undefined) {
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          'Solo se puede actualizar la cantidad en órdenes pendientes',
        );
      }

      const plan = await this.prisma.plan.findUnique({
        where: { id: order.planId },
      });

      if (!plan) {
        throw new NotFoundException('Plan asociado no encontrado');
      }

      if (
        updateOrderDto.quantityUsers < 1 ||
        updateOrderDto.quantityUsers > plan.maxUsers
      ) {
        throw new BadRequestException('La cantidad de usuarios es inválida');
      }

      data.quantityUsers = updateOrderDto.quantityUsers;
      data.total = Number(order.pricePerUser) * updateOrderDto.quantityUsers;
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

  private generateReference() {
    return `SHN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  }
}
