-- Create Admin User for Dobacklinks
-- This creates an admin user with email/password login
--
-- Usage:
--   psql -h 93.127.133.204 -p 54322 -U postgres -d postgres -f scripts/create-admin-user.sql
--
-- Credentials:
--   Email: outreach@dobacklinks.com
--   Password: Admin@2024!

-- First, create the user
DO $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO user_uuid FROM "user" WHERE email = 'outreach@dobacklinks.com';

  IF user_uuid IS NOT NULL THEN
    RAISE NOTICE 'User already exists with ID: %', user_uuid;

    -- Update to admin role if not already
    UPDATE "user"
    SET role = 'admin'
    WHERE id = user_uuid AND role != 'admin';

    IF FOUND THEN
      RAISE NOTICE 'Updated user role to admin';
    ELSE
      RAISE NOTICE 'User already has admin role';
    END IF;
  ELSE
    -- Create new user
    user_uuid := gen_random_uuid();

    INSERT INTO "user" (
      id,
      email,
      name,
      role,
      email_verified,
      created_at,
      updated_at
    ) VALUES (
      user_uuid,
      'outreach@dobacklinks.com',
      'Admin',
      'admin',
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Created new admin user with ID: %', user_uuid;

    -- Create account with hashed password
    -- Note: Better Auth uses provider_id 'email' for email/password auth
    -- Password: Admin@2024!
    -- This is a bcrypt hash of "Admin@2024!" with cost factor 10
    INSERT INTO "account" (
      id,
      user_id,
      account_id,
      provider_id,
      password,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      user_uuid,
      'outreach@dobacklinks.com',
      'email',
      '$2b$10$dXcj.RuqqwGu/MbZX4AACeEfU6jmDTNeaAoz/Lm3L4gfMR5PnUA5m', -- Admin@2024!
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Created account with password authentication';
  END IF;
END $$;

-- Display the created user
SELECT
  id,
  email,
  name,
  role,
  email_verified,
  created_at
FROM "user"
WHERE email = 'outreach@dobacklinks.com';

-- Display account info (without password)
SELECT
  a.id,
  a.user_id,
  a.account_id,
  a.provider_id,
  a.created_at
FROM "account" a
JOIN "user" u ON a.user_id = u.id
WHERE u.email = 'outreach@dobacklinks.com';
