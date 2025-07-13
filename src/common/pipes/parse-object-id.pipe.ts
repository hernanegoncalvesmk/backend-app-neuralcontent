import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

/**
 * Pipe para validar e transformar UUIDs
 */
@Injectable()
export class ParseUuidPipe implements PipeTransform<string> {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException(`${metadata.data} é obrigatório`);
    }

    if (!this.uuidRegex.test(value)) {
      throw new BadRequestException(`${metadata.data} deve ser um UUID válido`);
    }

    return value;
  }
}
