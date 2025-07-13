import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public, CurrentUser, AuthenticatedUser, Roles, UserRole } from './common';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public() // Rota pública - não requer autenticação
  @ApiOperation({ summary: 'API Information' })
  @ApiResponse({ status: 200, description: 'API information retrieved successfully' })
  getApiInfo(): object {
    return this.appService.getApiInfo();
  }

  @Get('health')
  @Public() // Rota pública para health check
  @ApiOperation({ summary: 'Health Check' })
  @ApiResponse({ status: 200, description: 'Health check passed' })
  getHealthCheck(): object {
    return this.appService.getHealthCheck();
  }

  @Get('db-info')
  @Public() // Rota pública para informações de database
  @ApiOperation({ summary: 'Database Information' })
  @ApiResponse({ status: 200, description: 'Database info retrieved successfully' })
  getDbInfo(): object {
    return {
      databaseType: 'MySQL',
      orm: 'TypeORM',
      framework: 'NestJS',
      host: process.env.DB_HOST,
      databaseName: process.env.DB_NAME,
      status: 'NestJS Migration Complete',
      guards: 'JWT Auth, Roles, Admin Guards configured',
      interceptors: 'Logging, Transform, Timeout configured',
      filters: 'Global Exception Handling configured',
    };
  }

  @Get('protected')
  @ApiOperation({ summary: 'Protected Route Example' })
  @ApiResponse({ status: 200, description: 'Protected data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProtectedData(@CurrentUser() user?: AuthenticatedUser): object {
    if (!user) {
      return {
        message: 'This is a protected route that requires JWT authentication',
        user: null,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      message: 'This is a protected route that requires JWT authentication',
      user: {
        id: user.sub,
        email: user.email,
        role: user.role,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('admin-only')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin Only Route Example' })
  @ApiResponse({ status: 200, description: 'Admin data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  getAdminData(@CurrentUser() user?: AuthenticatedUser): object {
    if (!user) {
      return {
        message: 'This route is accessible only by administrators',
        adminUser: null,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      message: 'This route is accessible only by administrators',
      adminUser: {
        id: user.sub,
        email: user.email,
        role: user.role,
      },
      systemInfo: {
        framework: 'NestJS',
        guards: ['JWT Auth Guard', 'Roles Guard'],
        interceptors: ['Logging', 'Transform', 'Timeout'],
      },
      timestamp: new Date().toISOString(),
    };
  }
}
