import { getCustomSelection, setCustomSelection, CustomSelection } from '../../data/app-state';
import { customOptions, colorMap, styleOptions } from '../../data/mock-data';
import { calculatePriceSync } from '../../utils/price';

const defaultSelection: CustomSelection = {
  garment_code: customOptions.garmentTypes[0],
  fabric_code: customOptions.fabrics[0].name,
  color_code: Object.keys(colorMap)[0],
  fit: styleOptions.fits[1],
  detail_codes: [],
  calculated_price: 0
};

Page({
  data: {
    options: customOptions,
    fits: styleOptions.fits,
    colorMap,
    selection: defaultSelection,
    price: 0
  },
  async onLoad() {
    await this.refresh();
  },
  async refresh() {
    wx.showLoading({ title: '加载中' });
    try {
      const selection = await getCustomSelection();
      const effective = selection || defaultSelection;
      const price = calculatePriceSync(effective.garment_code, effective.fabric_code, effective.detail_codes);
      this.setData({ selection: effective, price });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  selectGarment(e: WechatMiniprogram.TouchEvent) {
    this.updateSelection('garment_code', e.currentTarget.dataset.value);
  },
  selectFabric(e: WechatMiniprogram.TouchEvent) {
    this.updateSelection('fabric_code', e.currentTarget.dataset.value);
  },
  selectColor(e: WechatMiniprogram.TouchEvent) {
    this.updateSelection('color_code', e.currentTarget.dataset.value);
  },
  selectFit(e: WechatMiniprogram.TouchEvent) {
    this.updateSelection('fit', e.currentTarget.dataset.value);
  },
  toggleDetail(e: WechatMiniprogram.TouchEvent) {
    const name = e.currentTarget.dataset.value;
    const details = this.data.selection.detail_codes;
    const next = details.includes(name)
      ? details.filter((d: string) => d !== name)
      : [...details, name];
    this.updateSelection('detail_codes', next);
  },
  async updateSelection(key: string, value: any) {
    const selection = { ...this.data.selection, [key]: value };
    wx.showLoading({ title: '计算中' });
    try {
      await setCustomSelection(selection);
      const price = calculatePriceSync(selection.garment_code, selection.fabric_code, selection.detail_codes);
      this.setData({ selection, price });
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  goOrder() {
    wx.navigateTo({ url: '/pages/order-confirm/order-confirm' });
  }
});
