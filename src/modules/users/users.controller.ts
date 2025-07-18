import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ValidationPipe,
  DefaultValuePipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { UserResponseDto, UserListResponseDto, UserStatsResponseDto } from './dto/user-response.dto';
import { UserRole as DtoUserRole, UserStatus } from './dto/create-user.dto';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { RolesGuard, UserRole } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('✅ Usuários')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Create a new user in the system. Only administrators can create users.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    type: UserResponseDto,
    description: 'User created successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data',
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Email already exists',
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions',
  })
  async create(@Body(ValidationPipe) createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return new UserResponseDto(user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieve a paginated list of all users. Accessible by administrators and moderators.',
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Number of items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    type: String, 
    description: 'Search term for name or email',
    example: 'john',
  })
  @ApiQuery({ 
    name: 'role', 
    required: false, 
    enum: DtoUserRole, 
    description: 'Filter by user role',
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: UserStatus, 
    description: 'Filter by user status',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    type: UserListResponseDto,
    description: 'Users retrieved successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('role') role?: DtoUserRole,
    @Query('status') status?: UserStatus,
  ): Promise<UserListResponseDto> {
    // Limite máximo de 100 itens por página
    const limitedLimit = Math.min(limit, 100);
    
    return this.usersService.findAll({ 
      page, 
      limit: limitedLimit,
      search,
      role,
      status,
    });
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get user statistics',
    description: 'Get comprehensive statistics about users in the system. Only accessible by administrators.',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    type: UserStatsResponseDto,
    description: 'User statistics retrieved successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions',
  })
  async getStats(): Promise<UserStatsResponseDto> {
    return this.usersService.getUserStats();
  }

  @Get('profile')
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Get the profile information of the currently authenticated user.',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    type: UserResponseDto,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
  })
  async getProfile(@Req() req: Request): Promise<UserResponseDto> {
    const userId = (req as any).user?.sub;
    const user = await this.usersService.findOne(userId);
    return new UserResponseDto(user);
  }

  @Patch('profile')
  @ApiOperation({ 
    summary: 'Update current user profile',
    description: 'Update the profile information of the currently authenticated user.',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    type: UserResponseDto,
    description: 'User profile updated successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data',
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
  })
  async updateProfile(
    @Req() req: Request,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const userId = (req as any).user?.sub;
    const user = await this.usersService.update(userId, updateUserDto);
    return new UserResponseDto(user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID. Accessible by administrators and moderators.',
  })
  @ApiParam({ 
    name: 'id', 
    type: String,
    description: 'User ID',
    example: '1',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    type: UserResponseDto,
    description: 'User retrieved successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found',
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);
    return new UserResponseDto(user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Update user by ID',
    description: 'Update a specific user by their ID. Only accessible by administrators.',
  })
  @ApiParam({ 
    name: 'id', 
    type: String,
    description: 'User ID',
    example: '1',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    type: UserResponseDto,
    description: 'User updated successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found',
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Email already exists',
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, updateUserDto);
    return new UserResponseDto(user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Update user status',
    description: 'Update the status of a specific user. Only accessible by administrators.',
  })
  @ApiParam({ 
    name: 'id', 
    type: String,
    description: 'User ID',
    example: '1',
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(UserStatus),
          description: 'New user status',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    type: UserResponseDto,
    description: 'User status updated successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid status value',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found',
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions',
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: UserStatus,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateStatus(id, status);
    return new UserResponseDto(user);
  }

  @Patch(':id/change-password')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Change user password',
    description: 'Change the password of a specific user. Only accessible by administrators.',
  })
  @ApiParam({ 
    name: 'id', 
    type: String,
    description: 'User ID',
    example: '1',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password changed successfully',
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid password format',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found',
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions',
  })
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.changePassword(id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Delete user by ID',
    description: 'Permanently delete a user from the system. Only accessible by administrators. This action cannot be undone.',
  })
  @ApiParam({ 
    name: 'id', 
    type: String,
    description: 'User ID',
    example: '1',
  })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found',
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Cannot delete user with active dependencies',
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.remove(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Activate user account',
    description: 'Activate a user account. Only accessible by administrators.',
  })
  @ApiParam({ 
    name: 'id', 
    type: String,
    description: 'User ID',
    example: '1',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    type: UserResponseDto,
    description: 'User activated successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found',
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions',
  })
  async activateUser(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    const user = await this.usersService.updateStatus(id, UserStatus.ACTIVE);
    return new UserResponseDto(user);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Deactivate user account',
    description: 'Deactivate a user account. Only accessible by administrators.',
  })
  @ApiParam({ 
    name: 'id', 
    type: String,
    description: 'User ID',
    example: '1',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    type: UserResponseDto,
    description: 'User deactivated successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found',
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions',
  })
  async deactivateUser(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    const user = await this.usersService.updateStatus(id, UserStatus.INACTIVE);
    return new UserResponseDto(user);
  }
}
