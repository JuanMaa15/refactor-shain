import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * PrismaService con adaptador nativo PostgreSQL (Prisma 7)
 *
 * VENTAJAS DEL ADAPTADOR NATIVO:
 * 1. Mejor performance (usa pg nativo en lugar de driver genérico)
 * 2. Connection pooling optimizado
 * 3. Manejo de conexiones más eficiente
 * 4. Menor latencia en queries
 * 5. Mejor uso de recursos
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

    // ============================================
    // PRISMA 7: Pool de conexiones PostgreSQL
    // ============================================
    const pool = new Pool({
      connectionString: configService.get<string>('database.url'),

      // Configuración optimizada del pool
      max: isProduction ? 20 : 10, // Máximo de conexiones
      min: 2, // Mínimo de conexiones siempre activas
      idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexión idle
      connectionTimeoutMillis: 2000, // Timeout para obtener conexión

      // Prisma 7: Statement timeout
      statement_timeout: 30000, // 30 segundos max por query

      // Prisma 7: Keep alive
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Event handlers del pool
    pool.on('connect', (client) => {
      isDevelopment && logger.debug('New client connected to pool');
    });

    pool.on('error', (err, client) => {
      logger.error('Unexpected error on idle client', err);
    });

    // ============================================
    // PRISMA 7: Adaptador nativo PostgreSQL
    // ============================================
    const adapter = new PrismaPg(pool);

    // ============================================
    // Inicializar PrismaClient con adaptador
    // ============================================
    super({
      adapter, // ← Aquí está la magia de Prisma 7

      log: isDevelopment
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
          ]
        : [
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ],

      errorFormat: isDevelopment ? 'pretty' : 'minimal',
    });

    this.pool = pool;

    // ============================================
    // Event Handlers
    // ============================================

    // Queries (solo desarrollo)
    if (isDevelopment) {
      this.$on('query' as never, (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // Errores
    this.$on('error' as never, (e: any) => {
      this.logger.error('Prisma Error:', e);
    });

    // Warnings
    this.$on('warn' as never, (e: any) => {
      this.logger.warn('Prisma Warning:', e);
    });

    // Info
    if (isDevelopment) {
      this.$on('info' as never, (e: any) => {
        this.logger.log('Prisma Info:', e);
      });
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();

      this.logger.log('✅ Database connected successfully');
      this.logger.log('🚀 Using Prisma 7 with PostgreSQL Native Adapter');

      // Log de estadísticas del pool
      const stats = this.getPoolStats();
      this.logger.log(
        `📊 Connection Pool: Total=${stats.total}, Idle=${stats.idle}, Waiting=${stats.waiting}`,
      );

      // Health check inicial
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        throw new Error('Database health check failed');
      }
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Database disconnected gracefully');
  }

  // ============================================
  // MÉTODOS ÚTILES
  // ============================================

  /**
   * Obtiene estadísticas del pool de conexiones
   */
  getPoolStats() {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }

  /**
   * Health check de la base de datos
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Obtiene información de conexiones activas (PostgreSQL)
   */
  async getConnectionInfo() {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }

    try {
      const result = await this.$queryRaw<
        Array<{
          count: bigint;
          state: string;
        }>
      >`
        SELECT 
          count(*) as count,
          state
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `;

      return result.map((r) => ({
        count: Number(r.count),
        state: r.state,
      }));
    } catch (error) {
      this.logger.error('Failed to get connection info:', error);
      return null;
    }
  }

  /**
   * Limpia toda la base de datos (SOLO TESTING)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ Cannot clean database in production!');
    }

    // Orden de eliminación respetando foreign keys
    const deletionOrder = [
      'auditLog',
      'refreshToken',
      'resetToken',
      'booking',
      'timeSlot',
      'movement',
      'business',
      'user',
    ];

    this.logger.warn('⚠️  Starting database cleanup...');

    for (const modelName of deletionOrder) {
      const model = this[modelName as keyof this];
      if (model && typeof model === 'object' && 'deleteMany' in model) {
        await (model as any).deleteMany({});
        this.logger.debug(`✓ Cleaned table: ${modelName}`);
      }
    }

    this.logger.warn('⚠️  Database cleaned (all data deleted)');
  }

  /**
   * Ejecuta una transacción con retry automático
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Solo retry en errores de serialización/deadlock
        const shouldRetry =
          error instanceof Error &&
          (error.message.includes('serialization') ||
            error.message.includes('deadlock'));

        if (!shouldRetry || attempt === maxRetries) {
          throw error;
        }

        this.logger.warn(
          `Transaction failed (attempt ${attempt}/${maxRetries}), retrying...`,
        );

        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 100),
        );
      }
    }

    throw lastError!;
  }
}
