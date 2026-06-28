-- Add table and column comments for the tailoring mini program schema.
-- Safe to run more than once.

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
