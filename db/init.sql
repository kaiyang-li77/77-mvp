-- 高端私人定制小程序 - PostgreSQL 初始化脚本
-- 文件名：db/init.sql
-- 说明：创建 MVP 所需的全部表、索引，并写入初始配置数据

-- 先清理（开发/测试环境可用，生产环境请谨慎）
DROP TABLE IF EXISTS advisor_bookings CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS custom_selections CASCADE;
DROP TABLE IF EXISTS recommendation_items CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS scenes CASCADE;
DROP TABLE IF EXISTS styles CASCADE;
DROP TABLE IF EXISTS colors CASCADE;
DROP TABLE IF EXISTS details CASCADE;
DROP TABLE IF EXISTS fabrics CASCADE;
DROP TABLE IF EXISTS garments CASCADE;
DROP TABLE IF EXISTS style_preferences CASCADE;
DROP TABLE IF EXISTS body_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. 核心实体
-- ============================================================

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  openid        VARCHAR(64) UNIQUE NOT NULL,
  phone         VARCHAR(20) UNIQUE,
  nickname      VARCHAR(64),
  avatar_url    TEXT,
  phone_verified BOOLEAN DEFAULT false,
  status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE body_profiles (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  height          INT,
  weight          INT,
  shoulder        INT,
  chest           INT,
  waist           INT,
  hip             INT,
  sleeve          INT,
  pants_length    INT,
  body_type       VARCHAR(20) CHECK (body_type IN ('直筒', '梨形', '倒三角', '苹果型', '沙漏型')),
  is_default      BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE style_preferences (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_styles    JSONB DEFAULT '[]'::jsonb,
  preferred_colors    JSONB DEFAULT '[]'::jsonb,
  fit                 VARCHAR(20) CHECK (fit IN ('修身', '合体', '宽松', '廓形')),
  preferred_scenes    JSONB DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. 配置实体
-- ============================================================

CREATE TABLE garments (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(64) NOT NULL,
  base_price      INT NOT NULL,
  display_order   INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE fabrics (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(64) NOT NULL,
  extra_price     INT DEFAULT 0,
  description     TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE details (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(64) NOT NULL,
  extra_price     INT DEFAULT 0,
  description     TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE colors (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(64) NOT NULL,
  hex_value       VARCHAR(7),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE styles (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(64) NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scenes (
  id              BIGSERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(64) NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. 推荐、订单与预约实体
-- ============================================================

CREATE TABLE recommendations (
  id                  BIGSERIAL PRIMARY KEY,
  code                VARCHAR(32) UNIQUE NOT NULL,
  name                VARCHAR(128) NOT NULL,
  match_score         INT,
  base_price          INT,
  scene_description   VARCHAR(255),
  reason              TEXT,
  style_code          VARCHAR(32) REFERENCES styles(code),
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recommendation_items (
  id                  BIGSERIAL PRIMARY KEY,
  recommendation_id   BIGINT NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  garment_code        VARCHAR(32) REFERENCES garments(code),
  fabric_code         VARCHAR(32) REFERENCES fabrics(code),
  color_code          VARCHAR(32) REFERENCES colors(code),
  detail_codes        JSONB DEFAULT '[]'::jsonb,
  display_order       INT DEFAULT 0
);

CREATE TABLE custom_selections (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  garment_code        VARCHAR(32) REFERENCES garments(code),
  fabric_code         VARCHAR(32) REFERENCES fabrics(code),
  color_code          VARCHAR(32) REFERENCES colors(code),
  fit                 VARCHAR(20) CHECK (fit IN ('修身', '合体', '宽松', '廓形')),
  detail_codes        JSONB DEFAULT '[]'::jsonb,
  calculated_price    INT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id                  BIGSERIAL PRIMARY KEY,
  order_no            VARCHAR(32) UNIQUE NOT NULL,
  user_id             BIGINT REFERENCES users(id) ON DELETE SET NULL,
  custom_selection_id BIGINT REFERENCES custom_selections(id) ON DELETE SET NULL,
  total_price         INT NOT NULL,
  deposit             INT,
  status              VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'in_progress', 'completed', 'cancelled')),
  snapshot            JSONB DEFAULT '{}'::jsonb,
  estimated_days      INT,
  remark              TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE advisor_bookings (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,
  order_id        BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  booking_type    VARCHAR(32) DEFAULT 'offline_fitting' CHECK (booking_type IN ('offline_fitting', 'online_consultation', 'showroom_visit')),
  status          VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  booking_date    DATE,
  remark          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. 索引
-- ============================================================

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_openid ON users(openid) WHERE openid IS NOT NULL;

CREATE INDEX idx_body_profiles_user_id ON body_profiles(user_id);
CREATE INDEX idx_style_preferences_user_id ON style_preferences(user_id);
CREATE INDEX idx_custom_selections_user_id ON custom_selections(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_advisor_bookings_user_id ON advisor_bookings(user_id);
CREATE INDEX idx_advisor_bookings_order_id ON advisor_bookings(order_id);

CREATE INDEX idx_recommendations_style_code ON recommendations(style_code);

CREATE INDEX idx_style_preferences_styles ON style_preferences USING GIN (preferred_styles);
CREATE INDEX idx_style_preferences_colors ON style_preferences USING GIN (preferred_colors);
CREATE INDEX idx_orders_snapshot ON orders USING GIN (snapshot);

-- ============================================================
-- 5. Seed 数据（来自 miniprogram/data/mock-data.ts）
-- ============================================================

-- 衣型
INSERT INTO garments (code, name, base_price, display_order) VALUES
  ('coat',   '大衣', 398000, 1),
  ('suit',   '西装', 368000, 2),
  ('shirt',  '衬衫', 128000, 3),
  ('knit',   '针织', 158000, 4),
  ('pants',  '裤装', 148000, 5);

-- 面料
INSERT INTO fabrics (code, name, extra_price, description) VALUES
  ('worsted_wool',   '精纺羊毛', 0,     '经典挺括，适合商务场景'),
  ('cashmere_blend', '羊绒混纺', 68000, '柔软垂顺，质感高级'),
  ('tweed',          '粗花呢',   42000, '纹理丰富，休闲与正式兼顾'),
  ('linen_blend',    '亚麻混纺', 26000, '透气清爽，适合春夏');

-- 工艺细节
INSERT INTO details (code, name, extra_price, description) VALUES
  ('gold_button',      '暖金纽扣', 8000,  '定制金属纽扣，提升精致度'),
  ('name_embroidery',  '姓名刺绣', 12000, '内侧专属姓名刺绣'),
  ('half_lining',      '半里布',   0,     '更轻盈透气'),
  ('slant_pocket',     '斜插口袋', 6000,  '经典斜插袋设计');

-- 颜色
INSERT INTO colors (code, name, hex_value) VALUES
  ('graphite_black', '深石墨黑', '#1c1917'),
  ('navy',           '藏蓝',     '#172554'),
  ('camel',          '驼色',     '#a8a29e'),
  ('burgundy',       '酒红',     '#7f1d1d'),
  ('olive_green',    '橄榄绿',   '#5f6f52');

-- 风格标签
INSERT INTO styles (code, name) VALUES
  ('old_money',       '老钱风'),
  ('light_luxury',    '轻奢休闲风'),
  ('minimal_advanced','极简高级'),
  ('formal_dinner',   '正式晚宴');

-- 场景标签
INSERT INTO scenes (code, name) VALUES
  ('commute', '通勤'),
  ('meeting', '会议'),
  ('date',    '约会'),
  ('wedding', '婚礼'),
  ('travel',  '旅行'),
  ('daily',   '日常');

-- 推荐方案
INSERT INTO recommendations (code, name, match_score, base_price, scene_description, reason, style_code) VALUES
  ('rec-1', '老钱风商务套装', 94, 398000, '商务通勤 / 客户会议', '深石墨精纺羊毛大衣，低调克制，适合高净值客户的会议和通勤场景。', 'old_money'),
  ('rec-2', '轻奢休闲通勤款', 89, 428000, '周末旅行 / 日常约会', '海军蓝羊绒混纺，软垂感更强，适合高品质日常和周末会面。', 'light_luxury'),
  ('rec-3', '高级度假外套',   82, 456000, '聚会 / 拍摄 / 特殊场合', '橄榄绿粗花呢外套，兼顾松弛和辨识度，适合旅行、聚会和拍摄。', 'formal_dinner');

-- 推荐方案明细（当前每套方案对应一件大衣）
INSERT INTO recommendation_items (recommendation_id, garment_code, fabric_code, color_code, detail_codes, display_order) VALUES
  ((SELECT id FROM recommendations WHERE code = 'rec-1'), 'coat', 'worsted_wool',   'graphite_black', '["gold_button", "half_lining"]', 1),
  ((SELECT id FROM recommendations WHERE code = 'rec-2'), 'coat', 'cashmere_blend', 'navy',           '["gold_button", "half_lining"]', 1),
  ((SELECT id FROM recommendations WHERE code = 'rec-3'), 'coat', 'tweed',          'olive_green',    '["gold_button", "half_lining"]', 1);

-- ============================================================
-- 6. 示例数据（可选：方便本地联调）
-- ============================================================

-- 示例用户
INSERT INTO users (openid, phone, nickname) VALUES
  ('mock_openid_001', '13800138000', '测试用户');

-- 示例身材档案
INSERT INTO body_profiles (user_id, height, weight, shoulder, chest, waist, hip, sleeve, pants_length, body_type)
SELECT id, 172, 61, 42, 88, 71, 92, 58, 99, '直筒'
FROM users WHERE openid = 'mock_openid_001';

-- 示例风格偏好
INSERT INTO style_preferences (user_id, preferred_styles, preferred_colors, fit, preferred_scenes)
SELECT id, '["old_money", "light_luxury"]', '["graphite_black", "navy"]', '合体', '["commute", "travel"]'
FROM users WHERE openid = 'mock_openid_001';

-- 示例定制选择
INSERT INTO custom_selections (user_id, garment_code, fabric_code, color_code, fit, detail_codes, calculated_price)
SELECT id, 'coat', 'worsted_wool', 'graphite_black', '合体', '["gold_button", "half_lining"]', 398000
FROM users WHERE openid = 'mock_openid_001';
