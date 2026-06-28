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
-- 4.1 表与字段注释
-- ============================================================

COMMENT ON TABLE users IS '小程序用户主表，以微信 OPENID 作为用户身份主标识。';
COMMENT ON COLUMN users.id IS '用户自增主键。';
COMMENT ON COLUMN users.openid IS '微信云开发运行时提供的用户 OPENID，业务唯一身份。';
COMMENT ON COLUMN users.phone IS '用户手机号，可为空，完成授权后写入。';
COMMENT ON COLUMN users.nickname IS '用户昵称。';
COMMENT ON COLUMN users.avatar_url IS '用户头像地址。';
COMMENT ON COLUMN users.phone_verified IS '手机号是否已验证。';
COMMENT ON COLUMN users.status IS '用户状态：active 正常，inactive 停用。';
COMMENT ON COLUMN users.created_at IS '记录创建时间。';
COMMENT ON COLUMN users.updated_at IS '记录更新时间。';

COMMENT ON TABLE body_profiles IS '用户身材档案表，保存量体数据与身型。';
COMMENT ON COLUMN body_profiles.id IS '身材档案自增主键。';
COMMENT ON COLUMN body_profiles.user_id IS '所属用户 ID，关联 users.id。';
COMMENT ON COLUMN body_profiles.height IS '身高，单位厘米。';
COMMENT ON COLUMN body_profiles.weight IS '体重，单位千克。';
COMMENT ON COLUMN body_profiles.shoulder IS '肩宽，单位厘米。';
COMMENT ON COLUMN body_profiles.chest IS '胸围，单位厘米。';
COMMENT ON COLUMN body_profiles.waist IS '腰围，单位厘米。';
COMMENT ON COLUMN body_profiles.hip IS '臀围，单位厘米。';
COMMENT ON COLUMN body_profiles.sleeve IS '袖长，单位厘米。';
COMMENT ON COLUMN body_profiles.pants_length IS '裤长，单位厘米。';
COMMENT ON COLUMN body_profiles.body_type IS '身型枚举：直筒、梨形、倒三角、苹果型、沙漏型。';
COMMENT ON COLUMN body_profiles.is_default IS '是否为用户当前默认身材档案。';
COMMENT ON COLUMN body_profiles.created_at IS '记录创建时间。';
COMMENT ON COLUMN body_profiles.updated_at IS '记录更新时间。';

COMMENT ON TABLE style_preferences IS '用户风格偏好表，保存风格测试结果。';
COMMENT ON COLUMN style_preferences.id IS '风格偏好自增主键。';
COMMENT ON COLUMN style_preferences.user_id IS '所属用户 ID，关联 users.id。';
COMMENT ON COLUMN style_preferences.preferred_styles IS '偏好的风格标签 JSON 数组。';
COMMENT ON COLUMN style_preferences.preferred_colors IS '偏好的颜色名称或编码 JSON 数组。';
COMMENT ON COLUMN style_preferences.fit IS '版型偏好：修身、合体、宽松、廓形。';
COMMENT ON COLUMN style_preferences.preferred_scenes IS '偏好的穿着场景 JSON 数组。';
COMMENT ON COLUMN style_preferences.created_at IS '记录创建时间。';
COMMENT ON COLUMN style_preferences.updated_at IS '记录更新时间。';

COMMENT ON TABLE garments IS '可定制品类配置表，例如大衣、西装、衬衫。';
COMMENT ON COLUMN garments.id IS '品类自增主键。';
COMMENT ON COLUMN garments.code IS '品类业务编码，供前端和云函数传参使用。';
COMMENT ON COLUMN garments.name IS '品类展示名称。';
COMMENT ON COLUMN garments.base_price IS '品类基础价格，单位分。';
COMMENT ON COLUMN garments.display_order IS '前端展示排序，数值越小越靠前。';
COMMENT ON COLUMN garments.is_active IS '是否启用该品类。';
COMMENT ON COLUMN garments.created_at IS '记录创建时间。';

