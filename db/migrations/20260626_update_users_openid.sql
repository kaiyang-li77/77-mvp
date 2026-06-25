-- 更新 users 表：openid 为主标识，phone 可空
-- 先填充缺失的 openid，再改约束
UPDATE users SET openid = 'mock_openid_' || id WHERE openid IS NULL;

ALTER TABLE users
  ALTER COLUMN openid SET NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
