# 百分之七十七定制小程序简单版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于微信小程序原生（TypeScript + SCSS）实现一个可点击演示的轻量定制小程序，覆盖首页、身材档案、风格测试、AI mock 推荐、定制工作台、订单确认完整流程。

**Architecture:** 采用微信小程序原生多页架构，所有页面通过 `wx.navigateTo` / `wx.redirectTo` 流转；mock 数据和用户临时状态集中放在 `miniprogram/data/` 模块，价格计算等纯逻辑抽出为可单测工具函数；样式复用 `app.scss` 中定义的变量和组件类，保持克制高端的视觉一致性。

**Tech Stack:** 微信小程序原生、TypeScript、SCSS、微信开发者工具预览、可选 Jest 用于纯逻辑单测。

## Global Constraints

- **不做真实后端**：所有数据使用本地 mock 与 `wx.getStorageSync`/`wx.setStorageSync` 临时存储。
- **不做真实支付 / 订单状态 / 用户系统**：订单页仅做模拟下单成功弹窗与预约顾问提示。
- **不做复杂动画 / 拖拽 / 3D 预览 / 图片上传**。
- **视觉风格**：深石墨黑主色、暖金色强调、米白/浅灰背景、克制留白、避免促销感。
- **品牌信息固定**：深圳市百分之七十七科技有限公司、77 Atelier、深圳南山区中铁南方总部大厦903。
- **推荐方案固定**：老钱风商务套装、轻奢休闲通勤款、高级度假外套。
- **页面路由**：`pages/home/home`、`pages/profile/profile`、`pages/style-test/style-test`、`pages/recommendations/recommendations`、`pages/customizer/customizer`、`pages/order-confirm/order-confirm`。
- **导航栏**：项目已配置 `navigationStyle: custom`，统一复用现有 `navigation-bar` 组件或自绘顶部导航。

---

## File Structure

- `miniprogram/app.json`：声明全部页面、窗口样式。
- `miniprogram/app.scss`：CSS 变量、通用按钮 / 卡片 / 标签 / 色卡 / 底栏样式。
- `miniprogram/app.ts`：启动时初始化默认 mock 数据到 storage，无真实登录。
- `miniprogram/data/mock-data.ts`：品牌信息、身材默认值、风格默认值、定制选项、推荐方案数据。
- `miniprogram/data/app-state.ts`：基于 `wx.getStorageSync`/`wx.setStorageSync` 的读写封装，保存 `bodyProfile`、`stylePreference`、`selectedRecommendation`、`customSelection`、`orderSummary`。
- `miniprogram/utils/price.ts`：根据衣型基础价、面料加价、细节加价计算 mock 价格。
- `miniprogram/pages/home/`：首页。
- `miniprogram/pages/profile/`：身材档案页。
- `miniprogram/pages/style-test/`：风格测试页。
- `miniprogram/pages/recommendations/`：AI 推荐方案页。
- `miniprogram/pages/customizer/`：定制工作台。
- `miniprogram/pages/order-confirm/`：订单确认页。
- `miniprogram/components/navigation-bar/`：已存在，所有页面复用该自定义导航栏。

---

### Task 1: 项目搭建与公共模块

**Files:**
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/app.ts`
- Modify: `miniprogram/app.scss`
- Create: `miniprogram/data/mock-data.ts`
- Create: `miniprogram/data/app-state.ts`
- Create: `miniprogram/utils/price.ts`
- Delete: `miniprogram/pages/index/`, `miniprogram/pages/logs/`（脚手架默认页面）

**Interfaces:**
- Consumes: 无。
- Produces:
  - `mock-data.ts` 导出 `brandProfile`, `defaultBodyProfile`, `defaultStylePreference`, `customOptions`, `recommendations`。
  - `app-state.ts` 导出 `getBodyProfile()`, `setBodyProfile(p)`, `getStylePreference()`, `setStylePreference(p)`, `getSelectedRecommendation()`, `setSelectedRecommendation(r)`, `getCustomSelection()`, `setCustomSelection(c)`, `getOrderSummary()`。
  - `price.ts` 导出 `calculatePrice(garment, fabric, details)`，返回整数价格。

- [ ] **Step 1: 更新 `app.json` 页面路由**

```json
{
  "pages": [
    "pages/home/home",
    "pages/profile/profile",
    "pages/style-test/style-test",
    "pages/recommendations/recommendations",
    "pages/customizer/customizer",
    "pages/order-confirm/order-confirm"
  ],
  "window": {
    "navigationBarTextStyle": "black",
    "navigationStyle": "custom"
  },
  "style": "v2",
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "defaultContentBox": true,
      "tagNameStyleIsolation": "legacy",
      "disableABTest": true,
      "sdkVersionBegin": "3.0.0",
      "sdkVersionEnd": "15.255.255"
    }
  },
  "componentFramework": "glass-easel",
  "sitemapLocation": "sitemap.json",
  "lazyCodeLoading": "requiredComponents"
}
```

- [ ] **Step 2: 创建 `miniprogram/data/mock-data.ts`**

```typescript
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
    name: "老钱风商务套装",
    match: 94,
    price: 3980,
    scene: "商务通勤 / 客户会议",
    reason: "深石墨精纺羊毛大衣，低调克制，适合高净值客户的会议和通勤场景。"
  },
  {
    name: "轻奢休闲通勤款",
    match: 89,
    price: 4280,
    scene: "周末旅行 / 日常约会",
    reason: "海军蓝羊绒混纺，软垂感更强，适合高品质日常和周末会面。"
  },
  {
    name: "高级度假外套",
    match: 82,
    price: 4560,
    scene: "聚会 / 拍摄 / 特殊场合",
    reason: "橄榄绿粗花呢外套，兼顾松弛和辨识度，适合旅行、聚会和拍摄。"
  }
];
```

- [ ] **Step 3: 创建 `miniprogram/utils/price.ts`**

```typescript
import { customOptions, garmentBasePrice } from "../data/mock-data";

