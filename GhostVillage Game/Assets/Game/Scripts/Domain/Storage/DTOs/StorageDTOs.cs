using System;
using System.Collections.Generic;

namespace GhostVillage.Storage
{
    [Serializable]
    public class ProfileDTO
    {
        public int level;
        public int coin;
    }

    [Serializable]
    public class EquipPerkRequest
    {
        public List<string> perks;
    }

    [Serializable]
    public class EquipPerkResponse
    {
        public bool success;
        public List<string> data;
    }
}