using UnityEngine;
using Photon.Pun;
using Game.Domain.Map.DTOs;
using System.Collections.Generic;
using System.Linq;
using Game.Core.Database;

public class ItemSpawnerManager : MonoBehaviour
{
    public void SpawnItems(MapConfigDTO config, MapDataManager mapData, GameResourceDatabaseSO resourceDB)
    {
        if (!PhotonNetwork.IsMasterClient) return;

        Debug.Log("<color=green>[ItemSpawner]</color> Bắt đầu rải Item & Equipment...");

        // --- 1. SPAWN MANDATORY CONSUMABLES (Dùng Tag SP_Item_Fix) ---
        if (config.consumableConfig?.mandatoryItems != null)
        {
            List<Transform> fixPoints = mapData.GetSpawnPointsByTag("SP_Item_Fix").OrderBy(x => Random.value).ToList();
            int pointIndex = 0;

            foreach (var item in config.consumableConfig.mandatoryItems)
            {
                int count = Random.Range(item.minCount, item.maxCount + 1);
                for (int i = 0; i < count; i++)
                {
                    if (pointIndex >= fixPoints.Count) break;
                    SpawnUnique(item.itemId, fixPoints[pointIndex], resourceDB);
                    pointIndex++;
                }
            }
        }

        // --- 2. SPAWN MANDATORY EQUIPMENT (Dùng Tag SP_Item_Equip) ---
        if (config.equipmentConfig?.mandatoryEquipment != null)
        {
            List<Transform> equipPoints = mapData.GetSpawnPointsByTag("SP_Item_Equip").OrderBy(x => Random.value).ToList();
            int equipPointIndex = 0;

            foreach (var equip in config.equipmentConfig.mandatoryEquipment)
            {
                int count = Random.Range(equip.minCount, equip.maxCount + 1);
                for (int i = 0; i < count; i++)
                {
                    if (equipPointIndex >= equipPoints.Count) break;
                    SpawnUnique(equip.itemId, equipPoints[equipPointIndex], resourceDB);
                    equipPointIndex++;
                }
            }
        }

        // --- 3. SPAWN RANDOM CONSUMABLES (Vào Tag SP_Item_Rand) ---
        SpawnRandomPool(config.consumableConfig?.randomPoolConfig, "SP_Item_Rand", mapData, resourceDB);

        // --- 4. SPAWN RANDOM EQUIPMENT (Vào Tag SP_Item_Equip) ---
        // Có thể dùng chung tag SP_Item_Equip cho đồ rớt random
        SpawnRandomPool(config.equipmentConfig?.randomPoolConfig, "SP_Item_Equip", mapData, resourceDB);
    }

    private void SpawnRandomPool(RandomPoolConfigDTO randomConfig, string tag, MapDataManager mapData, GameResourceDatabaseSO resourceDB)
    {
        if (randomConfig == null || randomConfig.pool.Count == 0) return;

        List<Transform> availablePoints = new List<Transform>(mapData.GetSpawnPointsByTag(tag));
        if (availablePoints.Count == 0) return;

        int poolCount = Random.Range(randomConfig.minCount, randomConfig.maxCount + 1);

        for (int i = 0; i < poolCount; i++)
        {
            if (availablePoints.Count == 0) break;

            string randomItemId = GetWeightedRandomItem(randomConfig.pool);
            int randIndex = Random.Range(0, availablePoints.Count);
            Transform targetPoint = availablePoints[randIndex];

            GameObject prefab = resourceDB.GetPrefabById(randomItemId);
            if (prefab != null)
            {
                PhotonNetwork.InstantiateRoomObject(prefab.name, targetPoint.position, targetPoint.rotation);
                Debug.Log($"---> Đã rải '{randomItemId}' ({prefab.name}) ngẫu nhiên tại '{targetPoint.name}'");
            }
            availablePoints.RemoveAt(randIndex);
        }
    }

    // Đã thay string pointId thành Transform targetPoint
    private void SpawnUnique(string itemId, Transform targetPoint, GameResourceDatabaseSO resourceDB)
    {
        GameObject prefab = resourceDB.GetPrefabById(itemId);

        if (targetPoint != null && prefab != null)
        {
            PhotonNetwork.InstantiateRoomObject(prefab.name, targetPoint.position, targetPoint.rotation);
            Debug.Log($"---> Đã spawn '{itemId}' tại '{targetPoint.name}'");
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