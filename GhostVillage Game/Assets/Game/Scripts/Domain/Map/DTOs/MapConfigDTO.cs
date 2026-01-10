using System;
using System.Collections.Generic;

[Serializable]
public class MapConfigDTO
{
    public string _id;
    public string name;
    public float baseDifficulty;
    public MonsterSettingDTO monsterSettings;
    public List<RewardDTO> rewards;
}

[Serializable]
public class MonsterSettingDTO
{
    public float respawnRate;
    public int maxMonsters;
    public List<string> enemyTypes;
}

[Serializable]
public class RewardDTO
{
    public string itemId;
    public float dropRate;
}