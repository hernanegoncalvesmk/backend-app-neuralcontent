import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Plan, PlanFeature } from './entities';
import { CreatePlanDto, UpdatePlanDto, PlanResponseDto } from './dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(PlanFeature)
    private readonly planFeatureRepository: Repository<PlanFeature>,
  ) {}

  /**
   * Criar um novo plano
   */
  async create(createPlanDto: CreatePlanDto): Promise<PlanResponseDto> {
    // Verificar se o slug já existe
    const existingPlan = await this.planRepository.findOne({
      where: { slug: createPlanDto.slug },
    });

    if (existingPlan) {
      throw new ConflictException(`Plano com slug '${createPlanDto.slug}' já existe`);
    }

    // Criar o plano
    const plan = this.planRepository.create({
      ...createPlanDto,
      monthlyPrice: createPlanDto.monthlyPrice || 0,
      annualPrice: createPlanDto.annualPrice || 0,
      monthlyCredits: createPlanDto.monthlyCredits || 0,
      isActive: createPlanDto.isActive !== undefined ? createPlanDto.isActive : true,
      isFeatured: createPlanDto.isFeatured || false,
      sortOrder: createPlanDto.sortOrder || 0,
    });

    const savedPlan = await this.planRepository.save(plan);
    return this.transformToDto(savedPlan);
  }

  /**
   * Buscar todos os planos
   */
  async findAll(includeInactive = false): Promise<PlanResponseDto[]> {
    const whereCondition: FindOptionsWhere<Plan> = {};
    
    if (!includeInactive) {
      whereCondition.isActive = true;
    }

    const plans = await this.planRepository.find({
      where: whereCondition,
      relations: ['features'],
      order: {
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
    });

    return plans.map(plan => this.transformToDto(plan));
  }

  /**
   * Buscar um plano por ID
   */
  async findOne(id: string): Promise<PlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ['features'],
    });

    if (!plan) {
      throw new NotFoundException(`Plano com ID '${id}' não encontrado`);
    }

    return this.transformToDto(plan);
  }

  /**
   * Buscar um plano por slug
   */
  async findBySlug(slug: string): Promise<PlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { slug },
      relations: ['features'],
    });

    if (!plan) {
      throw new NotFoundException(`Plano com slug '${slug}' não encontrado`);
    }

    return this.transformToDto(plan);
  }

  /**
   * Atualizar um plano
   */
  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<PlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ['features'],
    });

    if (!plan) {
      throw new NotFoundException(`Plano com ID '${id}' não encontrado`);
    }

    // Aplicar as atualizações
    Object.assign(plan, updatePlanDto);

    const updatedPlan = await this.planRepository.save(plan);
    return this.transformToDto(updatedPlan);
  }

  /**
   * Remover um plano (soft delete)
   */
  async remove(id: string): Promise<void> {
    const plan = await this.planRepository.findOne({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plano com ID '${id}' não encontrado`);
    }

    await this.planRepository.softDelete(id);
  }

  /**
   * Ativar/Desativar um plano
   */
  async toggleActive(id: string): Promise<PlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ['features'],
    });

    if (!plan) {
      throw new NotFoundException(`Plano com ID '${id}' não encontrado`);
    }

    plan.isActive = !plan.isActive;
    const updatedPlan = await this.planRepository.save(plan);
    
    return this.transformToDto(updatedPlan);
  }

  /**
   * Definir plano como destacado
   */
  async setFeatured(id: string, featured: boolean): Promise<PlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ['features'],
    });

    if (!plan) {
      throw new NotFoundException(`Plano com ID '${id}' não encontrado`);
    }

    plan.isFeatured = featured;
    const updatedPlan = await this.planRepository.save(plan);
    
    return this.transformToDto(updatedPlan);
  }

  /**
   * Buscar planos por tipo
   */
  async findByType(type: string): Promise<PlanResponseDto[]> {
    const plans = await this.planRepository.find({
      where: { 
        type: type as any,
        isActive: true,
      },
      relations: ['features'],
      order: {
        sortOrder: 'ASC',
      },
    });

    return plans.map(plan => this.transformToDto(plan));
  }

  /**
   * Obter estatísticas dos planos
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    featured: number;
    byType: Record<string, number>;
  }> {
    const plans = await this.planRepository.find();
    
    const stats = {
      total: plans.length,
      active: plans.filter(p => p.isActive).length,
      inactive: plans.filter(p => !p.isActive).length,
      featured: plans.filter(p => p.isFeatured).length,
      byType: {} as Record<string, number>,
    };

    // Contar por tipo
    plans.forEach(plan => {
      stats.byType[plan.type] = (stats.byType[plan.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Transformar entidade em DTO
   */
  private transformToDto(plan: Plan): PlanResponseDto {
    return plainToClass(PlanResponseDto, plan, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Validar dados do plano
   */
  private validatePlanData(planData: Partial<Plan>): void {
    // Validar que preços sejam positivos
    if (planData.monthlyPrice && planData.monthlyPrice < 0) {
      throw new BadRequestException('Preço mensal deve ser maior ou igual a zero');
    }

    if (planData.annualPrice && planData.annualPrice < 0) {
      throw new BadRequestException('Preço anual deve ser maior ou igual a zero');
    }

    // Validar que créditos sejam positivos
    if (planData.monthlyCredits && planData.monthlyCredits < 0) {
      throw new BadRequestException('Créditos mensais deve ser maior ou igual a zero');
    }

    // Validar que ordem seja positiva
    if (planData.sortOrder && planData.sortOrder < 0) {
      throw new BadRequestException('Ordem deve ser maior ou igual a zero');
    }
  }
}
