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
                    if (t != null && t.name.StartsWith(tag))
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
}