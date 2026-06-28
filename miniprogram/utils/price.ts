import { customOptions, garmentBasePrice } from "../data/mock-data";

export function calculatePriceSync(
  garment: string,
  fabric: string,
  details: string[]
): number {
  const base = garmentBasePrice[garment] || 0;
  const fabricItem = customOptions.fabrics.find(f => f.code === fabric || f.name === fabric);
  const fabricPrice = (fabricItem && fabricItem.price) || 0;
  const detailsPrice = details.reduce((sum, name) => {
    const item = customOptions.details.find(d => d.code === name || d.name === name);
    return sum + ((item && item.price) || 0);
  }, 0);
  return base + fabricPrice + detailsPrice;
}

export async function calculatePrice(
  garment: string,
  fabric: string,
  details: string[]
): Promise<number> {
  return calculatePriceSync(garment, fabric, details);
}
