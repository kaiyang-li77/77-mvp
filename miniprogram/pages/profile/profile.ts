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
