import { PrismaService } from '@/database/prisma.service';
import { UpdateBusinessDto } from '@/modules/business/dto';
import { PublicBusiness } from '@/modules/business/interfaces';
import { CloudinaryService } from '@/modules/storage/cloudinary.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findOneById(id: string): Promise<PublicBusiness> {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    // Omitimos ownerId de la respuesta pública
    const { ownerId: _, ...publicBusiness } = business;
    return publicBusiness;
  }

  async findByOwnerId(ownerId: string): Promise<PublicBusiness | null> {
    const business = await this.prisma.business.findUnique({
      where: { ownerId },
    });

    if (!business) return null;

    const { ownerId: _, ...publicBusiness } = business;
    return publicBusiness;
  }

  async findByJoinCode(code: string) {
    return this.prisma.business.findUnique({
      where: { businessJoinCode: code },
    });
  }

  async createBusiness(data: { ownerId: string; businessJoinCode: string }) {
    return this.prisma.business.create({
      data: {
        ...data,
        goal: 0,
      },
    });
  }

  async updateBusiness(
    id: string,
    requestingUserId: string,
    dto: UpdateBusinessDto,
    imageBuffer?: Buffer,
  ): Promise<PublicBusiness> {
    // 1. Verificar que el negocio existe
    const business = await this.prisma.business.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    // 2. Verificar ownership: solo el dueño puede actualizar su negocio
    if (business.ownerId !== requestingUserId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este negocio',
      );
    }

    // 3. Procesar imagen si se envió una
    let imageUrl: string | undefined;
    if (imageBuffer) {
      const uploaded = await this.cloudinaryService.uploadImage(
        imageBuffer,
        'business', // Carpeta en Cloudinary — igual que en Express original
      );
      imageUrl = uploaded.secure_url;
    }

    // 4. Actualizar negocio
    const updated = await this.prisma.business.update({
      where: { id },
      data: {
        ...dto,
        ...(imageUrl && { imageUrl }), // Solo incluir imageUrl si se subió imagen
      },
    });

    const { ownerId: _, ...publicBusiness } = updated;
    return publicBusiness;
  }
}
