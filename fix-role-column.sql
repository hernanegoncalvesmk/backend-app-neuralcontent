-- Script de correção para tabela usr_users
-- Este script corrige valores inválidos na coluna 'role' antes da migração

-- 1. Verificar dados atuais
SELECT role, COUNT(*) as count FROM usr_users GROUP BY role;

-- 2. Atualizar valores inválidos ou nulos para 'user'
UPDATE usr_users 
SET role = 'user' 
WHERE role NOT IN ('user', 'admin', 'moderator', 'super_admin') 
   OR role IS NULL 
   OR role = '';

-- 3. Verificar após correção
SELECT role, COUNT(*) as count FROM usr_users GROUP BY role;

-- 4. Agora podemos aplicar a alteração do enum com segurança
ALTER TABLE usr_users 
CHANGE role role enum('user', 'admin', 'moderator', 'super_admin') 
NOT NULL COMMENT 'Papel/função do usuário no sistema' DEFAULT 'user';
