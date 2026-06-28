import { readFileSync } from 'node:fs';

const file = new URL('./tailor-miniapp-prototype.html', import.meta.url);
const html = readFileSync(file, 'utf8');

const requiredScreens = [
  '首页',
  '身材档案',
  '风格测试',
  '定制工作台',
  'AI搭配推荐',
  '订单确认',
];

const requiredTerms = [
  '开始定制',
  '肩宽',
  '胸围',
  '版型偏好',
  '羊绒',
  '精纺羊毛',
  '暖金纽扣',
  '加入方案',
  '顾问复核',
  '确认支付',
  '私人定制工作室',
  '高净值客户',
  '老钱风',
  '轻奢休闲风',
  '线下量体门店',
];

for (const screen of requiredScreens) {
  if (!html.includes(`data-screen="${screen}"`)) {
    throw new Error(`Missing screen: ${screen}`);
  }
}

for (const term of requiredTerms) {
  if (!html.includes(term)) {
    throw new Error(`Missing required term: ${term}`);
  }
}

const phoneCount = (html.match(/class="phone/g) || []).length;
if (phoneCount !== 6) {
  throw new Error(`Expected 6 phone frames, found ${phoneCount}`);
}

const emojiPattern = /[\u{1F300}-\u{1FAFF}]/u;
if (emojiPattern.test(html)) {
  throw new Error('Prototype contains emoji; use SVG/interface icons instead.');
}

console.log('Prototype structure checks passed.');
