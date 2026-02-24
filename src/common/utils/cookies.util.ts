import { Response } from 'express';

export interface CookieConfig {
  name: string;
  value: string;
  maxAge: number;
  isProduction: boolean;
  domain?: string;
}

export interface CreateAuthTokens {
  res: Response;
  accessToken: string;
  refreshToken: string;
  isProduction: boolean;
  domain?: string;
}

/**
 * Configura una cookie de autenticación de forma segura
 *
 * @param res - Response de Express
 * @param config - Configuración de la cookie
 *
 * @example
 * setAuthCookie(res, {
 *   name: 'token_shain',
 *   value: accessToken,
 *   maxAge: 15 * 60 * 1000, // 15 minutos
 *   isProduction: process.env.NODE_ENV === 'production',
 *   domain: '.shain.finance'
 * });
 */
export function setAuthCookie(res: Response, config: CookieConfig): void {
  res.cookie(config.name, config.value, {
    maxAge: config.maxAge,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'lax' : 'strict',
    httpOnly: true,
    domain: config.domain,
    path: '/',
  });
}

/**
 * Elimina una cookie de autenticación
 *
 * @param res - Response de Express
 * @param name - Nombre de la cookie a eliminar
 * @param domain - Dominio de la cookie (opcional)
 *
 * @example
 * clearAuthCookie(res, 'token_shain', '.shain.finance');
 */
export function clearAuthCookie(
  res: Response,
  name: string,
  domain?: string,
): void {
  res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
    domain,
    path: '/',
  });
}

/**
 * Configura cookies de access token y refresh token
 *
 * @param res - Response de Express
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token
 * @param isProduction - Si está en producción
 * @param domain - Dominio de las cookies (opcional)
 *
 * @example
 * setAuthTokens({res, accessToken, refreshToken, isProduction:true, domain:'.shain.finance'});
 */
export function setAuthTokens({
  res,
  accessToken,
  refreshToken,
  isProduction,
  domain,
}: CreateAuthTokens): void {
  setAuthCookie(res, {
    name: 'token_shain',
    value: accessToken,
    maxAge: 15 * 60 * 1000, // 15 minutos
    isProduction,
    domain,
  });
  setAuthCookie(res, {
    name: 'refresh_token_shain',
    value: refreshToken,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    isProduction,
    domain,
  });
}

/**
 * Limpia todas las cookies de autenticación (logout)
 *
 * @param res - Response de Express
 * @param domain - Dominio de las cookies (opcional)
 *
 * @example
 * clearAuthTokens(res, '.shain.finance');
 */
export function clearAuthTokens(res: Response, domain?: string): void {
  clearAuthCookie(res, 'token_shain', domain);
  clearAuthCookie(res, 'refresh_token', domain);
}
