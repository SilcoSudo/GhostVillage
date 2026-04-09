import Perk from '../perk/perkModel.js';
import ShopPool from './shopPoolModel.js';
import Player from '../player/playerModel.js';

export const ShopService = {
  // Lấy danh sách Perk tuần này
  getShopData: async () => {
    // 1. Tìm Pool hiện tại còn hiệu lực
    let currentPool = await ShopPool.findOne({ expiresAt: { $gt: new Date() } })
      .populate('weeklyPerks')
      .lean();

    // 2. Nếu không có Pool hoặc Pool cũ đã hết hạn -> Tạo mới ngẫu nhiên
    if (!currentPool) {
      console.log("♻️ Pool hết hạn, đang tạo danh sách Perk mới...");
      
      // Bốc ngẫu nhiên đúng số lượng: 3 Common, 2 Rare, 1 Epic
      const commons = await Perk.aggregate([{ $match: { rarity: 'COMMON', isActive: true } }, { $sample: { size: 3 } }]);
      const rares = await Perk.aggregate([{ $match: { rarity: 'RARE', isActive: true } }, { $sample: { size: 2 } }]);
      const epics = await Perk.aggregate([{ $match: { rarity: 'EPIC', isActive: true } }, { $sample: { size: 1 } }]);

      const selectedPerks = [...commons, ...rares, ...epics];

      // Tính toán thời gian hết hạn (Thứ 2 tuần kế tiếp lúc 00:00)
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
      perks: currentPool.weeklyPerks, 
      expiresAt: currentPool.expiresAt 
    };
  },

  // Xử lý mua Perk
  purchaseItem: async (userId, prefabId) => {
    const player = await Player.findOne({ userId });
    if (!player) throw new Error("Player not found");

    // 1. Tìm Perk trong Database theo prefabId (từ Unity gửi lên)
    const perk = await Perk.findOne({ prefabId, isActive: true });
    if (!perk) throw new Error("Perk not found in database");

    // 2. Kiểm tra Perk này có nằm trong danh sách đang bán tuần này không
    const currentPool = await ShopPool.findOne({ expiresAt: { $gt: new Date() } }).lean();
    if (!currentPool) throw new Error("Shop is refreshing, please try again.");
    
    const isPerkInShop = currentPool.weeklyPerks.some(
      id => id.toString() === perk._id.toString()
    );
    
    if (!isPerkInShop) throw new Error("This Perk is not in today's rotation.");

    // 3. Kiểm tra ví tiền
    if (player.profile.coin < perk.price) {
      throw new Error("You don't have enough Gold.");
    }

    // 4. Kiểm tra sở hữu (Tránh mua trùng)
    // Lưu ý: unlockedPerks lưu mảng prefabId như player3 của bạn
    if (player.unlockedPerks.includes(prefabId)) {
        throw new Error("You already own this Perk.");
    }

    // 5. Trừ tiền và thêm vào kho
    player.profile.coin -= perk.price;
    player.unlockedPerks.push(prefabId);

    await player.save();

    return {
      newBalance: player.profile.coin,
      unlockedItems: player.unlockedPerks
    };
  }
};