export function calculatePrice(
  garment: string,
  fabric: string,
  details: string[]
): number {
  const base = garmentBasePrice[garment] ?? 0;
  const fabricItem = customOptions.fabrics.find(f => f.name === fabric);
  const fabricPrice = fabricItem?.price ?? 0;
  const detailsPrice = details.reduce((sum, name) => {
    const item = customOptions.details.find(d => d.name === name);
    return sum + (item?.price ?? 0);
  }, 0);
  return base + fabricPrice + detailsPrice;
}
```

- [ ] **Step 4: 创建 `miniprogram/data/app-state.ts`**

```typescript
import {
  defaultBodyProfile,
  defaultStylePreference,
  recommendations,
  customOptions
} from "./mock-data";
import { calculatePrice } from "../utils/price";

const KEYS = {
  bodyProfile: "bodyProfile",
  stylePreference: "stylePreference",
  selectedRecommendation: "selectedRecommendation",
  customSelection: "customSelection"
};

export function getBodyProfile() {
  return wx.getStorageSync(KEYS.bodyProfile) || defaultBodyProfile;
}

export function setBodyProfile(profile: typeof defaultBodyProfile) {
  wx.setStorageSync(KEYS.bodyProfile, profile);
}

export function getStylePreference() {
  return wx.getStorageSync(KEYS.stylePreference) || defaultStylePreference;
}

export function setStylePreference(pref: typeof defaultStylePreference) {
  wx.setStorageSync(KEYS.stylePreference, pref);
}

export function getSelectedRecommendation() {
  return wx.getStorageSync(KEYS.selectedRecommendation) || recommendations[0];
}

export function setSelectedRecommendation(rec: typeof recommendations[0]) {
  wx.setStorageSync(KEYS.selectedRecommendation, rec);
}

export function getCustomSelection() {
  const saved = wx.getStorageSync(KEYS.customSelection);
  if (saved) return saved;
  return {
    garment: "大衣",
    fabric: customOptions.fabrics[0].name,
    color: "深石墨黑",
    fit: "合体",
    details: ["暖金纽扣", "半里布"]
  };
}

export function setCustomSelection(sel: ReturnType<typeof getCustomSelection>) {
  wx.setStorageSync(KEYS.customSelection, sel);
}

export function getOrderSummary() {
  const selection = getCustomSelection();
  const profile = getBodyProfile();
  const price = calculatePrice(selection.garment, selection.fabric, selection.details);
  return {
    ...selection,
    profile,
    price,
    deposit: Math.round(price * 0.31)
  };
}
```

- [ ] **Step 5: 更新 `app.ts` 初始化默认数据**

```typescript
import { setBodyProfile, setStylePreference, setCustomSelection } from "./data/app-state";
import { defaultBodyProfile, defaultStylePreference, customOptions } from "./data/mock-data";

App<IAppOption>({
  globalData: {},
  onLaunch() {
    setBodyProfile(defaultBodyProfile);
    setStylePreference(defaultStylePreference);
    setCustomSelection({
      garment: "大衣",
      fabric: customOptions.fabrics[0].name,
      color: "深石墨黑",
      fit: "合体",
      details: ["暖金纽扣", "半里布"]
    });
  }
});
```

- [ ] **Step 6: 创建 `miniprogram/app.scss` 全局样式**

保留原 `.container` 不影响新页面，新增变量与通用组件：

```scss
/**app.scss**/
page {
  --ink: #1c1917;
  --ink-2: #44403c;
  --muted: #78716c;
  --line: #e7e5e4;
  --paper: #fafaf9;
  --panel: #ffffff;
  --gold: #ca8a04;
  --gold-soft: #f7e8bc;
  --radius: 8px;
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  color: var(--ink);
  background: var(--paper);
}

.container {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 200rpx 0;
  box-sizing: border-box;
}

.page {
  min-height: 100vh;
  background: var(--paper);
  padding-bottom: 160rpx;
}

.section-title {
  margin: 32rpx 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28rpx;
}

.section-title text:first-child {
  font-size: 30rpx;
  font-weight: 900;
}

.section-title text:last-child {
  font-size: 22rpx;
  color: var(--gold);
  font-weight: 800;
}

.card {
  background: var(--panel);
  border: 1rpx solid var(--line);
  border-radius: var(--radius);
  box-shadow: 0 12rpx 30rpx rgba(28, 25, 23, 0.05);
}

