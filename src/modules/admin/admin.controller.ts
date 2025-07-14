import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  AdminStatsQueryDto,
  AdminStatsResponseDto,
  AdminUserFilterDto,
  AdminUpdateUserDto,
  AdminUserResponseDto,
  AdminUserListResponseDto,
  AdminBulkActionDto,
} from './dto';

/**
 * Controller para funcionalidades administrativas
 * 
 * @description Endpoints protegidos para administradores do sistema
 * @author NeuralContent Team
 * @since 1.0.0
 */
@ApiTags('🔧 Admin')
@Controller('admin')
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  /**
   * Obter estatísticas do sistema
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Obter estatísticas do sistema',
    description: 'Retorna estatísticas detalhadas do sistema incluindo usuários, receita, créditos e performance',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas obtidas com sucesso',
    type: AdminStatsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token não fornecido ou inválido',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissões administrativas',
  })
  async getSystemStats(
    @Query() query: AdminStatsQueryDto,
  ): Promise<AdminStatsResponseDto> {
    this.logger.log('Solicitação de estatísticas do sistema');
    return this.adminService.getAdminStats(query);
  }

  /**
   * Listar usuários com filtros
   */
  @Get('users')
  @ApiOperation({
    summary: 'Listar usuários',
    description: 'Lista usuários do sistema com opções de filtro e paginação',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de usuários obtida com sucesso',
    type: AdminUserListResponseDto,
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'role', required: false, description: 'Filtrar por role' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome ou email' })
  @ApiQuery({ name: 'page', required: false, description: 'Página da listagem' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async getUsers(
    @Query() filters: AdminUserFilterDto,
  ): Promise<AdminUserListResponseDto> {
    this.logger.log(`Listando usuários com filtros: ${JSON.stringify(filters)}`);
    return this.adminService.getUsers(filters);
  }

  /**
   * Obter usuário específico
   */
  @Get('users/:id')
  @ApiOperation({
    summary: 'Obter usuário por ID',
    description: 'Retorna informações detalhadas de um usuário específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário encontrado',
    type: AdminUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado',
  })
  async getUserById(@Param('id') id: string): Promise<AdminUserResponseDto> {
    this.logger.log(`Buscando usuário: ${id}`);
    return this.adminService.getUserById(id);
  }

  /**
   * Atualizar usuário
   */
  @Put('users/:id')
  @ApiOperation({
    summary: 'Atualizar usuário',
    description: 'Atualiza informações de um usuário específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário atualizado com sucesso',
    type: AdminUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos fornecidos',
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: AdminUpdateUserDto,
  ): Promise<AdminUserResponseDto> {
    this.logger.log(`Atualizando usuário: ${id}`);
    return this.adminService.updateUser(id, updateData);
  }

  /**
   * Executar ação em lote nos usuários
   */
  @Post('users/bulk-action')
  @ApiOperation({
    summary: 'Ação em lote',
    description: 'Executa uma ação em múltiplos usuários simultaneamente',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ação executada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        affected: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Ação inválida ou dados incorretos',
  })
  async bulkAction(@Body() bulkAction: AdminBulkActionDto) {
    this.logger.log(`Executando ação em lote: ${bulkAction.action} para ${bulkAction.userIds.length} usuários`);
    const result = await this.adminService.bulkAction(bulkAction);
    
    return {
      ...result,
      message: `Ação '${bulkAction.action}' executada com sucesso em ${result.affected} usuários`,
    };
  }

  /**
   * Dashboard - Estatísticas resumidas
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard administrativo',
    description: 'Retorna dados resumidos para o dashboard administrativo',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados do dashboard obtidos com sucesso',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number' },
            activeUsers: { type: 'number' },
            totalRevenue: { type: 'number' },
            totalCreditsConsumed: { type: 'number' },
          },
        },
        recentActivity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              userId: { type: 'string' },
              userName: { type: 'string' },
            },
          },
        },
        systemHealth: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            uptime: { type: 'number' },
            memoryUsage: { type: 'number' },
            responseTime: { type: 'number' },
          },
        },
      },
    },
  })
  async getDashboard() {
    this.logger.log('Carregando dashboard administrativo');
    
    // Obter estatísticas do último mês
    const stats = await this.adminService.getAdminStats({
      period: 'monthly' as any,
    });

    return {
      overview: {
        totalUsers: stats.userStats.totalUsers,
        activeUsers: stats.userStats.activeUsers,
        totalRevenue: stats.revenueStats.totalRevenue,
        totalCreditsConsumed: stats.creditsStats.totalCreditsConsumed,
      },
      recentActivity: [
        {
          id: '1',
          type: 'user_registered',
          description: 'Novo usuário registrado',
          timestamp: new Date().toISOString(),
          userId: 'user123',
          userName: 'João Silva',
        },
        // Mais atividades seriam carregadas do banco de dados
      ],
      systemHealth: {
        status: 'healthy',
        uptime: stats.systemStats.systemUptime,
        memoryUsage: stats.systemStats.memoryUsage,
        responseTime: stats.systemStats.averageResponseTime,
      },
    };
  }

  /**
   * Exportar dados de usuários
   */
  @Get('export/users')
  @ApiOperation({
    summary: 'Exportar usuários',
    description: 'Exporta dados de usuários em formato CSV',
  })
  @ApiQuery({ name: 'format', required: false, description: 'Formato do export (csv, xlsx)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export iniciado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        downloadUrl: { type: 'string' },
      },
    },
  })
  async exportUsers(@Query('format') format: string = 'csv') {
    this.logger.log(`Iniciando export de usuários em formato: ${format}`);
    
    // TODO: Implementar export real
    return {
      success: true,
      message: 'Export de usuários iniciado com sucesso',
      downloadUrl: '/admin/downloads/users-export.csv',
    };
  }

  /**
   * Logs do sistema
   */
  @Get('logs')
  @ApiOperation({
    summary: 'Obter logs do sistema',
    description: 'Retorna logs do sistema com filtros opcionais',
  })
  @ApiQuery({ name: 'level', required: false, description: 'Nível do log (error, warn, info)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logs obtidos com sucesso',
    schema: {
      type: 'object',
      properties: {
        logs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              level: { type: 'string' },
              message: { type: 'string' },
              context: { type: 'string' },
              trace: { type: 'string' },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  async getLogs(
    @Query('level') level?: string,
    @Query('limit') limit: number = 100,
  ) {
    this.logger.log(`Obtendo logs do sistema. Level: ${level}, Limit: ${limit}`);
    
    // TODO: Implementar busca real nos logs
    return {
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Sistema iniciado com sucesso',
          context: 'Application',
          trace: null,
        },
        // Mais logs seriam carregados do sistema
      ],
      total: 1,
    };
  }
}
