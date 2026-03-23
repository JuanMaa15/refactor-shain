import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { CloudinaryService } from '@/modules/storage/cloudinary.service';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService, CloudinaryService],
  exports: [BusinessService],
})
export class BusinessModule {}
