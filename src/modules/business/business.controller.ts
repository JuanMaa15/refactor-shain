import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import {
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles } from '@/modules/auth/decorators';
import { UserRole } from '@/generated/prisma/enums';
import { RolesGuard } from '@/modules/auth/guards';
import { CurrentUser as CurrentUserInterface } from '@/modules/auth/interfaces';
import { ImageUploadInterceptor } from '@/common/interceptors/image-upload.interceptor';
import { UpdateBusinessDto } from '@/modules/business/dto';

@ApiTags('Business')
@ApiCookieAuth('token_shain')
@UseGuards(RolesGuard)
@Roles(UserRole.BUSINESS_OWNER)
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[BUSINESS_OWNER] Obtener datos del negocio' })
  @ApiResponse({ status: 200, description: 'Datos del negocio' })
  @ApiResponse({ status: 403, description: 'No eres el dueño de este negocio' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  async getBusiness(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() _user: CurrentUserInterface,
  ) {
    // Pasamos el userId para que el service verifique ownership
    const business = await this.businessService.findOneById(id);

    return {
      status: 'success',
      data: business,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ImageUploadInterceptor)
  @ApiOperation({ summary: '[BUSINESS_OWNER] Actualizar datos del negocio' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Negocio actualizado correctamente',
  })
  @ApiResponse({ status: 403, description: 'No eres el dueño de este negocio' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  @ApiResponse({
    status: 413,
    description: 'Imagen demasiado grande (máx 5MB)',
  })
  @ApiResponse({ status: 415, description: 'Tipo de imagen no permitido' })
  async updateBusiness(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const updated = await this.businessService.updateBusiness(
      id,
      userId,
      updateBusinessDto,
      image?.buffer, // Si no hay imagen, será undefined → el service lo maneja
    );

    return {
      status: 'success',
      message: 'Negocio actualizado correctamente.',
      data: updated,
    };
  }
}
