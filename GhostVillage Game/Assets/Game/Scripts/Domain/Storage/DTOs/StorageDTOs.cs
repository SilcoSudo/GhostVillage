using System;
using System.Collections.Generic;

namespace GhostVillage.Storage
{
    [Serializable]
    public class FullProfileDTO
    {
        public ProfileDTO profile;
        public StorageDTO storage;
        public EquippedDTO equipped;
    }

    [Serializable]
    public class ProfileDTO
    {
        public int level;
        public int coin;
    }

    [Serializable]
    public class StorageDTO
    {
        public List<string> unlockedPerks;
    }

    [Serializable]
    public class EquippedDTO
    {
        public List<string> perks; // Danh sách prefabId của Perk đang dùng
    }

    [Serializable]
    public class EquipPerkRequest
    {
        public List<string> perks;
    }
}