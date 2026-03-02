using UnityEngine;
using System.Collections.Generic;
using Game.Domain.Map.DTOs;

public class MapDataManager : MonoBehaviour
{
    public MapConfigDTO CurrentMapConfig { get; private set; }

    // Lưu trữ toàn bộ điểm spawn theo Tên (Ví dụ: "SP_Boss_Center" -> Transform)
    private Dictionary<string, Transform> _spawnPointDict = new Dictionary<string, Transform>();

    // Vẫn giữ dictionary Tag nếu cần dùng cho Item Random
    private Dictionary<string, List<Transform>> _tagGroups = new Dictionary<string, List<Transform>>();

    private readonly string[] _targetTags = {
        "SP_Player", "SP_Item_Fix", "SP_Item_Equip",
        "SP_Item_Rand", "SP_Puzzle", "SP_Boss", "SP_Minion"
    };

    public void InitializeMap(MapConfigDTO config)
    {
        if (config == null)
        {
            Debug.LogError("❌ [MapData] Config truyền vào bị NULL!");
            return;
        }

        CurrentMapConfig = config;
        Debug.Log($"[MapData] Đã nhận Config: {CurrentMapConfig.identityConfig.displayName}");

        _spawnPointDict.Clear();
        _tagGroups.Clear();

        // Quét toàn bộ điểm spawn (Tìm theo Tag để tối ưu hiệu suất, tránh FindObjectOfType toàn Scene)
        foreach (string tag in _targetTags)
        {
            GameObject[] objects = GameObject.FindGameObjectsWithTag(tag);
            List<Transform> transforms = new List<Transform>();

            foreach (var obj in objects)
            {
                transforms.Add(obj.transform);

                // Index luôn vào Dictionary theo tên để truy xuất nhanh bằng ID từ JSON
                if (!_spawnPointDict.ContainsKey(obj.name))
                {
                    _spawnPointDict.Add(obj.name, obj.transform);
                }
            }

            _tagGroups.Add(tag, transforms);
        }

        Debug.Log($"[MapData] Index thành công {_spawnPointDict.Count} điểm spawn (đã gom theo Tên).");
    }

    // Hàm lấy 1 điểm cụ thể bằng ID (VD: "SP_Boss_Center")
    public Transform GetSpawnPointById(string pointId)
    {
        if (_spawnPointDict.TryGetValue(pointId, out Transform point))
            return point;

        Debug.LogWarning($"[MapData] Không tìm thấy điểm spawn nào có tên: '{pointId}' trên Scene!");
        return null;
    }

    // Hàm xin nguyên 1 list (Cho fallback hoặc đồ Random)
    public List<Transform> GetSpawnPointsByTag(string tag)
    {
        if (_tagGroups.TryGetValue(tag, out List<Transform> points))
            return points;
        return new List<Transform>();
    }
}