using System;
using System.Collections.Generic;
using GhostVillage.Shop;

namespace GhostVillage.Domain.Profile {
    [Serializable]
    public class FullProfileDTO {
        public PlayerProfile profile;
        public List<string> selectedMedals;
        public List<AchievementItemDTO> achievements;
        public List<MatchHistoryItemDTO> history;
        public StorageDTO storage;
        public EquippedDTO equipped;
    }

    [Serializable]
    public class PlayerProfile {
        public string displayName;
        public int level;
        public int exp = 0;           // Gán mặc định là 0 nếu JSON thiếu
        public int nextLevelExp = 100; // Tránh Slider bị chia cho 0
        public int coin;
        public string avatar;
        public string userId = "N/A"; // Gán mặc định nếu không có UID
        public int totalMatches;
    }

    [Serializable]
    public class AchievementItemDTO {
        public string id;
        public string title;
        public string desc;
        public int current;
        public int target;
        public bool isClaimed;
        public bool isEquipped;
        public RewardDTO reward;
    }

    [Serializable]
    public class RewardDTO { 
        public int coin; 
        public int exp;
        public string titleId; 
    }

    [Serializable]
    public class ClaimResultDTO {
        public string message; // Hứng message "Reward claimed!" từ server
    }

    [Serializable]
    public class MatchHistoryItemDTO {
        public bool isWin;
        public int expGained;
        public int coinGained;
        public int durationSec;
        public List<string> rankTitles;
        public string resultStatus;
        public MatchDetail matchId; 
    }

    [Serializable]
    public class MatchDetail { 
        public string mapId; 
        public string mapName;
        public string startTime; 
    }

    [Serializable]
    public class StorageDTO 
    {
        public List<string> unlockedSkins;
        public List<string> unlockedPerks;
    }

    [Serializable]
    public class EquippedDTO 
    {
        public EquipDataDTO skins; 
        public List<string> perks;
    }
}