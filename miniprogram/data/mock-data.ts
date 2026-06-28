export const brandProfile = {
  name: "私人定制工作室",
  displayName: "高端私人定制",
  englishName: "Private Atelier",
  targetUser: "高净值客户",
  positioning: "高端私人服装定制",
  styles: ["老钱风", "轻奢休闲风"],
  serviceKeywords: ["高品质选材", "精细化工艺", "一对一专属定制", "沉浸式定制体验"],
  address: "线下量体门店"
};

export const defaultBodyProfile = {
  height: 172,
  weight: 61,
  shoulder: 42,
  chest: 88,
  waist: 71,
  hip: 92,
  sleeve: 58,
  pants_length: 99,
  body_type: "直筒"
};

export const bodyTypeOptions = ["直筒", "梨形", "倒三角", "苹果型", "沙漏型"];

export const defaultStylePreference = {
  preferred_styles: ["老钱风", "轻奢休闲风"],
  preferred_colors: ["深石墨黑", "藏蓝"],
  fit: "合体",
  preferred_scenes: ["通勤", "旅行"]
};

export const styleOptions = {
  styles: ["老钱风", "轻奢休闲风", "极简高级", "正式晚宴"],
  colors: ["深石墨黑", "藏蓝", "驼色", "酒红", "橄榄绿"],
  fits: ["修身", "合体", "宽松", "廓形"],
  scenes: ["通勤", "会议", "约会", "婚礼", "旅行", "日常"]
};

export const colorMap: Record<string, string> = {
  "深石墨黑": "#1c1917",
  "藏蓝": "#172554",
  "驼色": "#a8a29e",
  "酒红": "#7f1d1d",
  "橄榄绿": "#5f6f52"
};

export const customOptions = {
  garmentTypes: [
    { code: "coat", name: "大衣" },
    { code: "suit", name: "西装" },
    { code: "shirt", name: "衬衫" },
    { code: "knit", name: "针织" },
    { code: "pants", name: "裤装" }
  ],
  colors: [
    { code: "graphite_black", name: "深石墨黑", hex: "#1c1917" },
    { code: "navy", name: "藏蓝", hex: "#172554" },
    { code: "camel", name: "驼色", hex: "#a8a29e" },
    { code: "burgundy", name: "酒红", hex: "#7f1d1d" },
    { code: "olive_green", name: "橄榄绿", hex: "#5f6f52" }
  ],
  fabrics: [
    { code: "worsted_wool", name: "精纺羊毛", price: 0 },
    { code: "cashmere_blend", name: "羊绒混纺", price: 680 },
    { code: "tweed", name: "粗花呢", price: 420 },
    { code: "linen_blend", name: "亚麻混纺", price: 260 }
  ],
  details: [
    { code: "gold_button", name: "暖金纽扣", price: 80 },
    { code: "name_embroidery", name: "姓名刺绣", price: 120 },
    { code: "half_lining", name: "半里布", price: 0 },
    { code: "slant_pocket", name: "斜插口袋", price: 60 }
  ]
};

export const garmentBasePrice: Record<string, number> = {
  coat: 3980,
  suit: 3680,
  shirt: 1280,
  knit: 1580,
  pants: 1480,
  "大衣": 3980,
  "西装": 3680,
  "衬衫": 1280,
  "针织": 1580,
  "裤装": 1480
};

export const recommendations = [
  {
    id: "rec-1",
    name: "老钱风商务套装",
    match: 94,
    price: 3980,
    scene: "商务通勤 / 客户会议",
    reason: "深石墨精纺羊毛大衣，低调克制，适合高净值客户的会议和通勤场景。"
  },
  {
    id: "rec-2",
    name: "轻奢休闲通勤款",
    match: 89,
    price: 4280,
    scene: "周末旅行 / 日常约会",
    reason: "海军蓝羊绒混纺，软垂感更强，适合高品质日常和周末会面。"
  },
  {
    id: "rec-3",
    name: "高级度假外套",
    match: 82,
    price: 4560,
    scene: "聚会 / 拍摄 / 特殊场合",
    reason: "橄榄绿粗花呢外套，兼顾松弛和辨识度，适合旅行、聚会和拍摄。"
  }
];
