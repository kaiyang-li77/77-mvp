function calculatePrice(garmentCode, fabricCode, detailCodes, config) {
  const garment = (config.garments || []).find(g => g.code === garmentCode);
  const fabric = (config.fabrics || []).find(f => f.code === fabricCode);

  const base = garment ? garment.base_price : 0;
  const fabricPrice = fabric ? fabric.extra_price : 0;
  const detailsPrice = (detailCodes || []).reduce((sum, code) => {
    const item = (config.details || []).find(d => d.code === code);
    return sum + (item ? item.extra_price : 0);
  }, 0);

  return base + fabricPrice + detailsPrice;
}

module.exports = { calculatePrice };
