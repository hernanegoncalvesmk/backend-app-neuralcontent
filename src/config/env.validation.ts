import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  // Application Configuration
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number;

  @IsString()
  @IsNotEmpty()
  API_PREFIX: string;

  // Domain Configuration
  @IsString()
  @IsNotEmpty()
  FRONTEND_URL: string;

  @IsString()
  @IsNotEmpty()
  BACKEND_URL: string;

  // Database Configuration
  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  // Redis Configuration
  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_PORT: number;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  @Transform(({ value }) => value ? parseInt(value, 10) : 0)
  REDIS_DB?: number;

  @IsOptional()
  @IsString()
  REDIS_KEY_PREFIX?: string;

  // JWT Configuration
  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRES_IN: string;

  // External APIs
  @IsString()
  @IsNotEmpty()
  STRIPE_SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  PAYPAL_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  SENDGRID_API_KEY: string;

  // Security Configuration
  @IsNumber()
  @Min(10)
  @Max(20)
  @Transform(({ value }) => parseInt(value, 10))
  BCRYPT_ROUNDS: number;

  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_TTL: number;

  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_LIMIT: number;

  // PM2 Configuration
  @IsString()
  @IsNotEmpty()
  PM2_INSTANCES: string;

  @IsString()
  @IsNotEmpty()
  PM2_MAX_MEMORY_RESTART: string;
}
