import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreatePlanDto } from '@/modules/plans/dto/create-plan.dto';
import { UpdatePlanDto } from '@/modules/plans/dto/update-plan.dto';
import { Plan } from '@/generated/prisma/client';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePlanDto): Promise<Plan> {
    const base = dto.basePrice ?? dto.pricePerUser;
    const additionalUsers = Math.max(dto.maxUsers - 1, 0);
    const total = Number(base) + Number(dto.pricePerUser) * additionalUsers;
    return this.prisma.plan.create({
      data: {
        name: dto.name,
        type: dto.type,
        basePrice: dto.basePrice ?? null,
        pricePerUser: dto.pricePerUser,
        maxUsers: dto.maxUsers,
        total,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(): Promise<Plan[]> {
    return this.prisma.plan.findMany({ orderBy: { name: 'asc' } });
  }

  async findAllActive(): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    return plan;
  }

  async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };

    if (dto.basePrice !== undefined || dto.pricePerUser !== undefined || dto.maxUsers !== undefined) {
      const newBasePrice = dto.basePrice ?? Number(plan.basePrice);
      const newPrice = dto.pricePerUser ?? Number(plan.pricePerUser);
      const newMaxUsers = dto.maxUsers ?? plan.maxUsers;
      const additionalUsers = Math.max(newMaxUsers - 1, 0);
      data['total'] = Number(newBasePrice) + Number(newPrice) * additionalUsers;
    }

    return this.prisma.plan.update({ where: { id }, data });
  }
}
