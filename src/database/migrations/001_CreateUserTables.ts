import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTables1642118400000 implements MigrationInterface {
  name = 'CreateUserTables1642118400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create usr_users table
    await queryRunner.query(`
      CREATE TABLE usr_users (
        user_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role ENUM('admin', 'user', 'moderator') DEFAULT 'user',
        status ENUM('active', 'inactive', 'suspended', 'pending_verification') DEFAULT 'pending_verification',
        avatar_url VARCHAR(500),
        phone VARCHAR(20),
        date_of_birth DATE,
        language VARCHAR(10) DEFAULT 'en',
        timezone VARCHAR(50) DEFAULT 'UTC',
        email_verified BOOLEAN DEFAULT FALSE,
        phone_verified BOOLEAN DEFAULT FALSE,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        two_factor_secret VARCHAR(255),
        last_login_at TIMESTAMP NULL,
        last_login_ip VARCHAR(45),
        login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP NULL,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP NULL,
        metadata JSON COMMENT 'Additional user metadata as JSON',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        
        INDEX IDX_usr_users_email (email),
        INDEX IDX_usr_users_username (username),
        INDEX IDX_usr_users_status (status),
        INDEX IDX_usr_users_role (role),
        INDEX IDX_usr_users_created_at (created_at)
      )
    `);

    // Create usr_sessions table
    await queryRunner.query(`
      CREATE TABLE usr_sessions (
        session_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        session_token VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        refresh_token VARCHAR(255),
        device_info VARCHAR(500),
        ip_address VARCHAR(45),
        user_agent VARCHAR(1000),
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX IDX_usr_sessions_token (session_token),
        INDEX IDX_usr_sessions_user_id (user_id),
        INDEX IDX_usr_sessions_expires_at (expires_at),
        INDEX IDX_usr_sessions_is_active (is_active),
        
        FOREIGN KEY (user_id) REFERENCES usr_users(user_id) ON DELETE CASCADE
      )
    `);

    // Create usr_verification_tokens table
    await queryRunner.query(`
      CREATE TABLE usr_verification_tokens (
        token_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        token VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        type ENUM('email_verification', 'password_reset', 'two_factor', 'account_activation') NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMP NULL,
        ip_address VARCHAR(45),
        user_agent VARCHAR(1000),
        metadata JSON COMMENT 'Additional token metadata as JSON',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX IDX_usr_verification_tokens_token (token),
        INDEX IDX_usr_verification_tokens_user_id (user_id),
        INDEX IDX_usr_verification_tokens_type (type),
        INDEX IDX_usr_verification_tokens_expires_at (expires_at),
        INDEX IDX_usr_verification_tokens_is_used (is_used),
        
        FOREIGN KEY (user_id) REFERENCES usr_users(user_id) ON DELETE CASCADE
      )
    `);

    // Create usr_permissions table
    await queryRunner.query(`
      CREATE TABLE usr_permissions (
        permission_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        permission ENUM(
          'user:read', 'user:write', 'user:delete',
          'plan:read', 'plan:write', 'plan:delete',
          'payment:read', 'payment:write', 'payment:process',
          'admin:panel:access', 'admin:users:manage', 'admin:payments:manage',
          'admin:plans:manage', 'admin:analytics:view', 'admin:settings:manage',
          'credit:read', 'credit:write', 'credit:transfer',
          'translation:read', 'translation:write', 'translation:manage'
        ) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        granted_by VARCHAR(36),
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        revoked_at TIMESTAMP NULL,
        revoked_by VARCHAR(36),
        reason VARCHAR(500),
        metadata JSON COMMENT 'Additional permission metadata as JSON',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE INDEX IDX_usr_permissions_user_permission (user_id, permission),
        INDEX IDX_usr_permissions_permission (permission),
        INDEX IDX_usr_permissions_is_active (is_active),
        
        FOREIGN KEY (user_id) REFERENCES usr_users(user_id) ON DELETE CASCADE
      )
    `);

    console.log('✅ User tables created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order due to foreign key constraints
    await queryRunner.query('DROP TABLE IF EXISTS usr_permissions');
    await queryRunner.query('DROP TABLE IF EXISTS usr_verification_tokens');
    await queryRunner.query('DROP TABLE IF EXISTS usr_sessions');
    await queryRunner.query('DROP TABLE IF EXISTS usr_users');
    
    console.log('✅ User tables dropped successfully');
  }
}
