import MatchResult from "./matchModel.js";

export const MatchService = {
  /**
   * Tạo một bản ghi kết quả trận đấu mới vào DB
   * @param {Object} matchData - Dữ liệu trận đấu từ Client gửi lên
   */
  createMatchResult: async (matchData) => {
    // Tạo instance mới từ Model
    const newMatch = new MatchResult(matchData);

    // Lưu vào MongoDB
    return await newMatch.save();
  },
};
