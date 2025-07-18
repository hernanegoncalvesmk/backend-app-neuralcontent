import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsPositive,
  IsEnum,
  IsOptional,
  IsString,
  IsObject,
  IsUUID,
  IsIP,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreditService } from '../entities/credit-transaction.entity';

/**
 * DTO para consumo de créditos
 */
export class ConsumeCreditsDto {
  @ApiProperty({
    description: 'ID do usuário que está consumindo os créditos',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Quantidade de créditos a serem consumidos',
    example: 50,
    minimum: 1,
    maximum: 10000,
  })
  @IsNotEmpty()
  @IsPositive()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Tipo de serviço que consumirá os créditos',
    enum: CreditService,
    example: CreditService.CONTENT_GENERATION,
  })
  @IsEnum(CreditService)
  serviceType: CreditService;

  @ApiProperty({
    description: 'Descrição detalhada do consumo',
    example: 'Geração de texto com 1500 tokens usando modelo GPT-4',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 500)
  description: string;

  @ApiProperty({
    description: 'ID da sessão ou processo que originou o consumo',
    example: 'session_12345',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  sessionId?: string;

  @ApiProperty({
    description: 'IP do cliente',
    example: '192.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsIP()
  clientIp?: string;

  @ApiProperty({
    description: 'User agent do cliente',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  userAgent?: string;

  @ApiProperty({
    description: 'Metadados adicionais do consumo',
    example: {
      requestId: 'req_12345',
      model: 'gpt-4',
      tokens: 1500,
      duration: 2.5,
      parameters: {
        temperature: 0.7,
        maxTokens: 2000,
      },
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO de resposta para consumo de créditos
 */
export class ConsumeCreditsResponseDto {
  @ApiProperty({
    description: 'Se o consumo foi bem-sucedido',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ID da transação criada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  transactionId: string;

  @ApiProperty({
    description: 'Quantidade de créditos consumidos',
    example: 50,
  })
  amountConsumed: number;

  @ApiProperty({
    description: 'Saldo de créditos após o consumo',
    example: 950,
  })
  newBalance: number;

  @ApiProperty({
    description: 'Saldo anterior',
    example: 1000,
  })
  previousBalance: number;

  @ApiProperty({
    description: 'Tipo do serviço consumido',
    enum: CreditService,
    example: CreditService.CONTENT_GENERATION,
  })
  serviceType: CreditService;

  @ApiProperty({
    description: 'Mensagem descritiva do resultado',
    example: 'Créditos consumidos com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp do consumo',
    example: '2025-07-14T10:15:00.000Z',
  })
  timestamp: Date;
}

/**
 * DTO para validação de saldo antes do consumo
 */
export class ValidateCreditsDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Quantidade de créditos necessários',
    example: 50,
    minimum: 1,
    maximum: 10000,
  })
  @IsNotEmpty()
  @IsPositive()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Tipo do serviço para calcular custo',
    enum: CreditService,
    example: CreditService.CONTENT_GENERATION,
  })
  @IsNotEmpty()
  @IsEnum(CreditService)
  serviceType: CreditService;
}

/**
 * DTO de resposta para validação de créditos
 */
export class ValidateCreditsResponseDto {
  @ApiProperty({
    description: 'Se o usuário tem créditos suficientes',
    example: true,
  })
  hasEnoughCredits: boolean;

  @ApiProperty({
    description: 'Saldo atual de créditos',
    example: 1000,
  })
  currentBalance: number;

  @ApiProperty({
    description: 'Quantidade necessária',
    example: 50,
  })
  requiredAmount: number;

  @ApiProperty({
    description: 'Custo do serviço calculado',
    example: 100,
  })
  serviceCost: number;

  @ApiProperty({
    description: 'Créditos restantes após a operação',
    example: 900,
  })
  remaining: number;

  @ApiProperty({
    description: 'Se pode prosseguir com a operação',
    example: true,
  })
  canProceed: boolean;

  @ApiProperty({
    description: 'Tipo do serviço',
    enum: CreditService,
    example: CreditService.CONTENT_GENERATION,
  })
  serviceType: CreditService;

  @ApiProperty({
    description: 'Mensagem explicativa',
    example: 'Saldo suficiente para a operação',
  })
  message: string;
}
