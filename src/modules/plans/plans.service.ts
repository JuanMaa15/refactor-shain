import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from '@/generated/prisma/client';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const total = Number(createPlanDto.pricePerUser) * createPlanDto.maxUsers;

    return this.prisma.plan.create({
      data: {
        name: createPlanDto.name,
        type: createPlanDto.type,
        pricePerUser: createPlanDto.pricePerUser,
        maxUsers: createPlanDto.maxUsers,
        total,
        isActive: createPlanDto.isActive ?? true,
      },
    });
  }

  async findAll(): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }

    return plan;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);

    const data: Partial<CreatePlanDto> & { total?: number } = {};

    if (updatePlanDto.name !== undefined) {
      data.name = updatePlanDto.name;
    }

    if (updatePlanDto.type !== undefined) {
      data.type = updatePlanDto.type;
    }

    if (updatePlanDto.pricePerUser !== undefined) {
      data.pricePerUser = updatePlanDto.pricePerUser;
    }

    if (updatePlanDto.maxUsers !== undefined) {
      data.maxUsers = updatePlanDto.maxUsers;
    }

    if (updatePlanDto.isActive !== undefined) {
      data.isActive = updatePlanDto.isActive;
    }

    if (data.pricePerUser !== undefined || data.maxUsers !== undefined) {
      const newPrice = data.pricePerUser ?? Number(plan.pricePerUser);
      const newMaxUsers = data.maxUsers ?? plan.maxUsers;
      data.total = Number(newPrice) * newMaxUsers;
    }

    return this.prisma.plan.update({
      where: { id },
      data,
    });
  }
}
