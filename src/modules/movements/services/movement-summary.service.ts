import { Injectable } from '@nestjs/common';
import { UserRole } from '@/generated/prisma/enums';
import { PrismaService } from '@/database/prisma.service';
import { MovementRepository } from '@/modules/movements/movement.repository';
import { MovementService } from './movement.service';
import {
  DayStatistics,
  EmployeeGoalProgress,
  MonthStatistics,
  MovementSummary,
  YearStatistics,
} from '@modules/movements/interfaces';
import {
  getMonthRange,
  getYearRange,
  getYesterdayDate,
} from '@modules/movements/movement-date.util';

@Injectable()
export class MovementSummaryService {
  constructor(
    private readonly movementRepository: MovementRepository,
    private readonly movementService: MovementService,
    private readonly prisma: PrismaService,
  ) {}

  async getSummaryAndStatistics(params: {
    date: Date;
    userId: string;
    businessId: string | null;
    role: string;
    goalUser: number;
  }): Promise<MovementSummary> {
    const { date, userId, businessId, role, goalUser } = params;
    const isOwner = role === UserRole.BUSINESS_OWNER;

    const [totalRows, dayStatistics, monthStatistics, yearStatistics] =
      await Promise.all([
        this.movementRepository.getTotalsByFilter({ userId }),
        this.getDayStatistics({ date, userId, businessId, isOwner }),
        this.getMonthStatistics({ userId, businessId, isOwner, goalUser }),
        this.getYearStatistics({ userId, businessId, isOwner }),
      ]);

    const totals = this.movementService.formatTotals(totalRows);

    const base: MovementSummary = {
      dayStatistics,
      monthStatistics,
      yearStatistics,
      totalIncomes: totals.incomes,
      totalExpenses: totals.expenses,
    };

    if (isOwner && businessId) {
      const { start, end } = getYearRange();
      const businessRows = await this.movementRepository.getTotalsByFilter({
        businessId,
        date: { gte: start, lte: end },
      });
      const businessTotals = this.movementService.formatTotals(businessRows);

      return {
        ...base,
        totalBusinessIncomes: businessTotals.incomes,
        totalBusinessExpenses: businessTotals.expenses,
        profitMargin: businessTotals.incomes - businessTotals.expenses,
      };
    }

    return base;
  }

  // ─── Estadísticas diarias ──────────────────────────────────────────────────

  private async getDayStatistics(params: {
    date: Date;
    userId: string;
    businessId: string | null;
    isOwner: boolean;
  }): Promise<DayStatistics> {
    const { date, userId, businessId, isOwner } = params;
    const yesterday = getYesterdayDate(date);

    const dayWhere =
      isOwner && businessId ? { businessId, date } : { userId, date };

    const yesterdayWhere =
      isOwner && businessId
        ? { businessId, date: yesterday }
        : { userId, date: yesterday };

    const [todayRows, yesterdayRows] = await Promise.all([
      this.movementRepository.getTotalsByFilter(dayWhere),
      this.movementRepository.getTotalsByFilter(yesterdayWhere),
    ]);

    const today = this.movementService.formatTotals(todayRows);
    const yesterdayTotals = this.movementService.formatTotals(yesterdayRows);

    const dailyBalance = today.incomes - today.expenses;
    const yesterdayBalance = yesterdayTotals.incomes - yesterdayTotals.expenses;
    const salesIncreaseAmountDay = dailyBalance - yesterdayBalance;

    const existMovements = today.incomes !== 0 || today.expenses !== 0;

    let salesGrowthPercentageDay = 0;
    if (existMovements && yesterdayBalance !== 0) {
      const raw = (salesIncreaseAmountDay / Math.abs(yesterdayBalance)) * 100;
      salesGrowthPercentageDay = isFinite(raw) ? Math.round(raw) : 0;
    }

    return {
      totalTransactionsDay: today,
      dailyBalance,
      salesIncreaseAmountDay: existMovements
        ? Math.round(salesIncreaseAmountDay)
        : 0,
      salesGrowthPercentageDay,
    };
  }

  // ─── Estadísticas mensuales ────────────────────────────────────────────────

  private async getMonthStatistics(params: {
    userId: string;
    businessId: string | null;
    isOwner: boolean;
    goalUser: number;
  }): Promise<MonthStatistics> {
    const { userId, businessId, isOwner, goalUser } = params;
    const { start, end } = getMonthRange();

    const where =
      isOwner && businessId
        ? { businessId, date: { gte: start, lte: end } }
        : { userId, date: { gte: start, lte: end } };

    const rows = await this.movementRepository.getTotalsByFilter(where);
    const totals = this.movementService.formatTotals(rows);
    const monthBalance = totals.incomes - totals.expenses;

    if (isOwner && businessId) {
      const business = await this.prisma.business.findUnique({
        where: { id: businessId },
        select: { goal: true },
      });

      const goal = Number(business?.goal ?? 0);
      const salesGrowthPercentageMonth =
        goal > 0
          ? Math.round(Math.min(100, Math.max(0, (monthBalance * 100) / goal)))
          : 0;

      const salesCompletePercentageGoalUsers =
        await this.getEmployeesGoalProgress(businessId, start, end);

      return {
        totalTransactionsMonth: totals,
        monthBalance,
        salesGrowthPercentageMonth,
        goal,
        salesCompletePercentageGoalUsers,
      };
    }

    const salesGrowthPercentageMonth =
      goalUser > 0
        ? Math.round(
            Math.min(100, Math.max(0, (monthBalance * 100) / goalUser)),
          )
        : 0;

    return {
      totalTransactionsMonth: totals,
      monthBalance,
      salesGrowthPercentageMonth,
      goal: goalUser,
    };
  }

  // ─── Estadísticas anuales ──────────────────────────────────────────────────

  private async getYearStatistics(params: {
    userId: string;
    businessId: string | null;
    isOwner: boolean;
  }): Promise<YearStatistics> {
    const { userId, businessId, isOwner } = params;
    const { start, end } = getYearRange();

    const where =
      isOwner && businessId
        ? { businessId, date: { gte: start, lte: end } }
        : { userId, date: { gte: start, lte: end } };

    const rows = await this.movementRepository.getTotalsByFilter(where);
    return { totalTransactionsYear: this.movementService.formatTotals(rows) };
  }

  // ─── Progreso de metas por empleado ───────────────────────────────────────

  private async getEmployeesGoalProgress(
    businessId: string,
    start: Date,
    end: Date,
  ): Promise<EmployeeGoalProgress[]> {
    const employees = await this.prisma.user.findMany({
      where: { businessId },
      select: { id: true, name: true, lastName: true, goal: true },
    });

    return Promise.all(
      employees.map(async (emp) => {
        const rows = await this.movementRepository.getTotalsByFilter({
          userId: emp.id,
          date: { gte: start, lte: end },
        });

        const totals = this.movementService.formatTotals(rows);
        const monthBalance = totals.incomes - totals.expenses;
        const goal = Number(emp.goal ?? 0);

        return {
          name: `${emp.name} ${emp.lastName}`,
          monthBalance,
          goal,
          salesCompletePercentageGoal:
            goal > 0
              ? Math.round(
                  Math.min(100, Math.max(0, (monthBalance * 100) / goal)),
                )
              : 0,
        };
      }),
    );
  }
}
