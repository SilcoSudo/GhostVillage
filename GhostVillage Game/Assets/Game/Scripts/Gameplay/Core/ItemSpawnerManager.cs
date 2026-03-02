using UnityEngine;
using Photon.Pun;
using Game.Domain.Map.DTOs;
using System.Collections.Generic;
using System.Linq;
using Game.Core.Database; // Thêm namespace này

public class ItemSpawnerManager : MonoBehaviour
{
    public void SpawnItems(MapConfigDTO config, MapDataManager mapData, GameResourceDatabaseSO resourceDB)
    {
        if (!PhotonNetwork.IsMasterClient) return;

        Debug.Log("<color=green>[ItemSpawner]</color> Bắt đầu rải Item & Equipment...");

        // --- 1. SPAWN MANDATORY CONSUMABLES ---
        if (config.consumableConfig?.mandatoryItems != null)
        {
            List<string> shuffledPoints = config.consumableConfig.spawnPointIds.OrderBy(x => Random.value).ToList();
            int pointIndex = 0;

            foreach (var item in config.consumableConfig.mandatoryItems)
            {
                int count = Random.Range(item.minCount, item.maxCount + 1);
                for (int i = 0; i < count; i++)
                {
                    if (pointIndex >= shuffledPoints.Count) break;
                    SpawnUnique(item.itemId, shuffledPoints[pointIndex], mapData, resourceDB);
                    pointIndex++;
                }
            }
        }

        // --- 2. SPAWN MANDATORY EQUIPMENT ---
        if (config.equipmentConfig?.mandatoryEquipment != null)
        {
            List<string> shuffledEquipPoints = config.equipmentConfig.spawnPointIds.OrderBy(x => Random.value).ToList();
            int equipPointIndex = 0;

            foreach (var equip in config.equipmentConfig.mandatoryEquipment)
            {
                int count = Random.Range(equip.minCount, equip.maxCount + 1);
                for (int i = 0; i < count; i++)
                {
                    if (equipPointIndex >= shuffledEquipPoints.Count) break;
                    SpawnUnique(equip.itemId, shuffledEquipPoints[equipPointIndex], mapData, resourceDB);
                    equipPointIndex++;
                }
            }
        }

        // --- 3. SPAWN RANDOM CONSUMABLES (Vào Tag SP_Item_Rand) ---
        SpawnRandomPool(config.consumableConfig?.randomPoolConfig, "SP_Item_Rand", mapData, resourceDB);

        // --- 4. SPAWN RANDOM EQUIPMENT (Vào Tag SP_Item_Equip) ---
        SpawnRandomPool(config.equipmentConfig?.randomPoolConfig, "SP_Item_Equip", mapData, resourceDB);
    }

    private void SpawnRandomPool(RandomPoolConfigDTO randomConfig, string tag, MapDataManager mapData, GameResourceDatabaseSO resourceDB)
    {
        if (randomConfig == null || randomConfig.pool.Count == 0) return;

        List<Transform> availablePoints = new List<Transform>(mapData.GetSpawnPointsByTag(tag));
        int poolCount = Random.Range(randomConfig.minCount, randomConfig.maxCount + 1);

        for (int i = 0; i < poolCount; i++)
        {
            if (availablePoints.Count == 0) break;

            string randomItemId = GetWeightedRandomItem(randomConfig.pool);
            int randIndex = Random.Range(0, availablePoints.Count);
            Transform targetPoint = availablePoints[randIndex];

            // Tìm Prefab trong Database
            GameObject prefab = resourceDB.GetPrefabById(randomItemId);
            if (prefab != null)
            {
                // Instantiate qua Photon bằng TÊN CỦA PREFAB (đã nằm trong thư mục Resources)
                PhotonNetwork.InstantiateRoomObject(prefab.name, targetPoint.position, targetPoint.rotation);
                Debug.Log($"---> Đã rải '{randomItemId}' ({prefab.name}) ngẫu nhiên tại '{targetPoint.name}'");
            }
            availablePoints.RemoveAt(randIndex);
        }
    }

    private void SpawnUnique(string itemId, string pointId, MapDataManager mapData, GameResourceDatabaseSO resourceDB)
    {
        Transform targetPoint = mapData.GetSpawnPointById(pointId);
        GameObject prefab = resourceDB.GetPrefabById(itemId);

        if (targetPoint != null && prefab != null)
        {
            PhotonNetwork.InstantiateRoomObject(prefab.name, targetPoint.position, targetPoint.rotation);
            Debug.Log($"---> Đã spawn '{itemId}' tại '{pointId}'");
        }
    }

    private string GetWeightedRandomItem(List<ItemWeightDTO> pool)
    {
        if (pool == null || pool.Count == 0) return "";
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