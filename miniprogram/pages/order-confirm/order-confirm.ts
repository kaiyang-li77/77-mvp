import { getCustomSelection, createOrder, bookAdvisor, CustomSelection } from '../../data/app-state';
import { brandProfile } from '../../data/mock-data';

Page({
  data: {
    order: {} as any,
    brand: brandProfile
  },
  async onLoad() {
    wx.showLoading({ title: '加载中' });
    try {
      const selection = await getCustomSelection();
      this.setData({ order: this.buildOrderSummary(selection) });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  buildOrderSummary(selection: CustomSelection | null) {
    if (!selection) {
      return { items: [], total: 0 };
    }
    const items = [
      { label: '品类', value: selection.garment_code },
      { label: '面料', value: selection.fabric_code },
      { label: '颜色', value: selection.color_code },
      { label: '版型', value: selection.fit },
      { label: '细节', value: selection.detail_codes.join('、') || '无' }
    ];
    return { items, total: selection.calculated_price };
  },
  async confirm() {
    wx.showLoading({ title: '提交中' });
    try {
      const selection = await getCustomSelection();
      if (!selection) {
        wx.showToast({ title: '请先完成定制', icon: 'none' });
        return;
      }
      await createOrder(selection);
      wx.showModal({
        title: '模拟下单成功',
        content: '顾问将在 24 小时内联系你确认尺寸与面料。',
        showCancel: false,
        success: () => {
          wx.switchTab({ url: '/pages/home/home' });
        }
      });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  async bookAdvisor() {
    wx.showLoading({ title: '预约中' });
    try {
      await bookAdvisor();
      wx.showToast({ title: '预约成功', icon: 'success', duration: 2000 });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
