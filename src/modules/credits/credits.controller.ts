import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { CreditsService } from './credits.service';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { RolesGuard, UserRole } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import {
  ConsumeCreditsDto,
  ConsumeCreditsResponseDto,
  ValidateCreditsDto,
  ValidateCreditsResponseDto,
  AddCreditsDto,
  AddCreditsResponseDto,
  TransferCreditsDto,
  TransferCreditsResponseDto,
} from './dto';
import { CreditTransaction } from './entities/credit-transaction.entity';

/**
 * Controller para gerenciamento de créditos
 * 
 * @description Fornece endpoints para operações de créditos incluindo:
 * - Validação de saldo
 * - Consumo de créditos
 * - Adição de créditos
 * - Transferência entre usuários
 * - Consulta de histórico
 * - Consulta de saldo
 */
@ApiTags('✅ Créditos')
@Controller('credits')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  /**
   * Valida se o usuário tem créditos suficientes
   */
  @Post('validate')
  @ApiOperation({
    summary: 'Validar créditos suficientes',
    description: 'Verifica se o usuário possui créditos suficientes para uma operação específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Validação realizada com sucesso',
    type: ValidateCreditsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  async validateCredits(@Body() dto: ValidateCreditsDto): Promise<ValidateCreditsResponseDto> {
    return this.creditsService.validateCredits(dto.userId, dto);
  }

  /**
   * Consome créditos do usuário
   */
  @Post('consume')
  @ApiOperation({
    summary: 'Consumir créditos',
    description: 'Consome uma quantidade específica de créditos do usuário para um serviço',
  })
  @ApiResponse({
    status: 201,
    description: 'Créditos consumidos com sucesso',
    type: ConsumeCreditsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Créditos insuficientes ou dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  async consumeCredits(@Body() dto: ConsumeCreditsDto): Promise<ConsumeCreditsResponseDto> {
    return this.creditsService.consumeCredits(dto.userId, dto);
  }

  /**
   * Adiciona créditos ao usuário (apenas administradores)
   */
  @Post('add')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Adicionar créditos',
    description: 'Adiciona créditos a um usuário (apenas administradores)',
  })
  @ApiResponse({
    status: 201,
    description: 'Créditos adicionados com sucesso',
    type: AddCreditsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  async addCredits(@Body() dto: AddCreditsDto): Promise<AddCreditsResponseDto> {
    return this.creditsService.addCredits(dto.userId, dto);
  }

  /**
   * Transfere créditos entre usuários
   */
  @Post('transfer')
  @ApiOperation({
    summary: 'Transferir créditos',
    description: 'Transfere créditos de um usuário para outro',
  })
  @ApiResponse({
    status: 201,
    description: 'Transferência realizada com sucesso',
    type: TransferCreditsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Créditos insuficientes ou dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário origem ou destino não encontrado',
  })
  async transferCredits(@Body() dto: TransferCreditsDto): Promise<TransferCreditsResponseDto> {
    return this.creditsService.transferCredits(dto.fromUserId, dto);
  }

  /**
   * Obtém saldo atual do usuário
   */
  @Get('balance/:userId')
  @ApiOperation({
    summary: 'Consultar saldo de créditos',
    description: 'Obtém o saldo atual de créditos de um usuário',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID do usuário',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Saldo obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '123' },
        balance: { type: 'number', example: 1500 },
        timestamp: { type: 'string', format: 'date-time', example: '2025-07-14T10:15:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  async getCreditBalance(@Param('userId') userId: string) {
    const balance = await this.creditsService.getUserCreditBalance(userId);
    return {
      userId,
      balance,
      timestamp: new Date(),
    };
  }

  /**
   * Obtém histórico de transações do usuário
   */
  @Get('history/:userId')
  @ApiOperation({
    summary: 'Histórico de transações',
    description: 'Obtém o histórico de transações de créditos de um usuário',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID do usuário',
    example: '123',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Número máximo de transações a retornar',
    example: 50,
    required: false,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Número de transações a pular (paginação)',
    example: 0,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico obtido com sucesso',
    type: [CreditTransaction],
  })
  async getTransactionHistory(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<CreditTransaction[]> {
    return this.creditsService.getCreditTransactionHistory(userId, limit, offset);
  }

  /**
   * Obtém saldo do usuário autenticado
   */
  @Get('my-balance')
  @ApiOperation({
    summary: 'Meu saldo de créditos',
    description: 'Obtém o saldo atual de créditos do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Saldo obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '123' },
        balance: { type: 'number', example: 1500 },
        timestamp: { type: 'string', format: 'date-time', example: '2025-07-14T10:15:00.000Z' },
      },
    },
  })
  async getMyBalance(@Request() req: ExpressRequest & { user: { sub: number } }) {
    const userId = req.user.sub.toString();
    const balance = await this.creditsService.getUserCreditBalance(userId);
    return {
      userId,
      balance,
      timestamp: new Date(),
    };
  }

  /**
   * Obtém histórico de transações do usuário autenticado
   */
  @Get('my-history')
  @ApiOperation({
    summary: 'Meu histórico de transações',
    description: 'Obtém o histórico de transações de créditos do usuário autenticado',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Número máximo de transações a retornar',
    example: 50,
    required: false,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Número de transações a pular (paginação)',
    example: 0,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico obtido com sucesso',
    type: [CreditTransaction],
  })
  async getMyTransactionHistory(
    @Request() req: ExpressRequest & { user: { sub: number } },
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<CreditTransaction[]> {
    const userId = req.user.sub.toString();
    return this.creditsService.getCreditTransactionHistory(userId, limit, offset);
  }

  /**
   * Consome créditos do usuário autenticado
   */
  @Post('my-consume')
  @ApiOperation({
    summary: 'Consumir meus créditos',
    description: 'Consome créditos do usuário autenticado',
  })
  @ApiResponse({
    status: 201,
    description: 'Créditos consumidos com sucesso',
    type: ConsumeCreditsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Créditos insuficientes ou dados inválidos',
  })
  async consumeMyCredits(
    @Request() req: ExpressRequest & { user: { sub: number } },
    @Body() dto: Omit<ConsumeCreditsDto, 'userId'>,
  ): Promise<ConsumeCreditsResponseDto> {
    const userId = req.user.sub.toString();
    return this.creditsService.consumeCredits(userId, {
      ...dto,
      userId,
    });
  }

  /**
   * Valida créditos do usuário autenticado
   */
  @Post('my-validate')
  @ApiOperation({
    summary: 'Validar meus créditos',
    description: 'Verifica se o usuário autenticado possui créditos suficientes',
  })
  @ApiResponse({
    status: 200,
    description: 'Validação realizada com sucesso',
    type: ValidateCreditsResponseDto,
  })
  async validateMyCredits(
    @Request() req: ExpressRequest & { user: { sub: number } },
    @Body() dto: Omit<ValidateCreditsDto, 'userId'>,
  ): Promise<ValidateCreditsResponseDto> {
    const userId = req.user.sub.toString();
    return this.creditsService.validateCredits(userId, {
      ...dto,
      userId,
    });
  }

  // ========== CreditBalance Endpoints ==========

  @ApiOperation({
    summary: 'Obter saldo de créditos de um usuário',
    description: 'Retorna o saldo atual de créditos de um usuário específico. Requer permissões de administrador.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID único do usuário',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Saldo obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        userId: { type: 'string', example: '123' },
        balance: { type: 'number', example: 100 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  @Get('balance/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserCreditBalance(@Param('userId') userId: string) {
    return this.creditsService.getUserCreditBalance(userId);
  }

  @ApiOperation({
    summary: 'Criar saldo inicial de créditos',
    description: 'Cria um saldo inicial de créditos para um usuário. Requer permissões de administrador.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID único do usuário',
    example: '123',
  })
  @ApiResponse({
    status: 201,
    description: 'Saldo inicial criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        userId: { type: 'string', example: '123' },
        balance: { type: 'number', example: 0 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  @Post('balance/:userId/initial')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createInitialCreditBalance(
    @Param('userId') userId: string,
    @Body() createData: any
  ) {
    return this.creditsService.createCreditBalance(userId, createData);
  }

  @ApiOperation({
    summary: 'Obter meu saldo de créditos',
    description: 'Retorna o saldo atual de créditos do usuário autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Saldo obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        userId: { type: 'string', example: '123' },
        balance: { type: 'number', example: 100 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @Get('my-balance')
  async getMyCreditBalance(@Request() req: ExpressRequest & { user: { sub: number } }) {
    const userId = req.user.sub.toString();
    return this.creditsService.getUserCreditBalance(userId);
  }
}
