import { getBodyProfile, getCustomSelection, createOrder, bookAdvisor, CustomSelection, BodyProfile } from '../../data/app-state';
import { brandProfile, customOptions } from '../../data/mock-data';

function findName(list: Array<{ code: string; name: string }>, code: string) {
  const item = list.find(option => option.code === code || option.name === code);
  return item ? item.name : code || '-';
}

function detailNames(codes: string[]) {
  return codes.map(code => findName(customOptions.details, code));
}

function displayPrice(value: number) {
  if (!value) return '0';
  const yuan = value >= 10000 ? value / 100 : value;
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
}

function profileText(profile: BodyProfile | null) {
  if (!profile) return '-';
  return `${profile.height}cm / ${profile.weight}kg / ${profile.body_type}`;
}

Page({
  data: {
    order: {} as any,
    brand: brandProfile,
    remark: ''
  },
  async onLoad() {
    wx.showLoading({ title: '加载中' });
    try {
      const [selection, profile] = await Promise.all([
        getCustomSelection(),
        getBodyProfile()
      ]);
      this.setData({ order: this.buildOrderSummary(selection, profile) });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  buildOrderSummary(selection: CustomSelection | null, profile: BodyProfile | null) {
    if (!selection) {
      return {
        garment: '-',
        fabric: '-',
        color: '-',
        fit: '-',
        details: [],
        detailsText: '-',
        profile: profile || null,
        profileText: profileText(profile),
        price: 0,
        priceText: '0',
        deposit: 0,
        depositText: '0'
      };
    }
    const price = selection.calculated_price || 0;
    const deposit = Math.round(price * 0.31);
    const details = detailNames(selection.detail_codes || []);
    return {
      garment: findName(customOptions.garmentTypes, selection.garment_code),
      fabric: findName(customOptions.fabrics, selection.fabric_code),
      color: findName(customOptions.colors, selection.color_code),
      fit: selection.fit || '-',
      details,
      detailsText: details.join(' / ') || '-',
      profile: profile || null,
      profileText: profileText(profile),
      price,
      priceText: displayPrice(price),
      deposit,
      depositText: displayPrice(deposit)
    };
  },
  onRemarkInput(e: WechatMiniprogram.Input) {
    this.setData({ remark: e.detail.value });
  },
  async confirm() {
    wx.showLoading({ title: '提交中' });
    try {
      const selection = await getCustomSelection();
      if (!selection) {
        wx.showToast({ title: '请先完成定制', icon: 'none' });
        return;
      }
      await createOrder({ ...selection, remark: this.data.remark.trim() });
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
