import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private AuthService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  /**
   * Método que Passport llama automáticamente
   *
   * @param username - Username del body
   * @param password - Password del body
   * @returns Usuario si las credenciales son válidas
   * @throws UnauthorizedException si las credenciales son inválidas
   */
  async validate(email: string, password: string) {
    const user = await this.AuthService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }
    return user;
  }
}
