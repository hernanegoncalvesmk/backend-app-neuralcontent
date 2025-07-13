import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

/**
 * Decorator composto para documentar respostas paginadas no Swagger
 */
export function ApiPaginatedResponse<TModel extends object>(
  model: new () => TModel,
  description = 'Lista paginada de recursos',
) {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description,
      schema: {
        allOf: [
          {
            properties: {
              success: {
                type: 'boolean',
                example: true,
              },
              data: {
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: `#/components/schemas/${model.name}` },
                  },
                  total: {
                    type: 'number',
                    example: 100,
                  },
                  page: {
                    type: 'number',
                    example: 1,
                  },
                  limit: {
                    type: 'number',
                    example: 10,
                  },
                  totalPages: {
                    type: 'number',
                    example: 10,
                  },
                },
              },
              message: {
                type: 'string',
                example: 'Dados recuperados com sucesso',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
              path: {
                type: 'string',
                example: '/api/users',
              },
              method: {
                type: 'string',
                example: 'GET',
              },
              statusCode: {
                type: 'number',
                example: 200,
              },
            },
          },
        ],
      },
    }),
  );
}
