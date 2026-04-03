import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreatePlanDto } from '@/modules/plans/dto/create-plan.dto';
import { UpdatePlanDto } from '@/modules/plans/dto/update-plan.dto';
import { Plan } from '@/generated/prisma/client';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePlanDto): Promise<Plan> {
    const total = Number(dto.pricePerUser) * dto.maxUsers;
    return this.prisma.plan.create({
      data: {
        name: dto.name,
        type: dto.type,
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

    if (dto.pricePerUser !== undefined || dto.maxUsers !== undefined) {
      const newPrice = dto.pricePerUser ?? Number(plan.pricePerUser);
      const newMaxUsers = dto.maxUsers ?? plan.maxUsers;
      data['total'] = Number(newPrice) * newMaxUsers;
    }

    return this.prisma.plan.update({ where: { id }, data });
  }
}