COMMENT ON TABLE fabrics IS '面料配置表，保存面料名称、加价和说明。';
COMMENT ON COLUMN fabrics.id IS '面料自增主键。';
COMMENT ON COLUMN fabrics.code IS '面料业务编码，供前端和云函数传参使用。';
COMMENT ON COLUMN fabrics.name IS '面料展示名称。';
COMMENT ON COLUMN fabrics.extra_price IS '面料加价，单位分。';
COMMENT ON COLUMN fabrics.description IS '面料描述文案。';
COMMENT ON COLUMN fabrics.display_order IS '前端展示排序，数值越小越靠前。';
COMMENT ON COLUMN fabrics.is_active IS '是否启用该面料。';
COMMENT ON COLUMN fabrics.created_at IS '记录创建时间。';

COMMENT ON TABLE details IS '工艺细节配置表，例如纽扣、刺绣、里布。';
COMMENT ON COLUMN details.id IS '工艺细节自增主键。';
COMMENT ON COLUMN details.code IS '工艺细节业务编码，供前端和云函数传参使用。';
COMMENT ON COLUMN details.name IS '工艺细节展示名称。';
COMMENT ON COLUMN details.extra_price IS '工艺细节加价，单位分。';
COMMENT ON COLUMN details.description IS '工艺细节描述文案。';
COMMENT ON COLUMN details.display_order IS '前端展示排序，数值越小越靠前。';
COMMENT ON COLUMN details.is_active IS '是否启用该工艺细节。';
COMMENT ON COLUMN details.created_at IS '记录创建时间。';

COMMENT ON TABLE colors IS '颜色配置表，保存颜色名称和色值。';
COMMENT ON COLUMN colors.id IS '颜色自增主键。';
COMMENT ON COLUMN colors.code IS '颜色业务编码，供前端和云函数传参使用。';
COMMENT ON COLUMN colors.name IS '颜色展示名称。';
COMMENT ON COLUMN colors.hex_value IS '颜色十六进制色值。';
COMMENT ON COLUMN colors.display_order IS '前端展示排序，数值越小越靠前。';
COMMENT ON COLUMN colors.is_active IS '是否启用该颜色。';
COMMENT ON COLUMN colors.created_at IS '记录创建时间。';

COMMENT ON TABLE styles IS '风格标签配置表，例如老钱风、轻奢休闲风。';
COMMENT ON COLUMN styles.id IS '风格标签自增主键。';
COMMENT ON COLUMN styles.code IS '风格标签业务编码。';
COMMENT ON COLUMN styles.name IS '风格标签展示名称。';
COMMENT ON COLUMN styles.display_order IS '前端展示排序，数值越小越靠前。';
COMMENT ON COLUMN styles.is_active IS '是否启用该风格标签。';
COMMENT ON COLUMN styles.created_at IS '记录创建时间。';

COMMENT ON TABLE scenes IS '穿着场景配置表，例如通勤、会议、旅行。';
COMMENT ON COLUMN scenes.id IS '场景自增主键。';
COMMENT ON COLUMN scenes.code IS '场景业务编码。';
COMMENT ON COLUMN scenes.name IS '场景展示名称。';
COMMENT ON COLUMN scenes.display_order IS '前端展示排序，数值越小越靠前。';
COMMENT ON COLUMN scenes.is_active IS '是否启用该场景。';
COMMENT ON COLUMN scenes.created_at IS '记录创建时间。';

COMMENT ON TABLE recommendations IS 'AI 推荐方案主表，保存推荐方案摘要、匹配分和推荐理由。';
COMMENT ON COLUMN recommendations.id IS '推荐方案自增主键。';
COMMENT ON COLUMN recommendations.code IS '推荐方案业务编码。';
COMMENT ON COLUMN recommendations.name IS '推荐方案展示名称。';
COMMENT ON COLUMN recommendations.match_score IS '推荐匹配分，0-100。';
COMMENT ON COLUMN recommendations.base_price IS '推荐方案参考基础价格，单位分。';
COMMENT ON COLUMN recommendations.scene_description IS '适用场景描述。';
COMMENT ON COLUMN recommendations.reason IS '推荐理由文案。';
COMMENT ON COLUMN recommendations.style_code IS '关联风格编码，引用 styles.code。';
COMMENT ON COLUMN recommendations.is_active IS '是否启用该推荐方案。';
COMMENT ON COLUMN recommendations.created_at IS '记录创建时间。';
COMMENT ON COLUMN recommendations.updated_at IS '记录更新时间。';

