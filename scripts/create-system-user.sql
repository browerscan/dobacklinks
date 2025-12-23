-- Create System User for Data Import
-- This user will be the owner of all imported sites

INSERT INTO "user" (
  id,
  email,
  name,
  role,
  email_verified,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'system@dobacklinks.com',
  'System',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verify creation
SELECT id, email, name, role, email_verified
FROM "user"
WHERE email = 'system@dobacklinks.com';
