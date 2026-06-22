import { brandProfile, recommendations } from "../../data/mock-data";

Page({
  data: {
    brand: brandProfile,
    recommendation: recommendations[0]
  },
  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  },
  goStyleTest() {
    wx.navigateTo({ url: "/pages/style-test/style-test" });
  },
  goRecommendations() {
    wx.navigateTo({ url: "/pages/recommendations/recommendations" });
  },
  goCustomizer() {
    wx.navigateTo({ url: "/pages/customizer/customizer" });
  }
});
