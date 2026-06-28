import { getCustomSelection, setCustomSelection, CustomSelection } from '../../data/app-state';
import { customOptions, colorMap, styleOptions } from '../../data/mock-data';
import { calculatePriceSync } from '../../utils/price';

const defaultSelection: CustomSelection = {
  garment_code: customOptions.garmentTypes[0].code,
  fabric_code: customOptions.fabrics[0].code,
  color_code: customOptions.colors[0].code,
  fit: styleOptions.fits[1],
  detail_codes: [],
  calculated_price: 0
};

function toList(value: unknown): string[] {
  return Array.isArray(value) ? value : [];
}

function toSelectedMap(values: string[]) {
  return values.reduce((map: Record<string, boolean>, item) => {
    map[item] = true;
    return map;
  }, {});
}

function findName(list: Array<{ code: string; name: string }>, code: string) {
  return (list.find(item => item.code === code) || list[0]).name;
}

function findCode(list: Array<{ code: string; name: string }>, value: string) {
  const item = list.find(option => option.code === value || option.name === value);
  return (item || list[0]).code;
}

function normalizeSelection(selection: CustomSelection) {
  const detailCodes = toList(selection.detail_codes).reduce((codes: string[], code) => {
    const item = customOptions.details.find(option => option.code === code || option.name === code);
    if (item) codes.push(item.code);
    return codes;
  }, []);

  return {
    ...defaultSelection,
    ...selection,
    garment_code: findCode(customOptions.garmentTypes, selection.garment_code),
    fabric_code: findCode(customOptions.fabrics, selection.fabric_code),
    color_code: findCode(customOptions.colors, selection.color_code),
    detail_codes: detailCodes
  };
}

Page({
  data: {
    options: customOptions,
    fits: styleOptions.fits,
    colorMap,
    selection: defaultSelection,
    price: 0,
    selectedDetails: {} as Record<string, boolean>,
    garmentName: customOptions.garmentTypes[0].name,
    fabricName: customOptions.fabrics[0].name,
    colorName: customOptions.colors[0].name,
    colorHex: customOptions.colors[0].hex,
    detailCount: 0
  },
  async onLoad() {
    await this.refresh();
  },
  async refresh() {
    wx.showLoading({ title: '加载中' });
    try {
      const selection = await getCustomSelection();
      this.applySelection(selection || defaultSelection);
    } catch (e) {
      wx.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  applySelection(selection: CustomSelection) {
    const normalized = normalizeSelection(selection);
    const price = calculatePriceSync(
      normalized.garment_code,
      normalized.fabric_code,
      normalized.detail_codes
    );
    const color = customOptions.colors.find(item => item.code === normalized.color_code) || customOptions.colors[0];
    this.setData({
      selection: { ...normalized, calculated_price: price },
      price,
      selectedDetails: toSelectedMap(normalized.detail_codes),
      garmentName: findName(customOptions.garmentTypes, normalized.garment_code),
      fabricName: findName(customOptions.fabrics, normalized.fabric_code),
      colorName: color.name,
      colorHex: color.hex,
      detailCount: normalized.detail_codes.length
    });
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
      const price = calculatePriceSync(selection.garment_code, selection.fabric_code, selection.detail_codes);
      const saved = await setCustomSelection({ ...selection, calculated_price: price });
      this.applySelection(saved);
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
