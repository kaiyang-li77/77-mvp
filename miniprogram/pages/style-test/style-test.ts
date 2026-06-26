import { getStylePreference, setStylePreference, StylePreference } from '../../data/app-state';
import { styleOptions, colorMap, defaultStylePreference } from '../../data/mock-data';

Page({
  data: {
    options: styleOptions,
    colorMap,
    preference: {} as StylePreference
  },
  async onLoad() {
    wx.showLoading({ title: '加载中' });
    try {
      const preference = await getStylePreference();
      this.setData({ preference: preference || defaultStylePreference });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  toggleMulti(key: 'styles' | 'colors' | 'scenes', value: string) {
    const list = this.data.preference[key];
    const next = list.includes(value)
      ? list.filter((v: string) => v !== value)
      : [...list, value];
    this.setData({ [`preference.${key}`]: next });
  },
  toggleStyle(e: WechatMiniprogram.TouchEvent) {
    this.toggleMulti('styles', e.currentTarget.dataset.value);
  },
  toggleColor(e: WechatMiniprogram.TouchEvent) {
    this.toggleMulti('colors', e.currentTarget.dataset.value);
  },
  toggleScene(e: WechatMiniprogram.TouchEvent) {
    this.toggleMulti('scenes', e.currentTarget.dataset.value);
  },
  selectFit(e: WechatMiniprogram.TouchEvent) {
    this.setData({ 'preference.fit': e.currentTarget.dataset.value });
  },
  async generate() {
    wx.showLoading({ title: '保存中' });
    try {
      await setStylePreference(this.data.preference);
      wx.switchTab({ url: '/pages/recommendations/recommendations' });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
