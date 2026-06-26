import { getRecommendations } from '../../data/app-state';
import { recommendations as defaultRecommendations } from '../../data/mock-data';

Page({
  data: {
    list: [] as any[],
    selected: null as any
  },
  async onLoad() {
    wx.showLoading({ title: '加载中' });
    try {
      const list = await getRecommendations();
      this.setData({ list: list || defaultRecommendations, selected: (list || defaultRecommendations)[0] });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
      this.setData({ list: defaultRecommendations, selected: defaultRecommendations[0] });
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
