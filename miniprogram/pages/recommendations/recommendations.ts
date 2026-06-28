import { getRecommendations } from '../../data/app-state';
import { recommendations as defaultRecommendations } from '../../data/mock-data';

function normalizeRecommendation(item: any, index: number) {
  const firstItem = (item.items && item.items[0]) || {};
  const match = item.match || item.match_score || 0;
  return {
    ...item,
    id: item.code || item.id || `rec-${index + 1}`,
    name: item.name || item.style_name || firstItem.garment_name || `推荐方案 ${index + 1}`,
    match,
    matchText: `${match}%`,
    reason: item.reason || item.scene_description || [firstItem.fabric_name, firstItem.color_name, firstItem.garment_name].filter(Boolean).join(' / '),
    scene: item.scene_description || item.scene || '-',
    price: item.price || item.base_price || 0,
    colorHex: firstItem.hex_value || item.colorHex || '',
    garmentName: firstItem.garment_name || ''
  };
}

function normalizeList(list: any[] | null) {
  const source = list && list.length > 0 ? list : defaultRecommendations;
  return source.map(normalizeRecommendation);
}

Page({
  data: {
    list: [] as any[],
    selected: null as any
  },
  async onLoad() {
    wx.showLoading({ title: '加载中' });
    try {
      const list = normalizeList(await getRecommendations());
      this.setData({ list, selected: list[0] });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
      const list = normalizeList(defaultRecommendations);
      this.setData({ list, selected: list[0] });
    } finally {
      wx.hideLoading();
    }
  },
  select(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const selected = this.data.list[index];
    this.setData({ selected });
    wx.setStorageSync('selectedRecommendation', selected);
  },
  goCustomizer() {
    wx.setStorageSync('selectedRecommendation', this.data.selected);
    wx.switchTab({ url: '/pages/customizer/customizer' });
  }
});
