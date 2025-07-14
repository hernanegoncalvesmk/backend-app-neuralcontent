import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  ParseUUIDPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto, PlanResponseDto } from './dto';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { RolesGuard, UserRole } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @ApiOperation({
    summary: 'Criar novo plano',
    description: 'Cria um novo plano no sistema. Requer permissões de administrador.',
  })
  @ApiResponse({
    status: 201,
    description: 'Plano criado com sucesso',
    type: PlanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - permissões insuficientes',
  })
  @ApiResponse({
    status: 409,
    description: 'Plano com este slug já existe',
  })
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPlanDto: CreatePlanDto): Promise<PlanResponseDto> {
    return this.plansService.create(createPlanDto);
  }

  @ApiOperation({
    summary: 'Listar todos os planos',
    description: 'Retorna lista de planos disponíveis. Por padrão, retorna apenas planos ativos.',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir planos inativos na listagem',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de planos retornada com sucesso',
    type: [PlanResponseDto],
  })
  @Get()
  @Public()
  async findAll(
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ): Promise<PlanResponseDto[]> {
    return this.plansService.findAll(includeInactive || false);
  }

  @ApiOperation({
    summary: 'Buscar plano por ID',
    description: 'Retorna detalhes de um plano específico pelo ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Plano encontrado com sucesso',
    type: PlanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Plano não encontrado',
  })
  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PlanResponseDto> {
    return this.plansService.findOne(id);
  }

  @ApiOperation({
    summary: 'Buscar plano por slug',
    description: 'Retorna detalhes de um plano específico pelo slug.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug único do plano',
    example: 'premium-plan',
  })
  @ApiResponse({
    status: 200,
    description: 'Plano encontrado com sucesso',
    type: PlanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Plano não encontrado',
  })
  @Get('slug/:slug')
  @Public()
  async findBySlug(@Param('slug') slug: string): Promise<PlanResponseDto> {
    return this.plansService.findBySlug(slug);
  }

  @ApiOperation({
    summary: 'Buscar planos por tipo',
    description: 'Retorna lista de planos filtrados por tipo.',
  })
  @ApiParam({
    name: 'type',
    description: 'Tipo do plano',
    example: 'premium',
    enum: ['free', 'basic', 'premium', 'enterprise'],
  })
  @ApiResponse({
    status: 200,
    description: 'Planos encontrados com sucesso',
    type: [PlanResponseDto],
  })
  @Get('type/:type')
  @Public()
  async findByType(@Param('type') type: string): Promise<PlanResponseDto[]> {
    return this.plansService.findByType(type);
  }

  @ApiOperation({
    summary: 'Obter estatísticas dos planos',
    description: 'Retorna estatísticas gerais dos planos cadastrados. Requer permissões de administrador.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 10 },
        active: { type: 'number', example: 8 },
        inactive: { type: 'number', example: 2 },
        featured: { type: 'number', example: 3 },
        byType: {
          type: 'object',
          example: { free: 2, premium: 5, enterprise: 3 },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - permissões insuficientes',
  })
  @Get('admin/stats')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async getStats() {
    return this.plansService.getStats();
  }

  @ApiOperation({
    summary: 'Atualizar plano',
    description: 'Atualiza dados de um plano existente. Requer permissões de administrador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Plano atualizado com sucesso',
    type: PlanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - permissões insuficientes',
  })
  @ApiResponse({
    status: 404,
    description: 'Plano não encontrado',
  })
  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    return this.plansService.update(id, updatePlanDto);
  }

  @ApiOperation({
    summary: 'Ativar/Desativar plano',
    description: 'Alterna o status ativo de um plano. Requer permissões de administrador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do plano alterado com sucesso',
    type: PlanResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - permissões insuficientes',
  })
  @ApiResponse({
    status: 404,
    description: 'Plano não encontrado',
  })
  @Patch(':id/toggle-active')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async toggleActive(@Param('id', ParseUUIDPipe) id: string): Promise<PlanResponseDto> {
    return this.plansService.toggleActive(id);
  }

  @ApiOperation({
    summary: 'Definir plano como destacado',
    description: 'Define se um plano é destacado na listagem. Requer permissões de administrador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'featured',
    type: Boolean,
    description: 'Se o plano deve ser destacado',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Status destacado alterado com sucesso',
    type: PlanResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - permissões insuficientes',
  })
  @ApiResponse({
    status: 404,
    description: 'Plano não encontrado',
  })
  @Patch(':id/featured')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async setFeatured(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('featured', ParseBoolPipe) featured: boolean,
  ): Promise<PlanResponseDto> {
    return this.plansService.setFeatured(id, featured);
  }

  @ApiOperation({
    summary: 'Remover plano',
    description: 'Remove um plano do sistema (soft delete). Requer permissões de administrador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Plano removido com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - permissões insuficientes',
  })
  @ApiResponse({
    status: 404,
    description: 'Plano não encontrado',
  })
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.plansService.remove(id);
  }
}
