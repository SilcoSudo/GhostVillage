using System;
using System.Collections.Generic;

namespace Game.Domain.Match.DTO
{
    [Serializable]
    public class SaveMatchRequestDTO
    {
        public string mapId;
        public string sessionId;
        public string startTime;
        public string endTime;
        public int durationSec;
        public List<PlayerResultRequestDTO> playerResults;
    }

    [Serializable]
    public class PlayerResultRequestDTO
    {
        public string userId;
        public string nickname;
        public bool isWin;
        public string outcome;
        public MatchRewardDTO rewards;
        public List<string> titles;
    }

    [Serializable]
    public class MatchRewardDTO
    {
        public int exp;
        public int coin;
    }

    // [FIX] Sửa class này để hứng data thật (Cục Match đã lưu trong DB)
    [Serializable]
    public class SaveMatchResponseDTO
    {
        public string _id;      // MongoDB ID vừa tạo
        public string mapId;    // Các thông tin khác nếu cần
        public string createdAt;
    }
}