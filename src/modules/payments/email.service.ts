import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOrderCodes(
    recipient: string,
    reference: string,
    codes: { code: string; role: string }[],
  ): Promise<void> {
    const apiKey = this.configService.get<string>('email.resend.apiKey');
    const from = this.configService.get<string>('email.resend.from');

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY no configurada, los códigos de ingreso no se enviarán por correo',
      );
      return;
    }

    const htmlLines = codes
      .map(
        ({ code, role }) =>
          `<li style="margin-bottom: 0.4rem;"><strong>${code}</strong> — ${role}</li>`,
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
        <p>Buen día,</p>
        <p>Tu pago ha sido aprobado y los códigos de ingreso asociados a la orden <strong>${reference}</strong> son:</p>
        <ul style="padding-left: 1rem;">${htmlLines}</ul>
        <p>Usa cada código según el rol asignado para completar el registro en la plataforma.</p>
        <p>Gracias por confiar en Shain.</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: `Códigos de ingreso Shain - Orden ${reference}`,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(
        `Error al enviar correo: ${response.status} ${errorText}`,
      );
    }

    this.logger.log(
      `Correo de códigos enviado a ${recipient} para la orden ${reference}`,
    );
  }

  async sendRenewalConfirmation(
    recipient: string,
    reference: string,
    endDate: Date,
  ): Promise<void> {
    const apiKey = this.configService.get<string>('email.resend.apiKey');
    const from = this.configService.get<string>('email.resend.from');

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY no configurada, la confirmación de renovación no se enviará por correo',
      );
      return;
    }

    const formattedDate = endDate.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
        <p>Buen día,</p>
        <p>Tu suscripción ha sido renovada exitosamente. Los detalles de tu renovación son:</p>
        <ul style="padding-left: 1rem;">
          <li><strong>Referencia:</strong> ${reference}</li>
          <li><strong>Acceso activo hasta:</strong> ${formattedDate}</li>
        </ul>
        <p>Todos los miembros de tu negocio podrán continuar usando la plataforma sin interrupciones.</p>
        <p>Gracias por confiar en Shain.</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: `Renovación confirmada - Shain (${reference})`,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(
        `Error al enviar correo de renovación: ${response.status} ${errorText}`,
      );
    }

    this.logger.log(
      `Correo de renovación enviado a ${recipient} para la orden ${reference}`,
    );
  }
}