.primary-btn, .dark-btn, .ghost-btn {
  min-height: 88rpx;
  border-radius: var(--radius);
  padding: 0 28rpx;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.primary-btn {
  background: var(--gold);
  color: #fff;
  border: none;
}

.dark-btn {
  background: var(--ink);
  color: #fff;
  border: none;
}

.ghost-btn {
  background: #fff;
  color: var(--ink);
  border: 1rpx solid var(--line);
}

.tag {
  min-height: 56rpx;
  border-radius: 999rpx;
  border: 1rpx solid var(--line);
  padding: 10rpx 20rpx;
  background: #fff;
  color: var(--ink-2);
  font-size: 22rpx;
  font-weight: 800;
}

.tag.active {
  border-color: rgba(202, 138, 4, 0.45);
  background: var(--gold-soft);
  color: #713f12;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.92);
  border-top: 1rpx solid var(--line);
  padding: 20rpx 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  box-sizing: border-box;
}

.bar-price text {
  display: block;
  font-size: 20rpx;
  color: var(--muted);
}

.bar-price text:last-child {
  font-size: 36rpx;
  color: var(--ink);
  font-weight: 900;
}
```

- [ ] **Step 7: 删除默认脚手架页面**

删除 `miniprogram/pages/index/` 和 `miniprogram/pages/logs/` 目录。

- [ ] **Step 8: 验证项目可编译**

Run: 微信开发者工具打开项目，点击“编译”。
Expected: 无报错，首页为 `pages/home/home`（此时 home 页面尚未实现，显示空白或占位文案即可）。

- [ ] **Step 9: Commit**

```bash
git add miniprogram/app.json miniprogram/app.ts miniprogram/app.scss miniprogram/data/ miniprogram/utils/
git rm -r miniprogram/pages/index miniprogram/pages/logs
git commit -m "chore: scaffold pages, mock data, shared state and global styles"
```

---

### Task 2: 首页

**Files:**
- Create: `miniprogram/pages/home/home.json`
- Create: `miniprogram/pages/home/home.ts`
- Create: `miniprogram/pages/home/home.wxml`
- Create: `miniprogram/pages/home/home.scss`

**Interfaces:**
- Consumes: `brandProfile`, `recommendations` from `mock-data.ts`。
- Produces: 点击“开始定制”跳转 `pages/profile/profile`；点击快捷入口/推荐方案卡片跳转对应页面。

- [ ] **Step 1: 创建页面配置文件**

`home.json`：

```json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 实现 `home.ts` 数据与跳转方法**

```typescript
import { brandProfile, recommendations } from "../../data/mock-data";

Page({
  data: {
    brand: brandProfile,
    recommendation: recommendations[0]
  },
  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  },
  goStyleTest() {
    wx.navigateTo({ url: "/pages/style-test/style-test" });
  },
  goRecommendations() {
    wx.navigateTo({ url: "/pages/recommendations/recommendations" });
  },
  goCustomizer() {
    wx.navigateTo({ url: "/pages/customizer/customizer" });
  }
});
```

- [ ] **Step 3: 实现 `home.wxml` 结构**

```xml
<navigation-bar title="77 Atelier" back="{{false}}"></navigation-bar>

<view class="page home-content">
  <view class="hero-card">
    <view class="hero-top">
      <view>
        <text class="hero-title">你的专属私人衣橱</text>
        <text class="hero-note">老钱风与轻奢休闲风，一对一匹配身形和个人气质。</text>
      </view>
    </view>
    <view class="hero-actions">
      <button class="primary-btn" bindtap="goProfile">开始定制</button>
      <button class="ghost-btn" bindtap="goRecommendations">看案例</button>
    </view>
  </view>

  <view class="quick-grid">
    <view class="quick-card" bindtap="goProfile">
      <view class="quick-icon">身</view>
      <text class="quick-title">身材档案</text>
      <text class="quick-desc">保存尺寸与身型</text>
    </view>
    <view class="quick-card" bindtap="goStyleTest">
      <view class="quick-icon">风</view>
      <text class="quick-title">风格测试</text>
      <text class="quick-desc">识别审美偏好</text>
    </view>
    <view class="quick-card" bindtap="goCustomizer">
      <view class="quick-icon">衣</view>
      <text class="quick-title">我的衣橱</text>
      <text class="quick-desc">复购和搭配记录</text>
    </view>
    <view class="quick-card" bindtap="goRecommendations">
      <view class="quick-icon">顾</view>
      <text class="quick-title">预约顾问</text>
      <text class="quick-desc">线下量体复核</text>
    </view>
  </view>

  <view class="brand-service-card">
    <text class="brand-name">{{brand.name}}</text>
    <text class="brand-desc">专注高端私人服装定制，拒绝流水线同质化设计，以高品质选材、精细化工艺和专属顾问服务完成全流程定制体验。</text>
    <view class="mini-tags">
      <text class="mini-tag" wx:for="{{brand.serviceKeywords}}" wx:key="index">{{item}}</text>
    </view>
  </view>
</view>
```

- [ ] **Step 4: 实现 `home.scss` 样式**

```scss
.home-content {
  padding: 24rpx;
}

.hero-card {
  min-height: 380rpx;
  border-radius: 36rpx;
  background: linear-gradient(145deg, rgba(28, 25, 23, 0.96), rgba(68, 64, 60, 0.9));
  color: #fff;
  padding: 32rpx;
  position: relative;
  overflow: hidden;
}

.hero-title {
  display: block;
  font-size: 54rpx;
  font-weight: 600;
  max-width: 300rpx;
  line-height: 1.1;
}

.hero-note {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.72);
  margin-top: 20rpx;
  max-width: 280rpx;
  line-height: 1.5;
}

.hero-actions {
  position: absolute;
  left: 32rpx;
  bottom: 32rpx;
  display: flex;
  gap: 16rpx;
}

.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-top: 24rpx;
}

.quick-card {
  min-height: 140rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid var(--line);
  border-radius: var(--radius);
}

.quick-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 999rpx;
  background: #f5f5f4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold);
  font-size: 24rpx;
  font-weight: 900;
  margin-bottom: 16rpx;
}

.quick-title {
  display: block;
  font-size: 26rpx;
  font-weight: 800;
}

.quick-desc {
  display: block;
  font-size: 20rpx;
  color: var(--muted);
  margin-top: 8rpx;
}

.brand-service-card {
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: var(--radius);
  background: #fff;
  border: 1rpx solid rgba(202, 138, 4, 0.28);
}

.brand-name {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  margin-bottom: 10rpx;
}

.brand-desc {
  display: block;
  font-size: 22rpx;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.mini-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.mini-tag {
  min-height: 40rpx;
  border-radius: 999rpx;
  background: #fafaf9;
  border: 1rpx solid var(--line);
  color: var(--ink-2);
  font-size: 20rpx;
  font-weight: 800;
  padding: 6rpx 16rpx;
}
```

- [ ] **Step 5: 微信开发者工具预览首页**

Run: 微信开发者工具 → 编译 → 首页。
Expected: 显示品牌 hero、开始定制按钮、四个快捷入口、品牌服务卡；无样式错乱。

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/home/
git commit -m "feat: add home page with brand hero and quick entries"
```

---

### Task 3: 身材档案页

**Files:**
- Create: `miniprogram/pages/profile/profile.json`
- Create: `miniprogram/pages/profile/profile.ts`
- Create: `miniprogram/pages/profile/profile.wxml`
- Create: `miniprogram/pages/profile/profile.scss`

**Interfaces:**
- Consumes: `defaultBodyProfile`, `bodyTypeOptions` from `mock-data.ts`；`getBodyProfile`, `setBodyProfile` from `app-state.ts`。
- Produces: 保存后跳转 `pages/style-test/style-test`。

- [ ] **Step 1: 创建页面配置**

`profile.json`：

```json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 实现 `profile.ts` 数据绑定与保存**

```typescript
import { getBodyProfile, setBodyProfile } from "../../data/app-state";
import { bodyTypeOptions } from "../../data/mock-data";

Page({
  data: {
    profile: getBodyProfile(),
    bodyTypes: bodyTypeOptions
  },
  onLoad() {
    this.setData({ profile: getBodyProfile() });
  },
  onInput(e: WechatMiniprogram.Input) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      [`profile.${field}`]: field === "bodyType" ? value : Number(value)
    });
  },
  selectBodyType(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type;
    this.setData({ "profile.bodyType": type });
  },
  save() {
    setBodyProfile(this.data.profile);
    wx.navigateTo({ url: "/pages/style-test/style-test" });
  }
});
```

- [ ] **Step 3: 实现 `profile.wxml` 结构**

```xml
<navigation-bar title="身材档案" back="{{true}}"></navigation-bar>

<view class="page profile-page">
  <view class="profile-summary">
    <view class="metric">
      <text class="metric-value">{{profile.height}}</text>
      <text class="metric-label">身高 cm</text>
    </view>
    <view class="metric">
      <text class="metric-value">{{profile.weight}}</text>
      <text class="metric-label">体重 kg</text>
    </view>
    <view class="metric">
      <text class="metric-value">{{profile.bodyType}}</text>
      <text class="metric-label">身型</text>
    </view>
  </view>

  <view class="section-title">
    <text>量体数据</text>
    <text>编辑</text>
  </view>

  <view class="form-grid">
    <view class="field">
      <text class="field-label">肩宽</text>
      <input type="digit" value="{{profile.shoulder}}" data-field="shoulder" bindinput="onInput" />
      <text class="field-unit">cm</text>
    </view>
    <view class="field">
      <text class="field-label">胸围</text>
      <input type="digit" value="{{profile.chest}}" data-field="chest" bindinput="onInput" />
      <text class="field-unit">cm</text>
    </view>
    <view class="field">
      <text class="field-label">腰围</text>
      <input type="digit" value="{{profile.waist}}" data-field="waist" bindinput="onInput" />
      <text class="field-unit">cm</text>
    </view>
    <view class="field">
      <text class="field-label">臀围</text>
      <input type="digit" value="{{profile.hip}}" data-field="hip" bindinput="onInput" />
      <text class="field-unit">cm</text>
    </view>
    <view class="field">
      <text class="field-label">袖长</text>
      <input type="digit" value="{{profile.sleeve}}" data-field="sleeve" bindinput="onInput" />
      <text class="field-unit">cm</text>
    </view>
    <view class="field">
      <text class="field-label">裤长</text>
      <input type="digit" value="{{profile.pantsLength}}" data-field="pantsLength" bindinput="onInput" />
      <text class="field-unit">cm</text>
    </view>
  </view>

  <view class="section-title">
    <text>身型选择</text>
  </view>
  <view class="tag-list">
    <text
      class="tag {{profile.bodyType === item ? 'active' : ''}}"
      wx:for="{{bodyTypes}}"
      wx:key="*this"
      data-type="{{item}}"
      bindtap="selectBodyType"
    >{{item}}</text>
  </view>

  <view class="section-title">
    <text>身高体重</text>
  </view>
  <view class="form-grid">
    <view class="field">
      <text class="field-label">身高</text>
      <input type="digit" value="{{profile.height}}" data-field="height" bindinput="onInput" />
      <text class="field-unit">cm</text>
    </view>
    <view class="field">
      <text class="field-label">体重</text>
      <input type="digit" value="{{profile.weight}}" data-field="weight" bindinput="onInput" />
      <text class="field-unit">kg</text>
    </view>
  </view>
</view>

<view class="bottom-bar">
  <view class="bar-price">
    <text>档案完整度</text>
    <text>86%</text>
  </view>
  <button class="dark-btn" bindtap="save">保存档案</button>
</view>
```

- [ ] **Step 4: 实现 `profile.scss` 样式**

```scss
.profile-page {
  padding: 24rpx 28rpx;
}

.profile-summary {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16rpx;
}

.metric {
  border-radius: var(--radius);
  background: #fff;
  border: 1rpx solid var(--line);
  padding: 20rpx;
  min-height: 110rpx;
}

.metric-value {
  display: block;
  font-size: 36rpx;
  font-weight: 900;
}

.metric-label {
  display: block;
  font-size: 20rpx;
  color: var(--muted);
  margin-top: 8rpx;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  padding: 0 28rpx;
}

.field {
  background: #fff;
  border: 1rpx solid var(--line);
  border-radius: var(--radius);
  padding: 20rpx;
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}

.field-label {
  font-size: 20rpx;
  color: var(--muted);
  margin-right: 12rpx;
}

.field input {
  flex: 1;
  font-size: 32rpx;
  font-weight: 900;
  min-width: 0;
}

.field-unit {
  font-size: 20rpx;
  color: var(--muted);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 0 28rpx;
}
```

- [ ] **Step 5: 微信开发者工具预览身材档案页**

Run: 从首页点击“开始定制”进入。
Expected: 显示默认身高/体重/身型、量体数据可编辑、身型标签可切换、保存后跳转风格测试页。

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/profile/
git commit -m "feat: add body profile page with editable measurements"
```

---

### Task 4: 风格测试页

**Files:**
- Create: `miniprogram/pages/style-test/style-test.json`
- Create: `miniprogram/pages/style-test/style-test.ts`
- Create: `miniprogram/pages/style-test/style-test.wxml`
- Create: `miniprogram/pages/style-test/style-test.scss`

**Interfaces:**
- Consumes: `styleOptions`, `colorMap` from `mock-data.ts`；`getStylePreference`, `setStylePreference` from `app-state.ts`。
- Produces: 保存后跳转 `pages/recommendations/recommendations`。

- [ ] **Step 1: 创建页面配置**

`style-test.json`：

```json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 实现 `style-test.ts` 多选/单选逻辑**

```typescript
import { getStylePreference, setStylePreference } from "../../data/app-state";
import { styleOptions, colorMap } from "../../data/mock-data";

Page({
  data: {
    options: styleOptions,
    colorMap,
    preference: getStylePreference()
  },
  onLoad() {
    this.setData({ preference: getStylePreference() });
  },
  toggleMulti(key: "styles" | "colors" | "scenes", value: string) {
    const list = this.data.preference[key];
    const next = list.includes(value)
      ? list.filter((v: string) => v !== value)
      : [...list, value];
    this.setData({ [`preference.${key}`]: next });
  },
  toggleStyle(e: WechatMiniprogram.TouchEvent) {
    this.toggleMulti("styles", e.currentTarget.dataset.value);
  },
  toggleColor(e: WechatMiniprogram.TouchEvent) {
    this.toggleMulti("colors", e.currentTarget.dataset.value);
  },
  toggleScene(e: WechatMiniprogram.TouchEvent) {
    this.toggleMulti("scenes", e.currentTarget.dataset.value);
  },
  selectFit(e: WechatMiniprogram.TouchEvent) {
    this.setData({ "preference.fit": e.currentTarget.dataset.value });
  },
  generate() {
    setStylePreference(this.data.preference);
    wx.navigateTo({ url: "/pages/recommendations/recommendations" });
  }
});
```

- [ ] **Step 3: 实现 `style-test.wxml` 结构**

```xml
<navigation-bar title="风格测试" back="{{true}}"></navigation-bar>

<view class="page style-page">
  <view class="section-title">
    <text>审美关键词</text>
    <text>可多选</text>
  </view>
  <view class="choice-grid">
    <view
      class="choice-card {{preference.styles.includes(item) ? 'active' : ''}}"
      wx:for="{{options.styles}}"
      wx:key="*this"
      data-value="{{item}}"
      bindtap="toggleStyle"
    >
      <text class="choice-title">{{item}}</text>
    </view>
  </view>

  <view class="section-title">
    <text>常用颜色</text>
  </view>
  <view class="swatches">
    <view
      class="swatch {{preference.colors.includes(item) ? 'active' : ''}}"
      wx:for="{{options.colors}}"
      wx:key="*this"
      style="background: {{colorMap[item]}}"
      data-value="{{item}}"
      bindtap="toggleColor"
    ></view>
  </view>

  <view class="section-title">
    <text>版型偏好</text>
    <text>单选</text>
  </view>
  <view class="tag-list">
    <text
      class="tag {{preference.fit === item ? 'active' : ''}}"
      wx:for="{{options.fits}}"
      wx:key="*this"
      data-value="{{item}}"
      bindtap="selectFit"
    >{{item}}</text>
  </view>

  <view class="section-title">
    <text>穿着场景</text>
    <text>可多选</text>
  </view>
  <view class="choice-grid">
    <view
      class="choice-card {{preference.scenes.includes(item) ? 'active' : ''}}"
      wx:for="{{options.scenes}}"
      wx:key="*this"
      data-value="{{item}}"
      bindtap="toggleScene"
    >
      <text class="choice-title">{{item}}</text>
    </view>
  </view>
</view>

<view class="bottom-bar">
  <view class="bar-price">
    <text>风格匹配</text>
    <text>{{preference.styles.join(' ') || '-'}}</text>
  </view>
  <button class="dark-btn" bindtap="generate">生成推荐</button>
</view>
```

- [ ] **Step 4: 实现 `style-test.scss` 样式**

```scss
.style-page {
  padding: 24rpx 28rpx 160rpx;
}

.choice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  padding: 0 28rpx;
}

.choice-card {
  min-height: 140rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid var(--line);
  border-radius: var(--radius);
}

.choice-card.active {
  border-color: rgba(202, 138, 4, 0.6);
  background: var(--gold-soft);
}

.choice-title {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
}

.swatches {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
  padding: 0 28rpx;
}

.swatch {
  width: 64rpx;
  height: 64rpx;
  border-radius: 999rpx;
  border: 4rpx solid #fff;
  box-shadow: 0 0 0 1rpx var(--line);
}

.swatch.active {
  box-shadow: 0 0 0 4rpx var(--gold);
}
```

- [ ] **Step 5: 微信开发者工具预览风格测试页**

Run: 从身材档案页保存后进入。
Expected: 风格、颜色、场景可多选；版型单选；生成推荐按钮跳转推荐页。

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/style-test/
git commit -m "feat: add style preference page with multi-select"
```

---

### Task 5: AI 推荐方案页

**Files:**
- Create: `miniprogram/pages/recommendations/recommendations.json`
- Create: `miniprogram/pages/recommendations/recommendations.ts`
- Create: `miniprogram/pages/recommendations/recommendations.wxml`
- Create: `miniprogram/pages/recommendations/recommendations.scss`

**Interfaces:**
- Consumes: `recommendations` from `mock-data.ts`；`setSelectedRecommendation` from `app-state.ts`。
- Produces: 选择方案后跳转 `pages/customizer/customizer`。

- [ ] **Step 1: 创建页面配置**

`recommendations.json`：

```json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 实现 `recommendations.ts`**

```typescript
import { recommendations } from "../../data/mock-data";
import { setSelectedRecommendation } from "../../data/app-state";

Page({
  data: {
    list: recommendations,
    selected: recommendations[0]
  },
  select(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const selected = this.data.list[index];
    this.setData({ selected });
    setSelectedRecommendation(selected);
  },
  goCustomizer() {
    setSelectedRecommendation(this.data.selected);
    wx.navigateTo({ url: "/pages/customizer/customizer" });
  }
});
```

- [ ] **Step 3: 实现 `recommendations.wxml` 结构**

```xml
<navigation-bar title="AI搭配推荐" back="{{true}}"></navigation-bar>

<view class="page rec-page">
  <view class="section-title">
    <text>为你生成 {{list.length}} 套方案</text>
    <text>基于档案</text>
  </view>

  <view
    class="look-card {{selected.name === item.name ? 'active' : ''}}"
    wx:for="{{list}}"
    wx:key="name"
    data-index="{{index}}"
    bindtap="select"
  >
    <view class="look-art"></view>
    <view class="look-info">
      <text class="look-name">{{item.name}}</text>
      <text class="look-reason">{{item.reason}}</text>
      <view class="score">
        <text>匹配 {{item.match}}%</text>
        <view class="progress"><view class="progress-inner" style="width: {{item.match}}%"></view></view>
      </view>
    </view>
  </view>

  <view class="advisor">
    <view class="avatar">AI</view>
    <view>
      <text class="advisor-title">AI 建议</text>
      <text class="advisor-desc">你的肩线适合保留 1.5cm 活动量</text>
    </view>
  </view>
</view>

<view class="bottom-bar">
  <view class="bar-price">
    <text>已选方案</text>
    <text>{{selected.name}}</text>
  </view>
  <button class="primary-btn" bindtap="goCustomizer">进入定制</button>
</view>
```

- [ ] **Step 4: 实现 `recommendations.scss` 样式**

```scss
.rec-page {
  padding: 24rpx 28rpx 160rpx;
}

.look-card {
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid var(--line);
  border-radius: var(--radius);
  display: flex;
  gap: 24rpx;
  margin-bottom: 20rpx;
}

.look-card.active {
  border-color: rgba(202, 138, 4, 0.6);
  background: var(--gold-soft);
}

.look-art {
  width: 140rpx;
  height: 170rpx;
  border-radius: var(--radius);
  background: linear-gradient(180deg, #292524, #78716c);
  flex-shrink: 0;
}

.look-info {
  flex: 1;
}

.look-name {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  margin-bottom: 10rpx;
}

.look-reason {
  display: block;
  font-size: 22rpx;
  color: var(--muted);
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.score {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: var(--gold);
  font-size: 22rpx;
  font-weight: 900;
}

.progress {
  flex: 1;
  height: 10rpx;
  border-radius: 999rpx;
  background: #e7e5e4;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: var(--gold);
  border-radius: inherit;
}

.advisor {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: var(--radius);
  background: #fff8e1;
  border: 1rpx solid #fde68a;
  margin-top: 24rpx;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 999rpx;
  background: var(--ink);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 800;
}

.advisor-title {
  display: block;
  font-size: 26rpx;
  font-weight: 800;
}

.advisor-desc {
  display: block;
  font-size: 20rpx;
  color: #854d0e;
  margin-top: 6rpx;
}
```

- [ ] **Step 5: 微信开发者工具预览推荐页**

Run: 从风格测试页生成推荐后进入。
Expected: 显示 3 套方案、匹配进度条、AI 建议、进入定制按钮跳转工作台。

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/recommendations/
git commit -m "feat: add AI recommendation list page"
```

---

### Task 6: 定制工作台

**Files:**
- Create: `miniprogram/pages/customizer/customizer.json`
- Create: `miniprogram/pages/customizer/customizer.ts`
- Create: `miniprogram/pages/customizer/customizer.wxml`
- Create: `miniprogram/pages/customizer/customizer.scss`

**Interfaces:**
- Consumes: `customOptions`, `garmentBasePrice`, `colorMap` from `mock-data.ts`；`getCustomSelection`, `setCustomSelection` from `app-state.ts`；`calculatePrice` from `utils/price.ts`。
- Produces: 点击加入方案后跳转 `pages/order-confirm/order-confirm`。

- [ ] **Step 1: 创建页面配置**

`customizer.json`：

```json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 实现 `customizer.ts` 选项交互与价格计算**

```typescript
import { getCustomSelection, setCustomSelection } from "../../data/app-state";
import { customOptions, colorMap } from "../../data/mock-data";
import { calculatePrice } from "../../utils/price";

Page({
  data: {
    options: customOptions,
    colorMap,
    selection: getCustomSelection(),
    price: 0
  },
  onLoad() {
    this.refresh();
  },
  refresh() {
    const selection = getCustomSelection();
    const price = calculatePrice(selection.garment, selection.fabric, selection.details);
    this.setData({ selection, price });
  },
  selectGarment(e: WechatMiniprogram.TouchEvent) {
    this.updateSelection("garment", e.currentTarget.dataset.value);
  },
  selectFabric(e: WechatMiniprogram.TouchEvent) {
    this.updateSelection("fabric", e.currentTarget.dataset.value);
  },
  selectColor(e: WechatMiniprogram.TouchEvent) {
    this.updateSelection("color", e.currentTarget.dataset.value);
  },
  selectFit(e: WechatMiniprogram.TouchEvent) {
    this.updateSelection("fit", e.currentTarget.dataset.value);
  },
  toggleDetail(e: WechatMiniprogram.TouchEvent) {
    const name = e.currentTarget.dataset.value;
    const details = this.data.selection.details;
    const next = details.includes(name)
      ? details.filter((d: string) => d !== name)
      : [...details, name];
    this.updateSelection("details", next);
  },
  updateSelection(key: string, value: any) {
    const selection = { ...this.data.selection, [key]: value };
    setCustomSelection(selection);
    this.refresh();
  },
  goOrder() {
    wx.navigateTo({ url: "/pages/order-confirm/order-confirm" });
  }
});
```

- [ ] **Step 3: 实现 `customizer.wxml` 结构**

```xml
<navigation-bar title="定制工作台" back="{{true}}"></navigation-bar>

<view class="page customizer-page">
  <view class="preview">
    <text class="preview-label">{{selection.garment}} / {{selection.fit}}</text>
    <view class="preview-swatch" style="background: {{colorMap[selection.color]}}"></view>
  </view>

  <view class="section-title"><text>衣型</text></view>
  <view class="tag-list">
    <text
      class="tag {{selection.garment === item ? 'active' : ''}}"
      wx:for="{{options.garmentTypes}}"
      wx:key="*this"
      data-value="{{item}}"
      bindtap="selectGarment"
    >{{item}}</text>
  </view>

  <view class="section-title"><text>颜色</text></view>
  <view class="swatches">
    <view
      class="swatch {{selection.color === item ? 'active' : ''}}"
      wx:for="{{options.colors}}"
      wx:key="*this"
      style="background: {{colorMap[item]}}"
      data-value="{{item}}"
      bindtap="selectColor"
    ></view>
  </view>

  <view class="section-title"><text>版型</text></view>
  <view class="tag-list">
    <text
      class="tag {{selection.fit === item ? 'active' : ''}}"
      wx:for="{{['修身','合体','宽松','廓形']}}"
      wx:key="*this"
      data-value="{{item}}"
      bindtap="selectFit"
    >{{item}}</text>
  </view>

  <view class="section-title"><text>选择毛料</text></view>
  <view class="fabric-list">
    <view
      class="fabric-card {{selection.fabric === item.name ? 'active' : ''}}"
      wx:for="{{options.fabrics}}"
      wx:key="name"
      data-value="{{item.name}}"
      bindtap="selectFabric"
    >
      <view class="texture"></view>
      <view>
        <text class="fabric-name">{{item.name}}</text>
        <text class="fabric-desc">{{item.price > 0 ? '加价 ¥' + item.price : '默认面料'}}</text>
      </view>
      <text class="price">{{item.price > 0 ? '+¥' + item.price : '¥0'}}</text>
    </view>
  </view>

  <view class="section-title"><text>工艺细节</text></view>
  <view class="tag-list">
    <text
      class="tag {{selection.details.includes(item.name) ? 'active' : ''}}"
      wx:for="{{options.details}}"
      wx:key="name"
      data-value="{{item.name}}"
      bindtap="toggleDetail"
    >{{item.name}}</text>
  </view>
</view>

<view class="bottom-bar">
  <view class="bar-price">
    <text>预计价格</text>
    <text>¥{{price}}</text>
  </view>
  <button class="primary-btn" bindtap="goOrder">加入方案</button>
</view>
```

- [ ] **Step 4: 实现 `customizer.scss` 样式**

```scss
.customizer-page {
  padding: 24rpx 28rpx 160rpx;
}

.preview {
  height: 400rpx;
  border-radius: 32rpx;
  background: linear-gradient(155deg, #292524, #57534e);
  position: relative;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.preview-label {
  position: absolute;
  top: 24rpx;
  left: 24rpx;
  color: #fff;
  font-size: 24rpx;
  font-weight: 800;
  z-index: 2;
}

.preview-swatch {
  position: absolute;
  right: 40rpx;
  bottom: 40rpx;
  width: 120rpx;
  height: 120rpx;
  border-radius: 999rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.4);
}

.fabric-list {
  display: grid;
  gap: 16rpx;
  padding: 0 28rpx;
}

.fabric-card {
  padding: 20rpx;
  background: #fff;
  border: 1rpx solid var(--line);
  border-radius: var(--radius);
  display: grid;
  grid-template-columns: 64rpx 1fr auto;
  gap: 20rpx;
  align-items: center;
}

.fabric-card.active {
  border-color: rgba(202, 138, 4, 0.6);
  background: var(--gold-soft);
}

.texture {
  width: 64rpx;
  height: 64rpx;
  border-radius: var(--radius);
  background: #57534e;
}

.fabric-name {
  display: block;
  font-size: 26rpx;
  font-weight: 800;
}

.fabric-desc {
  display: block;
  font-size: 20rpx;
  color: var(--muted);
}

.price {
  color: var(--gold);
  font-weight: 900;
  font-size: 24rpx;
}
```

- [ ] **Step 5: 微信开发者工具预览定制工作台**

Run: 从推荐页进入。
Expected: 预览区显示当前衣型/颜色；衣型、颜色、版型、面料、细节可选；价格随选择实时变化；加入方案跳转订单确认页。

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/customizer/
git commit -m "feat: add customizer workbench with live price calculation"
```

---

### Task 7: 订单确认页

**Files:**
- Create: `miniprogram/pages/order-confirm/order-confirm.json`
- Create: `miniprogram/pages/order-confirm/order-confirm.ts`
- Create: `miniprogram/pages/order-confirm/order-confirm.wxml`
- Create: `miniprogram/pages/order-confirm/order-confirm.scss`

**Interfaces:**
- Consumes: `brandProfile` from `mock-data.ts`；`getOrderSummary` from `app-state.ts`。
- Produces: 模拟下单成功弹窗 / 预约顾问提示。

- [ ] **Step 1: 创建页面配置**

`order-confirm.json`：

```json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 实现 `order-confirm.ts`**

```typescript
import { getOrderSummary } from "../../data/app-state";
import { brandProfile } from "../../data/mock-data";

Page({
  data: {
    order: getOrderSummary(),
    brand: brandProfile
  },
  onLoad() {
    this.setData({ order: getOrderSummary(), brand: brandProfile });
  },
  confirm() {
    wx.showModal({
      title: "模拟下单成功",
      content: "顾问将在 24 小时内联系你确认尺寸与面料。",
      showCancel: false,
      success: () => {
        wx.navigateBack({ delta: 5 });
      }
    });
  },
  bookAdvisor() {
    wx.showToast({
      title: "预约成功",
      icon: "success",
      duration: 2000
    });
  }
});
```

- [ ] **Step 3: 实现 `order-confirm.wxml` 结构**

```xml
<navigation-bar title="订单确认" back="{{true}}"></navigation-bar>

<view class="page order-page">
  <view class="order-card">
    <view class="order-line"><text>定制品类</text><text>{{order.garment}}</text></view>
    <view class="order-line"><text>面料</text><text>{{order.fabric}}</text></view>
    <view class="order-line"><text>颜色</text><text>{{order.color}}</text></view>
    <view class="order-line"><text>版型</text><text>{{order.fit}}</text></view>
    <view class="order-line"><text>工艺</text><text>{{order.details.join(' / ') || '-'}}</text></view>
  </view>

  <view class="order-card">
    <view class="order-line"><text>尺寸档案</text><text>{{order.profile.height}}cm / {{order.profile.weight}}kg / {{order.profile.bodyType}}</text></view>
    <view class="order-line"><text>预计工期</text><text>18-25 天</text></view>
  </view>

  <view class="advisor" bindtap="bookAdvisor">
    <view class="avatar">顾</view>
    <view>
      <text class="advisor-title">顾问复核</text>
      <text class="advisor-desc">支付前由版师检查尺寸和工艺冲突</text>
    </view>
  </view>

  <view class="order-card">
    <view class="order-line"><text>服务机构</text><text>{{brand.name}}</text></view>
    <view class="order-line"><text>服务标准</text><text>面料甄选 / 版型打磨 / 一对一专属定制</text></view>
    <view class="order-line"><text>线下量体地址</text><text>{{brand.address}}</text></view>
  </view>

  <view class="order-card">
    <view class="order-line"><text>商品金额</text><text>¥{{order.price}}</text></view>
    <view class="order-line"><text>顾问复核</text><text>¥0</text></view>
    <view class="order-line"><text>订金支付</text><text>¥{{order.deposit}}</text></view>
  </view>
</view>

<view class="bottom-bar">
  <view class="bar-price">
    <text>本次支付</text>
    <text>¥{{order.deposit}}</text>
  </view>
  <button class="primary-btn" bindtap="confirm">确认支付</button>
</view>
```

- [ ] **Step 4: 实现 `order-confirm.scss` 样式**

```scss
.order-page {
  padding: 24rpx 28rpx 160rpx;
}

.order-card {
  padding: 24rpx;
  background: #fff;
  border: 1rpx solid var(--line);
  border-radius: var(--radius);
  margin-bottom: 20rpx;
}

.order-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 56rpx;
  font-size: 24rpx;
  border-bottom: 1rpx solid var(--line);
}

.order-line:last-child {
  border-bottom: 0;
}

.order-line text:first-child {
  color: var(--muted);
}

.order-line text:last-child {
  font-weight: 800;
  text-align: right;
  max-width: 60%;
}
```

- [ ] **Step 5: 微信开发者工具预览订单确认页**

Run: 从定制工作台点击加入方案进入。
Expected: 汇总定制选项、身材档案、服务机构与地址、价格明细；确认支付弹出成功弹窗；点击顾问复核区域弹出预约成功提示。

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/order-confirm/
git commit -m "feat: add order confirmation page with mock checkout"
```

---

### Task 8: 体验优化与验收检查

**Files:**
- Modify: `miniprogram/app.scss`（如需要补全通用类）
- Modify: 各页面 `.scss`（修复错位、统一间距）

**Interfaces:**
- Consumes: 全部已实现页面。
- Produces: 通过验收标准。

- [ ] **Step 1: 添加输入框聚焦样式与按钮点击态**

在 `app.scss` 追加：

```scss
button::after {
  border: none;
}

button:active {
  opacity: 0.85;
}

input {
  caret-color: var(--gold);
}
```

- [ ] **Step 2: 检查页面返回与 tab 占位**

确保所有页面 `padding-bottom` 不小于 `160rpx`，避免 fixed 底栏遮挡内容。

- [ ] **Step 3: 真机预览**

Run: 微信开发者工具 → 真机调试 → 选择 iPhone / Android 预览。
Expected:
- 首页 hero 无溢出。
- 各表单输入无横向滚动。
- 底栏始终可见且不遮挡内容。
- 颜色色卡可点击。
- 从首页到订单确认页完整流程可跑通。

- [ ] **Step 4: Commit**

```bash
git add miniprogram/app.scss
git commit -m "style: polish active states and spacing for mobile preview"
```

---

## Self-Review

**1. Spec coverage:**
- 首页品牌展示、开始定制、快捷入口、品牌服务卡：Task 2。
- 身材档案输入与身型选择：Task 3。
- 风格、颜色多选，版型单选，场景多选：Task 4。
- 3 套推荐方案展示：Task 5。
- 定制工作台衣型、颜色、面料、细节选择与实时价格：Task 6。
- 订单确认页汇总、服务机构、地址、模拟下单/预约顾问：Task 7。
- 移动端布局与体验优化：Task 8。

**2. Placeholder scan：** 无 TBD/TODO；所有步骤含具体代码与命令。

**3. Type consistency：** `app-state.ts` 导出的 getter/setter 类型与 mock-data 一致；`calculatePrice` 输入参数与 customOptions 字段命名一致；页面中 data 字段与模板绑定一致。

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-22-tailor-miniapp-simple.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

**Which approach?**
