import { setBodyProfile, setStylePreference, setCustomSelection } from "./data/app-state";
import { defaultBodyProfile, defaultStylePreference, customOptions } from "./data/mock-data";

App<IAppOption>({
  globalData: {},
  onLaunch() {
    wx.cloud.init({
      // TODO: 替换为你的微信云开发环境 ID
      env: '你的云环境ID',
      traceUser: true
    });

    if (!wx.getStorageSync("bodyProfile")) {
      setBodyProfile(defaultBodyProfile);
    }
    if (!wx.getStorageSync("stylePreference")) {
      setStylePreference(defaultStylePreference);
    }
    if (!wx.getStorageSync("customSelection")) {
      setCustomSelection({
        garment: "大衣",
        fabric: customOptions.fabrics[0].name,
        color: "深石墨黑",
        fit: "合体",
        details: ["暖金纽扣", "半里布"]
      });
    }
  }
});
