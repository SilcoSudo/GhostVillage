using UnityEngine;
using Photon.Pun;
using Game.Domain.Map.DTOs;
using System.Collections.Generic;

public class ItemSpawnerManager : MonoBehaviour
{
    public void SpawnItems(ConsumableConfigDTO config, MapDataManager mapData)
    {
        if (!PhotonNetwork.IsMasterClient) return;

        Debug.Log("<color=green>[ItemSpawner]</color> Bắt đầu rải Item (Logic không trùng lặp)...");

        // --- 1. CHUẨN BỊ POOL VỊ TRÍ (Tạo bản sao để xóa dần) ---
        // Lấy toàn bộ điểm Fixed và Random vào list tạm thời để quản lý việc "đã dùng rồi"
        List<Transform> availableFixPoints = new List<Transform>(mapData.GetSpawnPoints("SP_Item_Fix"));
        List<Transform> availableRandPoints = new List<Transform>(mapData.GetSpawnPoints("SP_Item_Rand"));

        // --- 2. SPAWN MANDATORY ITEMS (Vào Fix Points) ---
        foreach (var item in config.mandatoryItems)
        {
            int count = Random.Range(item.minCount, item.maxCount + 1);
            Debug.Log($"[Spawner] Cần spawn cố định {count} cái {item.itemId}");

            for (int i = 0; i < count; i++)
            {
                // Gọi hàm Spawn thông minh: Tự chọn và XÓA vị trí khỏi list
                SpawnUnique(item.itemId, availableFixPoints, "SP_Item_Fix");
            }
        }

        // --- 3. SPAWN RANDOM POOL (Vào Random Points) ---
        int poolCount = Random.Range(config.randomPoolConfig.minCount, config.randomPoolConfig.maxCount + 1);
        Debug.Log($"[Spawner] Cần spawn ngẫu nhiên {poolCount} món từ Pool");

        for (int i = 0; i < poolCount; i++)
        {
            string randomItemId = GetWeightedRandomItem(config.randomPoolConfig.pool);

            // Gọi hàm Spawn thông minh: Tự chọn và XÓA vị trí khỏi list
            SpawnUnique(randomItemId, availableRandPoints, "SP_Item_Rand");
        }
    }

    /// <summary>
    /// Hàm Spawn đảm bảo tính duy nhất.
    /// Nó sẽ chọn ngẫu nhiên 1 điểm trong list, spawn đồ, rồi XÓA điểm đó khỏi list.
    /// </summary>
    private void SpawnUnique(string prefabName, List<Transform> availablePoints, string tagName)
    {
        // 1. Kiểm tra xem còn chỗ không
        if (availablePoints == null || availablePoints.Count == 0)
        {
            Debug.LogWarning($"⚠️ [ItemSpawner] Hết chỗ spawn cho tag '{tagName}'! Không thể đẻ thêm '{prefabName}'.");
            return;
        }

        // 2. Chọn ngẫu nhiên index
        int randomIndex = Random.Range(0, availablePoints.Count);
        Transform targetPoint = availablePoints[randomIndex];

        // 3. Spawn đồ
        PhotonNetwork.InstantiateRoomObject(prefabName, targetPoint.position, targetPoint.rotation);
        Debug.Log($"---> Đã spawn '{prefabName}' tại '{targetPoint.name}' (Tag: {tagName})");

        // 4. [QUAN TRỌNG NHẤT] Xóa điểm này khỏi danh sách để không dùng lại
        availablePoints.RemoveAt(randomIndex);
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