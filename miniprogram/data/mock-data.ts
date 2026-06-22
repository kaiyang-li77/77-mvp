export const brandProfile = {
  name: "深圳市百分之七十七科技有限公司",
  displayName: "百分之七十七定制",
  englishName: "77 Atelier",
  foundedAt: "2026年5月20日",
  targetUser: "高净值客户",
  positioning: "高端私人服装定制",
  styles: ["老钱风", "轻奢休闲风"],
  serviceKeywords: ["高品质选材", "精细化工艺", "一对一专属定制", "沉浸式定制体验"],
  address: "深圳南山区中铁南方总部大厦903"
};

export const defaultBodyProfile = {
  height: 172,
  weight: 61,
  shoulder: 42,
  chest: 88,
  waist: 71,
  hip: 92,
  sleeve: 58,
  pantsLength: 99,
  bodyType: "直筒"
};

export const bodyTypeOptions = ["直筒", "梨形", "倒三角", "苹果型", "沙漏型"];

export const defaultStylePreference = {
  styles: ["老钱风", "轻奢休闲风"],
  colors: ["深石墨黑", "藏蓝"],
  fit: "合体",
  scenes: ["商务通勤", "周末旅行"]
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
  garmentTypes: ["大衣", "西装", "衬衫", "针织", "裤装"],
  fabrics: [
    { name: "精纺羊毛", price: 0 },
    { name: "羊绒混纺", price: 680 },
    { name: "粗花呢", price: 420 },
    { name: "亚麻混纺", price: 260 }
  ],
  details: [
    { name: "暖金纽扣", price: 80 },
    { name: "姓名刺绣", price: 120 },
    { name: "半里布", price: 0 },
    { name: "斜插口袋", price: 60 }
  ]
};

export const garmentBasePrice: Record<string, number> = {
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
