import {
  defaultBodyProfile,
  defaultStylePreference,
  recommendations,
  customOptions
} from "./mock-data";
import { calculatePrice } from "../utils/price";

const KEYS = {
  bodyProfile: "bodyProfile",
  stylePreference: "stylePreference",
  selectedRecommendation: "selectedRecommendation",
  customSelection: "customSelection"
};

export function getBodyProfile() {
  return wx.getStorageSync(KEYS.bodyProfile) || defaultBodyProfile;
}

export function setBodyProfile(profile: typeof defaultBodyProfile) {
  wx.setStorageSync(KEYS.bodyProfile, profile);
}

export function getStylePreference() {
  return wx.getStorageSync(KEYS.stylePreference) || defaultStylePreference;
}

export function setStylePreference(pref: typeof defaultStylePreference) {
  wx.setStorageSync(KEYS.stylePreference, pref);
}

export function getSelectedRecommendation() {
  return wx.getStorageSync(KEYS.selectedRecommendation) || recommendations[0];
}

export function setSelectedRecommendation(rec: typeof recommendations[0]) {
  wx.setStorageSync(KEYS.selectedRecommendation, rec);
}

export function getCustomSelection() {
  const saved = wx.getStorageSync(KEYS.customSelection);
  if (saved) return saved;
  return {
    garment: "大衣",
    fabric: customOptions.fabrics[0].name,
    color: "深石墨黑",
    fit: "合体",
    details: ["暖金纽扣", "半里布"]
  };
}

export function setCustomSelection(sel: ReturnType<typeof getCustomSelection>) {
  wx.setStorageSync(KEYS.customSelection, sel);
}

export function getOrderSummary() {
  const selection = getCustomSelection();
  const profile = getBodyProfile();
  const price = calculatePrice(selection.garment, selection.fabric, selection.details);
  return {
    ...selection,
    profile,
    price,
    deposit: Math.round(price * 0.31)
  };
}
