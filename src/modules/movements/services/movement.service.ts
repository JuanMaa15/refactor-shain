import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Movement, MovementType, Prisma } from '@/generated/prisma/client';
import { MovementRepository } from '@modules/movements/movement.repository';
import {
  CreateMovementDto,
  GetMovementsQueryDto,
  UpdateMovementDto,
} from '@modules/movements/dto';
import {
  DayMovementAggregate,
  MovementListResult,
  PublicMovement,
  TransactionTotals,
} from '@modules/movements/interfaces';
import { buildDateFilter, getLastDaysRange } from '../movement-date.util';

@Injectable()
export class MovementService {
  private logger = new Logger(MovementService.name);

  constructor(private readonly movementRepository: MovementRepository) {}

  async create(
    dto: CreateMovementDto,
    userId: string,
    businessId: string,
  ): Promise<PublicMovement> {
    const movement = await this.movementRepository.create({
      type: dto.type,
      frequency: dto.frequency ?? null,
      value: dto.value,
      description: dto.description ?? null,
      date: new Date(dto.date),
      user: { connect: { id: userId } },
      business: { connect: { id: businessId } },
    });

    return this.formatMovement(movement);
  }

  async update(
    id: string,
    dto: UpdateMovementDto,
    requestingUserId: string,
  ): Promise<PublicMovement> {
    await this.assertOwnership(id, requestingUserId);

    const data: Prisma.MovementUpdateInput = {
      ...dto,
      ...(dto.date && { date: new Date(dto.date) }),
    };

    const updated = await this.movementRepository.update(id, data);
    return this.formatMovement(updated);
  }

  async delete(id: string, requestingUserId: string): Promise<void> {
    await this.assertOwnership(id, requestingUserId);
    await this.movementRepository.delete(id);
  }

  async findOne(id: string): Promise<PublicMovement> {
    const movement = await this.movementRepository.findById(id);
    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    return this.formatMovement(movement);
  }

  async findByUser(
    userId: string,
    query: GetMovementsQueryDto,
  ): Promise<MovementListResult> {
    const where: Prisma.MovementWhereInput = {};

    if (query.type) where.type = query.type;

    const dateFilter = buildDateFilter(query.filterDate, query.from, query.to);
    if (dateFilter) where.date = dateFilter;

    const movements = await this.movementRepository.findManyByUser(
      userId,
      where,
    );
    const formatted = movements.map((m) => this.formatMovement(m));

    return this.buildListResult(formatted, query.type);
  }

  async findByBusiness(
    businessId: string,
    query: GetMovementsQueryDto,
  ): Promise<DayMovementAggregate[]> {
    const dateFilter = buildDateFilter(query.filterDate, query.from, query.to);

    const movements = await this.movementRepository.getDayAggregatesByBusiness(
      businessId,
      {
        type: query.type,
        dateGte: dateFilter?.gte,
        dateLte: dateFilter?.lte,
      },
    );

    this.logger.debug(
      `Agregados por día para negocio ${businessId} con filtro ${JSON.stringify(
        query,
      )}: ${JSON.stringify(movements)}`,
    );

    return movements;
  }

  async findLastDays(
    userId: string,
    days: number,
  ): Promise<{ incomes: PublicMovement[]; expense: PublicMovement[] }> {
    const { start, end } = getLastDaysRange(days);
    const rows = await this.movementRepository.findLastDaysByUser(
      userId,
      start,
      end,
    );

    const formatted = rows.map((m) => ({
      ...m,
      value: m.value,
      date: this.formatDate(m.date),
    })) as PublicMovement[];

    return {
      incomes: formatted.filter((m) => m.type === MovementType.INCOME),
      expense: formatted.filter((m) => m.type === MovementType.EXPENSE),
    };
  }

  // ─── Helper compartido con MovementSummaryService ─────────────────────────

  /**
   * Convierte el resultado de groupBy a { incomes, expenses }.
   * Centralizado aquí para evitar la dependencia circular que existía
   * en el original entre movementSummaryService y movementAggregationService.
   */
  formatTotals(
    rows: { type: MovementType; _sum: { value: Prisma.Decimal | null } }[],
  ): TransactionTotals {
    const map = Object.fromEntries(
      rows.map((r) => [r.type, Number(r._sum.value ?? 0)]),
    );
    return {
      incomes: map[MovementType.INCOME] ?? 0,
      expenses: map[MovementType.EXPENSE] ?? 0,
    };
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  private async assertOwnership(id: string, userId: string): Promise<void> {
    const movement = await this.movementRepository.findById(id);
    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    if (movement.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este movimiento',
      );
    }
  }

  formatMovement(m: Movement): PublicMovement {
    const { userId: _userId, businessId: _businessId, ...rest } = m;
    return { ...rest, date: this.formatDate(m.date) };
  }

  private formatDate(date: Date | string): string {
    if (date instanceof Date) return date.toISOString().slice(0, 10);
    return String(date).slice(0, 10);
  }

  private buildListResult(
    movements: PublicMovement[],
    type?: MovementType,
  ): MovementListResult {
    if (!type) {
      return {
        movements,
        totalIncomes: movements
          .filter((m) => m.type === MovementType.INCOME)
          .reduce((acc, m) => acc + Number(m.value), 0),
        totalExpenses: movements
          .filter((m) => m.type === MovementType.EXPENSE)
          .reduce((acc, m) => acc + Number(m.value), 0),
      };
    }

    const total = movements.reduce((acc, m) => acc + Number(m.value), 0);
    return {
      movements,
      ...(type === MovementType.INCOME
        ? { totalIncomes: total }
        : { totalExpenses: total }),
    };
  }
}
