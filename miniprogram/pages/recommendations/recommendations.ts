import { recommendations } from "../../data/mock-data";
import { setSelectedRecommendation } from "../../data/app-state";

Page({
  data: {
    list: recommendations,
    selected: recommendations[0]
  },
  select(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const selected = this.data.list[index];
    this.setData({ selected });
    setSelectedRecommendation(selected);
  },
  goCustomizer() {
    setSelectedRecommendation(this.data.selected);
    wx.navigateTo({ url: "/pages/customizer/customizer" });
  }
});
