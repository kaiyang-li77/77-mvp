import { getBodyProfile, setBodyProfile, BodyProfile } from '../../data/app-state';
import { bodyTypeOptions, defaultBodyProfile } from '../../data/mock-data';

Page({
  data: {
    profile: {} as BodyProfile,
    bodyTypes: bodyTypeOptions
  },
  async onLoad() {
    wx.showLoading({ title: '加载中' });
    try {
      const profile = await getBodyProfile();
      this.setData({ profile: profile || defaultBodyProfile });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  onInput(e: WechatMiniprogram.Input) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      [`profile.${field}`]: field === 'bodyType' ? value : Number(value)
    });
  },
  selectBodyType(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type;
    this.setData({ 'profile.bodyType': type });
  },
  async save() {
    wx.showLoading({ title: '保存中' });
    try {
      await setBodyProfile(this.data.profile);
      wx.navigateTo({ url: '/pages/style-test/style-test' });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
