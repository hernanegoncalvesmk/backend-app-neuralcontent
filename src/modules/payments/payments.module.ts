import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { PaymentsController } from './payments.controller';
import { PaymentsService, StripeService, PayPalService } from './services';
import { Payment } from './entities/payment.entity';
import { UserSubscription } from './entities/user-subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, UserSubscription]),
    ConfigModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService, PayPalService],
  exports: [PaymentsService, StripeService, PayPalService, TypeOrmModule],
})
export class PaymentsModule {}
