import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { Movement, MovementType, Prisma } from '@/generated/prisma/client';
import { DayMovementAggregate } from '@/modules/movements/interfaces';

@Injectable()
export class MovementRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async create(data: Prisma.MovementCreateInput): Promise<Movement> {
    return this.prisma.movement.create({ data });
  }

  async findById(id: string): Promise<Movement | null> {
    return this.prisma.movement.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Prisma.MovementUpdateInput,
  ): Promise<Movement> {
    return this.prisma.movement.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.movement.delete({ where: { id } });
  }

  // ─── Listados ──────────────────────────────────────────────────────────────

  async findManyByUser(
    userId: string,
    where: Prisma.MovementWhereInput,
  ): Promise<Movement[]> {
    return this.prisma.movement.findMany({
      where: { userId, ...where },
      orderBy: { date: 'desc' },
    });
  }

  async findLastDaysByUser(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<Pick<Movement, 'type' | 'value' | 'date'>[]> {
    return this.prisma.movement.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { type: true, value: true, date: true },
    });
  }

  // ─── Aggregations ──────────────────────────────────────────────────────────
  //
  // Un solo método getTotalsByFilter() cubre todos los casos del resumen:
  // día/mes/año por usuario o negocio. El WHERE dinámico lo construye
  // el servicio y lo pasa como Prisma.MovementWhereInput.
  //
  // Esto colapsa los ~6 métodos del Express original (getTotalTransactionsByUser,
  // getTotalTransactionsDay, getTotalTransactionsMonth, etc.) en uno solo,
  // eliminando duplicación sin perder claridad.

  async getTotalsByFilter(where: Prisma.MovementWhereInput) {
    return this.prisma.movement.groupBy({
      by: ['type'],
      where,
      _sum: { value: true },
    });
  }

  /**
   * Única query que justifica $queryRaw:
   * TO_CHAR garantiza que el GROUP BY sea sobre un string 'YYYY-MM-DD' exacto.
   * Con groupBy de Prisma, date se deserializa como Date de JS y puede generar
   * grupos duplicados para el mismo día. Prisma no soporta TO_CHAR en groupBy.
   */
  async getDayAggregatesByBusiness(
    businessId: string,
    where: { type?: MovementType; dateGte?: Date; dateLte?: Date },
  ): Promise<DayMovementAggregate[]> {
    const typeCondition = where.type
      ? Prisma.sql`AND type = ${where.type}::"MovementType"`
      : Prisma.sql``;

    const dateCondition =
      where.dateGte && where.dateLte
        ? Prisma.sql`AND date >= ${where.dateGte}::date AND date <= ${where.dateLte}::date`
        : Prisma.sql``;

    return this.prisma.$queryRaw<DayMovementAggregate[]>`
      SELECT
        TO_CHAR(date AT 'YYYY-MM-DD') AS date,
        type,
        SUM(value)::float AS value
      FROM movements
      WHERE business_id = ${businessId}::text
        ${typeCondition}
        ${dateCondition}
      GROUP BY date, type
      ORDER BY date ASC
    `;
  }
}
