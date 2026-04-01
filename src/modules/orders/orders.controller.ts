import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una orden de pago pendiente' })
  @ApiResponse({ status: 201, description: 'Orden creada exitosamente' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(createOrderDto);

    return {
      status: 'success',
      data: order,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todas las órdenes' })
  @ApiResponse({ status: 200, description: 'Listado de órdenes' })
  async findAll() {
    const orders = await this.ordersService.findAll();

    return {
      status: 'success',
      data: orders,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener una orden por ID' })
  @ApiResponse({ status: 200, description: 'Orden encontrada' })
  async findOne(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);

    return {
      status: 'success',
      data: order,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una orden' })
  @ApiResponse({ status: 200, description: 'Orden actualizada' })
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    const order = await this.ordersService.update(id, updateOrderDto);

    return {
      status: 'success',
      data: order,
    };
  }

  @Get(':id/transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener transacciones asociadas a una orden' })
  @ApiResponse({ status: 200, description: 'Transacciones de la orden' })
  async findTransactions(@Param('id') id: string) {
    const transactions = await this.ordersService.findTransactionsByOrder(id);

    return {
      status: 'success',
      data: transactions,
    };
  }
}
