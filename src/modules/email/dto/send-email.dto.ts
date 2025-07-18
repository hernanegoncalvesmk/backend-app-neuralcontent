import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailAttachmentDto {
  @ApiProperty({
    description: 'Nome do arquivo',
    example: 'documento.pdf',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'Conteúdo do arquivo em base64 ou buffer',
    example: 'data:application/pdf;base64,JVBERi0xLjQK...',
  })
  @IsNotEmpty()
  content: string | Buffer;

  @ApiPropertyOptional({
    description: 'Tipo MIME do arquivo',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  contentType?: string;
}

export class SendEmailDto {
  @ApiProperty({
    description: 'Email do destinatário',
    example: 'usuario@neuralcontent.com',
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiPropertyOptional({
    description: 'Lista de emails em cópia',
    example: ['admin@neuralcontent.com'],
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({
    description: 'Lista de emails em cópia oculta',
    example: ['backup@neuralcontent.com'],
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiProperty({
    description: 'Assunto do email',
    example: 'Bem-vindo ao NeuralContent!',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({
    description: 'Conteúdo do email em texto plano',
    example: 'Olá! Bem-vindo à nossa plataforma.',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Conteúdo do email em HTML',
    example: '<h1>Bem-vindo!</h1><p>Olá! Bem-vindo à nossa plataforma.</p>',
  })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({
    description: 'Anexos do email',
    type: [EmailAttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];

  @ApiPropertyOptional({
    description: 'Email de resposta personalizado',
    example: 'noreply@neuralcontent.com',
  })
  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @ApiPropertyOptional({
    description: 'Prioridade do email',
    example: 'high',
    enum: ['high', 'normal', 'low'],
  })
  @IsOptional()
  @IsString()
  priority?: 'high' | 'normal' | 'low';

  @ApiPropertyOptional({
    description: 'Headers customizados',
    example: { 'X-Category': 'Authentication' },
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;
}
