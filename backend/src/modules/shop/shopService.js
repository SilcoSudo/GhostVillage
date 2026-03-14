import CosmeticItem from './cosmeticItemModel.js';
import Perk from './perkModel.js';
import ShopPool from './shopPoolModel.js';
import Player from '../player/playerModel.js';

export const ShopService = {
  // Lấy dữ liệu cửa hàng hiện tại
  getShopData: async () => {
    // 1. Luôn lấy toàn bộ danh sách Skins
    const cosmetics = await CosmeticItem.find().lean();

    // 2. Tìm Pool tuần này còn hiệu lực
    let currentPool = await ShopPool.findOne({ expiresAt: { $gt: new Date() } })
      .populate('weeklyPerks')
      .lean();

    // 3. Nếu chưa có hoặc đã hết hạn -> Tạo Pool mới ngẫu nhiên
    if (!currentPool) {
      const commons = await Perk.aggregate([{ $match: { rarity: 'COMMON' } }, { $sample: { size: 3 } }]);
      const rares = await Perk.aggregate([{ $match: { rarity: 'RARE' } }, { $sample: { size: 2 } }]);
      const epics = await Perk.aggregate([{ $match: { rarity: 'EPIC' } }, { $sample: { size: 1 } }]);

      const selectedPerks = [...commons, ...rares, ...epics];
      
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (7 - nextMonday.getDay()) % 7 + 1);
      nextMonday.setHours(0, 0, 0, 0);

      const newPool = await ShopPool.create({
        weeklyPerks: selectedPerks.map(p => p._id),
        expiresAt: nextMonday
      });
      
      currentPool = await ShopPool.findById(newPool._id).populate('weeklyPerks').lean();
    }

    return { 
      cosmetics, 
      perks: currentPool.weeklyPerks, 
      expiresAt: currentPool.expiresAt 
    };
  },

  purchaseItem: async (userId, itemId, itemType) => {
    const player = await Player.findOne({ userId });
    if (!player) throw new Error("Player not found");

    // 1. Tìm item dựa trên prefabId (chuỗi từ Unity) thay vì _id của MongoDB
    const item = (itemType === 'COSMETIC') 
      ? await CosmeticItem.findOne({ prefabId: itemId }) 
      : await Perk.findOne({ prefabId: itemId });

    if (!item) throw new Error("Item not found");

    // 2. Kiểm tra nếu là PERK thì phải nằm trong Pool tuần này
    if (itemType === 'PERK') {
      const currentPool = await ShopPool.findOne({ expiresAt: { $gt: new Date() } }).lean();
      if (!currentPool) throw new Error("Shop is resetting, please try again.");
      
      // So sánh item._id (ObjectId trong DB) với danh sách weeklyPerks
      const isPerkInShop = currentPool.weeklyPerks.some(
        perkId => perkId.toString() === item._id.toString()
      );
      
      if (!isPerkInShop) {
        throw new Error("This Perk is not available in the shop this week.");
      }
    }

    // 3. Kiểm tra tiền xu
    if (player.profile.coin < item.price) {
      throw new Error("Insufficient coins");
    }

    // 4. Kiểm tra xem đã sở hữu chưa (để tránh mua trùng)
    const targetArray = itemType === 'COSMETIC' ? player.unlockedSkins : player.unlockedPerks;
    if (targetArray.includes(item.prefabId)) {
        throw new Error("You already own this item");
    }

    // 5. Trừ tiền và thêm prefabId vào kho (Giống cấu trúc player3 của bạn)
    player.profile.coin -= item.price;
    targetArray.push(item.prefabId);

    await player.save();

    return {
      newBalance: player.profile.coin,
      unlockedItems: targetArray
    };
  }
};