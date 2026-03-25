import { Movement, MovementType } from '@/generated/prisma/client';

// ─── Tipos de retorno público ────────────────────────────────────────────────

/**
 * Movimiento tal como se devuelve al cliente.
 * `date` se serializa como string 'YYYY-MM-DD' (no como ISO timestamp completo),
 * ya que el negocio solo trabaja con fechas, no con horas.
 */
export type PublicMovement = Omit<
  Movement,
  'userId' | 'businessId' | 'date'
> & {
  date: string;
};

// ─── Resumen financiero ───────────────────────────────────────────────────────

export interface TransactionTotals {
  incomes: number;
  expenses: number;
}

export interface DayStatistics {
  totalTransactionsDay: TransactionTotals;
  dailyBalance: number;
  salesIncreaseAmountDay: number;
  /** % de crecimiento vs ayer. null = ayer fue 0 y hoy tampoco (indeterminado → se envía 0) */
  salesGrowthPercentageDay: number;
}

export interface MonthStatistics {
  totalTransactionsMonth: TransactionTotals;
  monthBalance: number;
  /** % completado de la meta mensual (0-100) */
  salesGrowthPercentageMonth: number;
  goal: number;
  /** Solo para BUSINESS_OWNER: desglose por empleado */
  salesCompletePercentageGoalUsers?: EmployeeGoalProgress[];
}

export interface YearStatistics {
  totalTransactionsYear: TransactionTotals;
}

export interface EmployeeGoalProgress {
  name: string;
  monthBalance: number;
  goal: number;
  salesCompletePercentageGoal: number;
}

// ─── Resumen completo (getSummary) ───────────────────────────────────────────

export interface MovementSummary {
  dayStatistics: DayStatistics;
  monthStatistics: MonthStatistics;
  yearStatistics: YearStatistics;
  totalIncomes: number;
  totalExpenses: number;
  // Solo BUSINESS_OWNER:
  totalBusinessIncomes?: number;
  totalBusinessExpenses?: number;
  profitMargin?: number;
}

// ─── Resultado de getMovementsByFilters ──────────────────────────────────────

export interface MovementListResult {
  movements: PublicMovement[];
  totalIncomes?: number;
  totalExpenses?: number;
}

/**
 * Resultado agregado para consultas de negocio (agrupado por día y tipo).
 * Equivale a la pipeline de movementAggregationService.getDayMovementsFilters()
 */
export interface DayMovementAggregate {
  date: string; // 'YYYY-MM-DD'
  type: MovementType;
  value: number;
}

// ─── Filtros de consulta ──────────────────────────────────────────────────────

export type FilterDate =
  | 'sevenDays'
  | 'month'
  | 'quarter'
  | 'year'
  | 'other'
  | 'all';
