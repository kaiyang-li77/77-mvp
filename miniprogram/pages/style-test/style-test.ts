import { getStylePreference, setStylePreference } from "../../data/app-state";
import { styleOptions, colorMap } from "../../data/mock-data";

Page({
  data: {
    options: styleOptions,
    colorMap,
    preference: getStylePreference()
  },
  onLoad() {
    this.setData({ preference: getStylePreference() });
  },
  toggleMulti(key: "styles" | "colors" | "scenes", value: string) {
    const list = this.data.preference[key];
    const next = list.includes(value)
      ? list.filter((v: string) => v !== value)
      : [...list, value];
    this.setData({ [`preference.${key}`]: next });
  },
  toggleStyle(e: WechatMiniprogram.TouchEvent) {
    this.toggleMulti("styles", e.currentTarget.dataset.value);
  },
  toggleColor(e: WechatMiniprogram.TouchEvent) {
    this.toggleMulti("colors", e.currentTarget.dataset.value);
  },
  toggleScene(e: WechatMiniprogram.TouchEvent) {
    this.toggleMulti("scenes", e.currentTarget.dataset.value);
  },
  selectFit(e: WechatMiniprogram.TouchEvent) {
    this.setData({ "preference.fit": e.currentTarget.dataset.value });
  },
  generate() {
    setStylePreference(this.data.preference);
    wx.navigateTo({ url: "/pages/recommendations/recommendations" });
  }
});
