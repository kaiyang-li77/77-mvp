import { getBodyProfile, getStylePreference, getRecommendations } from '../../data/app-state';
import { brandProfile, recommendations as defaultRecommendations } from '../../data/mock-data';

Page({
  data: {
    brand: brandProfile,
    recommendation: null as any,
    hasProfile: false,
    hasStyle: false
  },
  async onLoad() {
    wx.showLoading({ title: '加载中' });
    try {
      const [profile, preference, recommendations] = await Promise.all([
        getBodyProfile(),
        getStylePreference(),
        getRecommendations()
      ]);
      this.setData({
        recommendation: (recommendations || defaultRecommendations)[0],
        hasProfile: !!profile,
        hasStyle: !!preference
      });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
      this.setData({ recommendation: defaultRecommendations[0] });
    } finally {
      wx.hideLoading();
    }
  },
  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  },
  goStyleTest() {
    wx.navigateTo({ url: '/pages/style-test/style-test' });
  },
  goRecommendations() {
    wx.switchTab({ url: '/pages/recommendations/recommendations' });
  },
  goCustomizer() {
    wx.switchTab({ url: '/pages/customizer/customizer' });
  }
});
