import { getStylePreference, setStylePreference, StylePreference } from '../../data/app-state';
import { styleOptions, colorMap, defaultStylePreference } from '../../data/mock-data';

function toList(value: unknown): string[] {
  return Array.isArray(value) ? value : [];
}

function toSelectedMap(values: string[]) {
  return values.reduce((map: Record<string, boolean>, item) => {
    map[item] = true;
    return map;
  }, {});
}

Page({
  data: {
    options: styleOptions,
    colorMap,
    preference: defaultStylePreference as StylePreference,
    selectedStyles: {} as Record<string, boolean>,
    selectedColors: {} as Record<string, boolean>,
    selectedScenes: {} as Record<string, boolean>,
    styleSummary: '-'
  },
  async onLoad() {
    wx.showLoading({ title: '加载中' });
    try {
      const preference = await getStylePreference();
      this.applyPreference(preference || defaultStylePreference);
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  applyPreference(preference: StylePreference & Record<string, any>) {
    const normalized = {
      preferred_styles: toList(preference.preferred_styles || preference.styles),
      preferred_colors: toList(preference.preferred_colors || preference.colors),
      fit: preference.fit || defaultStylePreference.fit,
      preferred_scenes: toList(preference.preferred_scenes || preference.scenes)
    };
    this.setData({
      preference: normalized,
      selectedStyles: toSelectedMap(normalized.preferred_styles),
      selectedColors: toSelectedMap(normalized.preferred_colors),
      selectedScenes: toSelectedMap(normalized.preferred_scenes),
      styleSummary: normalized.preferred_styles.join(' ') || '-'
    });
  },
  toggleMulti(key: 'preferred_styles' | 'preferred_colors' | 'preferred_scenes', value: string) {
    const list = toList(this.data.preference[key]);
    const next = list.includes(value)
      ? list.filter((v: string) => v !== value)
      : [...list, value];
    this.applyPreference({ ...this.data.preference, [key]: next });
  },
  toggleStyle(e: WechatMiniprogram.TouchEvent) {
    this.toggleMulti('preferred_styles', e.currentTarget.dataset.value);
  },
  toggleColor(e: WechatMiniprogram.TouchEvent) {
    this.toggleMulti('preferred_colors', e.currentTarget.dataset.value);
  },
  toggleScene(e: WechatMiniprogram.TouchEvent) {
    this.toggleMulti('preferred_scenes', e.currentTarget.dataset.value);
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
