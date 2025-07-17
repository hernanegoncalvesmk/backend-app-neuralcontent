import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { Plan, Feature, PlanFeature } from './entities';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, Feature, PlanFeature]),
    AuthModule, // Para AuthGuard e JWT
  ],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService, TypeOrmModule],
})
export class PlansModule {}
