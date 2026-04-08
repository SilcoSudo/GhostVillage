using System;
using System.Collections.Generic;

namespace GhostVillage.Domain.Profile
{
    [Serializable]
    public class FullProfileDTO
    {
        // [FIX CHÍ MẠNG 1]: Thêm dòng này để hứng cái mã 8 số từ Backend!
        public string uid;

        public PlayerProfile profile;
        public List<string> selectedMedals;

        public List<QuestItemDTO> achievements;
        public List<QuestItemDTO> dailyQuests;

        public List<MatchHistoryItemDTO> history;
        public StorageDTO storage;
        public EquippedDTO equipped;
    }

    [Serializable]
    public class PlayerProfile
    {
        public string displayName;
        public int level;
        public int exp = 0;
        public int nextLevelExp = 100;
        public int coin;
        public string avatar;
        public string userId = "N/A";
        public int totalMatches;
    }

    // [ĐỔI TÊN] Thành QuestItemDTO để xài chung cho Daily và Achievement
    [Serializable]
    public class QuestItemDTO
    {
        public string id;       // Khớp với questId
        public string title;    // Khớp với questName
        public string desc;     // Khớp với description
        public int current;
        public int target;      // Khớp với targetCount
        public bool isClaimed;
        public bool isEquipped;
        public RewardDTO reward;
    }

    [Serializable]
    public class RewardDTO
    {
        public int coin;
        public int exp;
        public string titleId;
    }

    [Serializable]
    public class ClaimResultDTO
    {
        public string message;
    }

    [Serializable]
    public class MatchHistoryItemDTO
    {
        public bool isWin;
        public int expGained;
        public int coinGained;
        public int durationSec;
        public List<string> rankTitles;
        public string resultStatus;
        public MatchDetail matchId;
    }

    [Serializable]
    public class MatchDetail
    {
        public string mapId;
        public string mapName;
        public string startTime;
        public string moonEventId;
        public string moonEventName;
    }

    [Serializable]
    public class StorageDTO
    {
        public List<string> unlockedPerks;
    }

    [Serializable]
    public class EquippedDTO
    {
        public List<string> perks;
    }
}