import { Business } from '@/generated/prisma/client';

/**
 * Negocio público — lo que retorna la API.
 * No exponemos ownerId directamente (está implícito en la relación owner).
 */
export type PublicBusiness = Omit<Business, 'ownerId'>;

/**
 * Resultado de subir imagen a Cloudinary.
 * Tipamos solo los campos que usamos para no depender
 * de los tipos de la librería cloudinary directamente en el service.
 */
export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}
