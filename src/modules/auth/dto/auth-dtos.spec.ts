import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { 
  LoginDto, 
  RegisterDto, 
  RefreshTokenDto, 
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UserRole 
} from './index';

describe('Auth DTOs Validation', () => {
  describe('LoginDto', () => {
    it('should validate correct login data', async () => {
      const loginData = {
        email: 'test@neuralcontent.com',
        password: 'password123',
        rememberMe: false
      };

      const dto = plainToInstance(LoginDto, loginData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.email).toBe('test@neuralcontent.com');
      expect(dto.password).toBe('password123');
      expect(dto.rememberMe).toBe(false);
    });

    it('should transform email to lowercase and trim', async () => {
      const loginData = {
        email: '  TEST@NEURALCONTENT.COM  ',
        password: 'password123'
      };

      const dto = plainToInstance(LoginDto, loginData);
      await validate(dto);

      expect(dto.email).toBe('test@neuralcontent.com');
    });

    it('should fail with invalid email', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const dto = plainToInstance(LoginDto, loginData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should fail with short password', async () => {
      const loginData = {
        email: 'test@neuralcontent.com',
        password: '123'
      };

      const dto = plainToInstance(LoginDto, loginData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints?.minLength).toBeDefined();
    });

    it('should fail with empty email', async () => {
      const loginData = {
        email: '',
        password: 'password123'
      };

      const dto = plainToInstance(LoginDto, loginData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });
  });

  describe('RegisterDto', () => {
    it('should validate correct registration data', async () => {
      const registerData = {
        name: 'João Silva Santos',
        email: 'joao@neuralcontent.com',
        password: 'MinhaS3nh@Segura123',
        role: UserRole.USER,
        phone: '+5511999999999',
        acceptTerms: true,
        acceptMarketing: false
      };

      const dto = plainToInstance(RegisterDto, registerData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.name).toBe('João Silva Santos');
      expect(dto.email).toBe('joao@neuralcontent.com');
      expect(dto.role).toBe(UserRole.USER);
    });

    it('should transform email to lowercase and trim name', async () => {
      const registerData = {
        name: '  João Silva  ',
        email: '  JOAO@NEURALCONTENT.COM  ',
        password: 'MinhaS3nh@Segura123'
      };

      const dto = plainToInstance(RegisterDto, registerData);
      await validate(dto);

      expect(dto.name).toBe('João Silva');
      expect(dto.email).toBe('joao@neuralcontent.com');
    });

    it('should fail with weak password', async () => {
      const registerData = {
        name: 'João Silva',
        email: 'joao@neuralcontent.com',
        password: 'weakpassword'
      };

      const dto = plainToInstance(RegisterDto, registerData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('should fail with invalid name (numbers)', async () => {
      const registerData = {
        name: 'João123',
        email: 'joao@neuralcontent.com',
        password: 'MinhaS3nh@Segura123'
      };

      const dto = plainToInstance(RegisterDto, registerData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('should fail with invalid phone format', async () => {
      const registerData = {
        name: 'João Silva',
        email: 'joao@neuralcontent.com',
        password: 'MinhaS3nh@Segura123',
        phone: '123' // Muito curto para o padrão internacional
      };

      const dto = plainToInstance(RegisterDto, registerData);
      const errors = await validate(dto);

      // O telefone é opcional, então só falha se for fornecido mas inválido
      const phoneError = errors.find(error => error.property === 'phone');
      expect(phoneError).toBeDefined();
      expect(phoneError?.constraints?.matches).toBeDefined();
    });

    it('should set default role as USER', async () => {
      const registerData = {
        name: 'João Silva',
        email: 'joao@neuralcontent.com',
        password: 'MinhaS3nh@Segura123'
      };

      const dto = plainToInstance(RegisterDto, registerData);
      await validate(dto);

      expect(dto.role).toBe(UserRole.USER);
    });
  });

  describe('RefreshTokenDto', () => {
    it('should validate correct refresh token', async () => {
      const refreshData = {
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      };

      const dto = plainToInstance(RefreshTokenDto, refreshData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.refreshToken).toBe(refreshData.refreshToken);
    });

    it('should fail with invalid JWT format', async () => {
      const refreshData = {
        refreshToken: 'invalid-jwt-token'
      };

      const dto = plainToInstance(RefreshTokenDto, refreshData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('refreshToken');
      expect(errors[0].constraints?.isJwt).toBeDefined();
    });

    it('should fail with empty token', async () => {
      const refreshData = {
        refreshToken: ''
      };

      const dto = plainToInstance(RefreshTokenDto, refreshData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('refreshToken');
    });
  });

  describe('ChangePasswordDto', () => {
    it('should validate correct password change data', async () => {
      const changeData = {
        currentPassword: 'currentPass123',
        newPassword: 'MinhaS3nh@Nova456',
        confirmPassword: 'MinhaS3nh@Nova456'
      };

      const dto = plainToInstance(ChangePasswordDto, changeData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.currentPassword).toBe('currentPass123');
      expect(dto.newPassword).toBe('MinhaS3nh@Nova456');
      expect(dto.confirmPassword).toBe('MinhaS3nh@Nova456');
    });

    it('should fail with weak new password', async () => {
      const changeData = {
        currentPassword: 'currentPass123',
        newPassword: 'weakpassword',
        confirmPassword: 'weakpassword'
      };

      const dto = plainToInstance(ChangePasswordDto, changeData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('should fail with short current password', async () => {
      const changeData = {
        currentPassword: '123',
        newPassword: 'MinhaS3nh@Nova456',
        confirmPassword: 'MinhaS3nh@Nova456'
      };

      const dto = plainToInstance(ChangePasswordDto, changeData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('currentPassword');
      expect(errors[0].constraints?.minLength).toBeDefined();
    });
  });

  describe('ForgotPasswordDto', () => {
    it('should validate correct email', async () => {
      const forgotData = {
        email: 'user@neuralcontent.com'
      };

      const dto = plainToInstance(ForgotPasswordDto, forgotData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.email).toBe('user@neuralcontent.com');
    });

    it('should transform email to lowercase', async () => {
      const forgotData = {
        email: '  USER@NEURALCONTENT.COM  '
      };

      const dto = plainToInstance(ForgotPasswordDto, forgotData);
      await validate(dto);

      expect(dto.email).toBe('user@neuralcontent.com');
    });

    it('should fail with invalid email format', async () => {
      const forgotData = {
        email: 'invalid-email'
      };

      const dto = plainToInstance(ForgotPasswordDto, forgotData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });
  });

  describe('ResetPasswordDto', () => {
    it('should validate correct reset data', async () => {
      const resetData = {
        resetToken: 'valid-reset-token-123',
        newPassword: 'MinhaS3nh@Nova456'
      };

      const dto = plainToInstance(ResetPasswordDto, resetData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.resetToken).toBe('valid-reset-token-123');
      expect(dto.newPassword).toBe('MinhaS3nh@Nova456');
    });

    it('should fail with empty reset token', async () => {
      const resetData = {
        resetToken: '',
        newPassword: 'MinhaS3nh@Nova456'
      };

      const dto = plainToInstance(ResetPasswordDto, resetData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('resetToken');
    });

    it('should fail with weak new password', async () => {
      const resetData = {
        resetToken: 'valid-reset-token-123',
        newPassword: 'weak'
      };

      const dto = plainToInstance(ResetPasswordDto, resetData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newPassword');
    });
  });
});
