import { validateSync } from 'class-validator';
import { plainToClass, ClassConstructor } from 'class-transformer';

/**
 * Validates environment variables using class-validator decorators
 * @param validationClass - The class with validation decorators
 * @param envConfig - The environment configuration object
 * @returns Validated environment configuration
 */
export function validateConfig<T extends object>(
  validationClass: ClassConstructor<T>,
  envConfig: Record<string, unknown>,
): T {
  const validatedConfig = plainToClass(validationClass, envConfig, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = error.constraints;
        return constraints
          ? Object.values(constraints).join(', ')
          : `Invalid property: ${error.property}`;
      })
      .join('; ');

    throw new Error(`Environment validation error: ${errorMessages}`);
  }

  return validatedConfig;
}
