import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@/generated/prisma/enums';
import { Roles, Public } from '@/modules/auth/decorators';
import { RolesGuard } from '@/modules/auth/guards';
import { OrdersService } from '@/modules/orders/orders.service';
import { CreateOrderDto } from '@/modules/orders/dto/create-order.dto';
import { UpdateOrderDto } from '@/modules/orders/dto/update-order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Público: el cliente crea una orden antes de pagar (no está autenticado aún)
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear orden de pago (público)' })
  async create(@Body() dto: CreateOrderDto) {
    return { status: 'success', data: await this.ordersService.create(dto) };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('token_shain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Listar todas las órdenes' })
  async findAll() {
    return { status: 'success', data: await this.ordersService.findAll() };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('token_shain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Obtener orden por ID' })
  async findOne(@Param('id') id: string) {
    return { status: 'success', data: await this.ordersService.findOne(id) };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('token_shain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Actualizar orden' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return {
      status: 'success',
      data: await this.ordersService.update(id, dto),
    };
  }

  @Get(':id/transactions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('token_shain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Transacciones de una orden' })
  async findTransactions(@Param('id') id: string) {
    return {
      status: 'success',
      data: await this.ordersService.findTransactionsByOrder(id),
    };
  }
}
