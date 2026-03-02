using UnityEngine;
using Photon.Pun;
using Game.Domain.Map.DTOs;
using System.Collections.Generic;

public class MonsterSpawnerManager : MonoBehaviour
{
    public void SpawnMonsters(MonsterSystemConfigDTO config, MapDataManager mapData)
    {
        if (!PhotonNetwork.IsMasterClient) return;

        Debug.Log("[MonsterSpawner] Thả quái...");

        // 1. Spawn BOSS - Dùng Tag SP_Boss
        string bossID = config.bossConfig.monsterId;
        SpawnMonsterAtTag(bossID, "SP_Boss", mapData);

        // 2. Spawn Minions - Dùng Tag SP_Minion
        foreach (var minionId in config.minionConfig.allowedMonsterIds)
        {
            // Ví dụ mỗi loại quái nhỏ spawn 2 con
            for (int i = 0; i < 2; i++)
            {
                SpawnMonsterAtTag(minionId, "SP_Minion", mapData);
            }
        }
    }

    private void SpawnMonsterAtTag(string monsterId, string tag, MapDataManager mapData)
    {
        List<Transform> points = mapData.GetSpawnPoints(tag);

        if (points.Count > 0)
        {
            // Chọn ngẫu nhiên 1 Transform trong danh sách Tag
            Transform target = points[Random.Range(0, points.Count)];
            PhotonNetwork.InstantiateRoomObject(monsterId, target.position, target.rotation);
        }
        else
        {
            Debug.LogWarning($"[MonsterSpawner] Không tìm thấy điểm nào có Tag: {tag}");
        }
    }
}