import { call } from '../utils/cloud-api';

export interface BodyProfile {
  height: number;
  weight: number;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  sleeve: number;
  pants_length: number;
  body_type: string;
}

export interface StylePreference {
  preferred_styles: string[];
  preferred_colors: string[];
  fit: string;
  preferred_scenes: string[];
}

export interface CustomSelection {
  garment_code: string;
  fabric_code: string;
  color_code: string;
  fit: string;
  detail_codes: string[];
  calculated_price: number;
}

export async function getBodyProfile(): Promise<BodyProfile | null> {
  return call('GET', '/body-profile');
}

export async function setBodyProfile(profile: BodyProfile): Promise<BodyProfile> {
  return call('PUT', '/body-profile', profile);
}

export async function getStylePreference(): Promise<StylePreference | null> {
  return call('GET', '/style-preference');
}

export async function setStylePreference(pref: StylePreference): Promise<StylePreference> {
  return call('PUT', '/style-preference', pref);
}

export async function getCustomSelection(): Promise<CustomSelection | null> {
  return call('GET', '/custom-selection');
}

export async function setCustomSelection(sel: CustomSelection): Promise<CustomSelection> {
  return call('PUT', '/custom-selection', sel);
}

export async function getConfig(): Promise<any> {
  return call('GET', '/config');
}

export async function getRecommendations(): Promise<any[]> {
  return call('GET', '/recommendations');
}

export async function calculatePrice(garment: string, fabric: string, details: string[]): Promise<number> {
  const res = await call<{ price: number }>('POST', '/custom-selection/price', {
    garment_code: garment,
    fabric_code: fabric,
    detail_codes: details
  });
  return res.price;
}

export async function createOrder(selection: CustomSelection & { remark?: string }): Promise<any> {
  return call('POST', '/orders', selection);
}

export async function bookAdvisor(orderId?: number): Promise<any> {
  return call('POST', '/advisor-bookings', { order_id: orderId });
}
