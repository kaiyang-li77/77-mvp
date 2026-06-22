import { getCustomSelection, setCustomSelection } from "../../data/app-state";
import { customOptions, colorMap, styleOptions } from "../../data/mock-data";
import { calculatePrice } from "../../utils/price";

Page({
  data: {
    options: customOptions,
    fits: styleOptions.fits,
    colorMap,
    selection: getCustomSelection(),
    price: 0
  },
  onLoad() {
    this.refresh();
  },
  refresh() {
    const selection = getCustomSelection();
    const price = calculatePrice(selection.garment, selection.fabric, selection.details);
    this.setData({ selection, price });
  },
  selectGarment(e: WechatMiniprogram.TouchEvent) {
    this.updateSelection("garment", e.currentTarget.dataset.value);
  },
  selectFabric(e: WechatMiniprogram.TouchEvent) {
    this.updateSelection("fabric", e.currentTarget.dataset.value);
  },
  selectColor(e: WechatMiniprogram.TouchEvent) {
    this.updateSelection("color", e.currentTarget.dataset.value);
  },
  selectFit(e: WechatMiniprogram.TouchEvent) {
    this.updateSelection("fit", e.currentTarget.dataset.value);
  },
  toggleDetail(e: WechatMiniprogram.TouchEvent) {
    const name = e.currentTarget.dataset.value;
    const details = this.data.selection.details;
    const next = details.includes(name)
      ? details.filter((d: string) => d !== name)
      : [...details, name];
    this.updateSelection("details", next);
  },
  updateSelection(key: string, value: any) {
    const selection = { ...this.data.selection, [key]: value };
    setCustomSelection(selection);
    this.refresh();
  },
  goOrder() {
    wx.navigateTo({ url: "/pages/order-confirm/order-confirm" });
  }
});