COMMENT ON TABLE recommendation_items IS '推荐方案明细表，保存每套推荐方案包含的品类、面料、颜色和工艺。';
COMMENT ON COLUMN recommendation_items.id IS '推荐明细自增主键。';
COMMENT ON COLUMN recommendation_items.recommendation_id IS '所属推荐方案 ID，关联 recommendations.id。';
COMMENT ON COLUMN recommendation_items.garment_code IS '推荐品类编码，关联 garments.code。';
COMMENT ON COLUMN recommendation_items.fabric_code IS '推荐面料编码，关联 fabrics.code。';
COMMENT ON COLUMN recommendation_items.color_code IS '推荐颜色编码，关联 colors.code。';
COMMENT ON COLUMN recommendation_items.detail_codes IS '推荐工艺细节编码 JSON 数组。';
COMMENT ON COLUMN recommendation_items.display_order IS '方案内明细展示排序。';

COMMENT ON TABLE custom_selections IS '用户当前定制选择表，保存工作台中选择的品类、面料、颜色、版型和工艺。';
COMMENT ON COLUMN custom_selections.id IS '定制选择自增主键。';
COMMENT ON COLUMN custom_selections.user_id IS '所属用户 ID，关联 users.id。';
COMMENT ON COLUMN custom_selections.garment_code IS '已选品类编码，关联 garments.code。';
COMMENT ON COLUMN custom_selections.fabric_code IS '已选面料编码，关联 fabrics.code。';
COMMENT ON COLUMN custom_selections.color_code IS '已选颜色编码，关联 colors.code。';
COMMENT ON COLUMN custom_selections.fit IS '已选版型：修身、合体、宽松、廓形。';
COMMENT ON COLUMN custom_selections.detail_codes IS '已选工艺细节编码 JSON 数组。';
COMMENT ON COLUMN custom_selections.calculated_price IS '当前选择计算后的总价，单位分。';
COMMENT ON COLUMN custom_selections.created_at IS '记录创建时间。';
COMMENT ON COLUMN custom_selections.updated_at IS '记录更新时间。';

COMMENT ON TABLE orders IS '订单表，保存用户确认支付前后的订单主体信息。';
COMMENT ON COLUMN orders.id IS '订单自增主键。';
COMMENT ON COLUMN orders.order_no IS '订单编号，业务唯一。';
COMMENT ON COLUMN orders.user_id IS '下单用户 ID，关联 users.id；用户删除后保留订单并置空。';
COMMENT ON COLUMN orders.custom_selection_id IS '订单关联的定制选择 ID，关联 custom_selections.id。';
COMMENT ON COLUMN orders.total_price IS '订单商品总价，单位分。';
COMMENT ON COLUMN orders.deposit IS '本次订金支付金额，单位分。';
COMMENT ON COLUMN orders.status IS '订单状态：pending、confirmed、paid、in_progress、completed、cancelled。';
COMMENT ON COLUMN orders.snapshot IS '订单快照 JSON，保存下单时的身材档案、定制选择、工艺和备注等信息。';
COMMENT ON COLUMN orders.estimated_days IS '预计工期天数。';
COMMENT ON COLUMN orders.remark IS '订单备注，用户在订单确认页填写的特殊尺寸、面料偏好或顾问沟通事项。';
COMMENT ON COLUMN orders.created_at IS '记录创建时间。';
COMMENT ON COLUMN orders.updated_at IS '记录更新时间。';

COMMENT ON TABLE advisor_bookings IS '顾问预约表，保存线下量体、线上咨询、到店预约记录。';
COMMENT ON COLUMN advisor_bookings.id IS '顾问预约自增主键。';
COMMENT ON COLUMN advisor_bookings.user_id IS '预约用户 ID，关联 users.id。';
COMMENT ON COLUMN advisor_bookings.order_id IS '关联订单 ID，关联 orders.id。';
COMMENT ON COLUMN advisor_bookings.booking_type IS '预约类型：offline_fitting、online_consultation、showroom_visit。';
COMMENT ON COLUMN advisor_bookings.status IS '预约状态：pending、confirmed、completed、cancelled。';
COMMENT ON COLUMN advisor_bookings.booking_date IS '预约日期。';
COMMENT ON COLUMN advisor_bookings.remark IS '预约备注。';
COMMENT ON COLUMN advisor_bookings.created_at IS '记录创建时间。';
COMMENT ON COLUMN advisor_bookings.updated_at IS '记录更新时间。';

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
