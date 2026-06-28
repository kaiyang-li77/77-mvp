import { getBodyProfile, setBodyProfile, BodyProfile } from '../../data/app-state';
import { bodyTypeOptions, defaultBodyProfile } from '../../data/mock-data';

const bodyTypeTags: Record<string, string[]> = {
  直筒: ['肩线平直', '腰差较小', '腿长比例优'],
  梨形: ['肩窄胯宽', '腰臀差明显', '下装需平衡'],
  倒三角: ['肩部更宽', '腰差较小', '下摆需扩张'],
  苹果型: ['胸腰较集中', '腰线需重塑', '面料需挺括'],
  沙漏型: ['肩臀均衡', '腰线明显', '曲线比例优']
};

function normalizeProfile(profile: BodyProfile & Record<string, any>) {
  return {
    ...defaultBodyProfile,
    ...profile,
    pants_length: profile.pants_length || profile.pantsLength || defaultBodyProfile.pants_length,
    body_type: profile.body_type || profile.bodyType || defaultBodyProfile.body_type
  };
}

Page({
  data: {
    profile: {} as BodyProfile,
    bodyTypes: bodyTypeOptions,
    bodyTags: bodyTypeTags[defaultBodyProfile.body_type]
  },
  async onLoad() {
    wx.showLoading({ title: '加载中' });
    try {
      const profile = await getBodyProfile();
      const effective = normalizeProfile(profile || defaultBodyProfile);
      this.setData({
        profile: effective,
        bodyTags: bodyTypeTags[effective.body_type] || bodyTypeTags[defaultBodyProfile.body_type]
      });
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
      [`profile.${field}`]: field === 'body_type' ? value : Number(value)
    });
  },
  selectBodyType(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type as string;
    if (!type) {
      wx.showToast({ title: '请选择身型', icon: 'none' });
      return;
    }
    this.setData({
      'profile.body_type': type,
      bodyTags: bodyTypeTags[type] || bodyTypeTags[defaultBodyProfile.body_type]
    });
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
