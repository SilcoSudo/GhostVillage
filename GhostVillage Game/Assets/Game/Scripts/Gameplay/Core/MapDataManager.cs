using UnityEngine;
using System.Collections.Generic;
using Game.Domain.Map.DTOs;

public class MapDataManager : MonoBehaviour
{
    // BỌC LUÔN CỤC MEGA DTO
    public AggregatedGameDataDTO CurrentGameData { get; private set; }

    // Các Helper Properties cho code cũ khỏi lỗi
    public MapConfigDTO CurrentMapConfig => CurrentGameData?.mapConfig;
    public GameStatsDTO CurrentStats => CurrentGameData?.stats;

    // Chỉ giữ lại Dictionary gom theo Tag
    private Dictionary<string, List<Transform>> _tagGroups = new Dictionary<string, List<Transform>>();

    private readonly string[] _targetTags = {
        "SP_Player", "SP_Item_Fix", "SP_Item_Equip",
        "SP_Item_Rand", "SP_Puzzle", "SP_Boss", "SP_Minion"
    };

    public void InitializeMap(AggregatedGameDataDTO gameData)
    {
        if (gameData == null || gameData.mapConfig == null)
        {
            Debug.LogError(" [MapData] AggregatedGameData truyền vào bị NULL!");
            return;
        }

        CurrentGameData = gameData;
        Debug.Log($"[MapData] Đã nhận Full Game Data: {CurrentMapConfig.identityConfig.displayName}");

        _tagGroups.Clear();

        // CHỈ QUÉT THEO TAG
        foreach (string tag in _targetTags)
        {
            GameObject[] objects = GameObject.FindGameObjectsWithTag(tag);
            List<Transform> transforms = new List<Transform>();

            foreach (var obj in objects)
            {
                transforms.Add(obj.transform);
            }

            // Fallback: một số scene chưa gán Tag đúng nhưng vẫn đặt tên object theo quy ước.
            if (transforms.Count == 0)
            {
                Transform[] allTransforms = FindObjectsByType<Transform>(FindObjectsSortMode.None);
                foreach (var t in allTransforms)
                {
                    if (t == null) continue;

                    bool matchByPrefix = t.name.StartsWith(tag);
                    bool matchPuzzleAlias = false;

                    if (tag == "SP_Puzzle")
                    {
                        matchPuzzleAlias = t.name.Contains("PuzzleSpawn") || t.name.Contains("SP_Puzzle");

                        if (!matchPuzzleAlias && t.parent != null)
                        {
                            string parentName = t.parent.name;
                            matchPuzzleAlias = parentName.Contains("PuzzleSpawn") || parentName.Contains("SP_Puzzle");
                        }
                    }

                    if (matchByPrefix || matchPuzzleAlias)
                    {
                        transforms.Add(t);
                    }
                }
            }

            _tagGroups.Add(tag, transforms);
            Debug.Log($"[MapData] Index thành công {transforms.Count} điểm spawn cho Tag: {tag}");
        }
    }

    // XÓA HÀM GetSpawnPointById (vì DB không còn gửi tên point xuống nữa)

    // GIỮ LẠI HÀM XIN NGUYÊN LIST THEO TAG
    public List<Transform> GetSpawnPointsByTag(string tag)
    {
        if (_tagGroups.TryGetValue(tag, out List<Transform> points))
            return points;
        return new List<Transform>();
    }

    // THÊM HÀM NÀY VÀO TRONG MAPDATAMANAGER.CS
    public void OverrideItemStatsFromNetwork(List<ItemStatDTO> networkItems, Game.Core.Database.GameResourceDatabaseSO resourceDB)
    {
        if (networkItems == null || resourceDB == null) return;

        int count = 0;
        foreach (var netItem in networkItems)
        {
            // Xin Prefab từ Kho bằng itemId
            GameObject prefab = resourceDB.GetPrefabById(netItem.itemId);

            if (prefab != null && netItem.stats != null)
            {
                // Moi Script ItemPickup trên Prefab ra để lấy ScriptableObject
                var pickupScript = prefab.GetComponent<Game.Core.Interaction.ItemPickup>();
                if (pickupScript != null && pickupScript.data != null)
                {
                    var so = pickupScript.data;

                    // 1. NẾU LÀ ĐÈN PIN
                    if (so is FlashlightItemSO flashlightSO)
                    {
                        if (netItem.stats.maxBattery > 0) flashlightSO.maxBattery = netItem.stats.maxBattery;
                        if (netItem.stats.drainRate > 0) flashlightSO.drainRate = netItem.stats.drainRate;
                        count++;
                    }
                    // 2. NẾU LÀ PIN SẠC
                    else if (so is BatteryItemSO batterySO)
                    {
                        if (netItem.stats.rechargeAmount > 0) batterySO.rechargeAmount = netItem.stats.rechargeAmount;
                        count++;
                    }
                    // 3. NẾU LÀ MEDKIT
                    else if (so is MedkitItemSO medkitSO)
                    {
                        if (netItem.stats.healAmount > 0) medkitSO.healAmount = netItem.stats.healAmount;
                        count++;
                    }
                    // 4. NẾU LÀ CÒI
                    // else if (so is WhistleItemSO whistleSO)
                    // {
                    //     // if (netItem.stats.alertRadius > 0) whistleSO.alertRadius = netItem.stats.alertRadius;
                    //     // count++;
                    // }
                }
            }
        }

        Debug.Log($"<color=green>[MapData]</color> Đã nạp thành công chỉ số cho {count} SO Items từ Server!");
    }
}