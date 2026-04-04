import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { Public } from '@/modules/auth/decorators';

@ApiTags('Payments')
@Controller('transactions')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recibir notificación de Wompi' })
  @ApiResponse({ status: 200, description: 'Webhook procesado correctamente' })
  @ApiResponse({ status: 401, description: 'Firma de webhook inválida' })
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-wompi-signature') signature: string | undefined,
  ) {
    console.log(req.body);
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));
    return this.paymentsService.processWebhook(rawBody, signature);
  }
}
