import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePlanDto } from './create-plan.dto';

export class UpdatePlanDto extends PartialType(
  OmitType(CreatePlanDto, ['slug'] as const)
) {
  // Omite o slug do update pois não deve ser alterado após criação
  // Todos os outros campos são opcionais graças ao PartialType
}
