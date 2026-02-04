using UnityEngine;
using Photon.Pun;
using Game.Domain.Map.DTOs;
using System.Collections.Generic;

public class ItemSpawnerManager : MonoBehaviour
{
    public void SpawnItems(ConsumableConfigDTO config, MapDataManager mapData)
    {
        if (!PhotonNetwork.IsMasterClient) return;

        Debug.Log("[ItemSpawner] Bắt đầu rải đồ theo Tag...");

        // 1. Spawn Mandatory Items - Dùng Tag SP_Item_Fix
        foreach (var item in config.mandatoryItems)
        {
            int count = Random.Range(item.minCount, item.maxCount + 1);
            for (int i = 0; i < count; i++)
            {
                SpawnNetworkObjectWithTag(item.itemId, "SP_Item_Fix", mapData);
            }
        }

        // 2. Spawn Random Pool - Dùng Tag SP_Item_Rand
        int poolCount = Random.Range(config.randomPoolConfig.minCount, config.randomPoolConfig.maxCount + 1);
        for (int i = 0; i < poolCount; i++)
        {
            string randomItemId = GetWeightedRandomItem(config.randomPoolConfig.pool);
            SpawnNetworkObjectWithTag(randomItemId, "SP_Item_Rand", mapData);
        }
    }

    private void SpawnNetworkObjectWithTag(string prefabName, string tag, MapDataManager mapData)
    {
        List<Transform> points = mapData.GetSpawnPoints(tag);

        if (points.Count > 0)
        {
            // Lấy ngẫu nhiên 1 điểm trong nhóm Tag
            Transform tf = points[Random.Range(0, points.Count)];
            PhotonNetwork.InstantiateRoomObject(prefabName, tf.position, tf.rotation);
        }
        else
        {
            Debug.LogWarning($"[ItemSpawner] Thiếu điểm Spawn cho Tag: {tag}");
        }
    }

    private string GetWeightedRandomItem(List<ItemWeightDTO> pool)
    {
        int totalWeight = 0;
        foreach (var i in pool) totalWeight += i.weight;
        int randomValue = Random.Range(0, totalWeight);
        foreach (var i in pool)
        {
            if (randomValue < i.weight) return i.itemId;
            randomValue -= i.weight;
        }
        return pool[0].itemId;
    }
}