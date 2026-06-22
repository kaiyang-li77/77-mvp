import { getOrderSummary } from "../../data/app-state";
import { brandProfile } from "../../data/mock-data";

Page({
  data: {
    order: getOrderSummary(),
    brand: brandProfile
  },
  onLoad() {
    this.setData({ order: getOrderSummary(), brand: brandProfile });
  },
  confirm() {
    wx.showModal({
      title: "模拟下单成功",
      content: "顾问将在 24 小时内联系你确认尺寸与面料。",
      showCancel: false,
      success: () => {
        wx.navigateBack({ delta: 5 });
      }
    });
  },
  bookAdvisor() {
    wx.showToast({
      title: "预约成功",
      icon: "success",
      duration: 2000
    });
  }
});
