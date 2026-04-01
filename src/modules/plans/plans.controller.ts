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
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo plan' })
  @ApiResponse({ status: 201, description: 'Plan creado exitosamente' })
  async create(@Body() createPlanDto: CreatePlanDto) {
    const plan = await this.plansService.create(createPlanDto);

    return {
      status: 'success',
      data: plan,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todos los planes' })
  @ApiResponse({ status: 200, description: 'Listado de planes' })
  async findAll() {
    const plans = await this.plansService.findAll();

    return {
      status: 'success',
      data: plans,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un plan por ID' })
  @ApiResponse({ status: 200, description: 'Plan encontrado' })
  async findOne(@Param('id') id: string) {
    const plan = await this.plansService.findOne(id);

    return {
      status: 'success',
      data: plan,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un plan' })
  @ApiResponse({ status: 200, description: 'Plan actualizado' })
  async update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    const plan = await this.plansService.update(id, updatePlanDto);

    return {
      status: 'success',
      data: plan,
    };
  }
}
