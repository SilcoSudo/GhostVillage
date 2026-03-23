import { ShopService } from './shopService.js';

export const getShop = async (req, res, next) => {
  try {
    const data = await ShopService.getShopData();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

export const buyItem = async (req, res, next) => {
  try {
    const { itemId, itemType } = req.body; // itemType: 'COSMETIC' | 'PERK'
    const result = await ShopService.purchaseItem(req.user.id, itemId, itemType);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};