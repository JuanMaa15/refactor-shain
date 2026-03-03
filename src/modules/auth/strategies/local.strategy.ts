import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '@modules/auth/services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private AuthService: AuthService) {
    super({
      usernameField: 'username',
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
  async validate(username: string, password: string) {
    const user = await this.AuthService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }
    return user;
  }
}
