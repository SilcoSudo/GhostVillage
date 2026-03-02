using UnityEngine;
using System.Collections.Generic;
using Game.Domain.Map.DTOs;

public class MapDataManager : MonoBehaviour
{
    public MapConfigDTO CurrentMapConfig { get; private set; }
    private Dictionary<string, List<Transform>> _tagGroups = new Dictionary<string, List<Transform>>();

    private readonly string[] _targetTags = {
        "SP_Player", "SP_Item_Fix", "SP_Item_Equip",
        "SP_Item_Rand", "SP_Puzzle", "SP_Boss", "SP_Minion"
    };


    public void InitializeMap(MapConfigDTO config)
    {

        if (config == null)
        {
            Debug.LogError("❌ [MapData] Config truyền vào bị NULL! Không thể khởi tạo map.");
            return;
        }

        CurrentMapConfig = config;
        Debug.Log($"[MapData] Đã nhận Config: {CurrentMapConfig.identityConfig.displayName}");

        _tagGroups.Clear();

        foreach (string tag in _targetTags)
        {
            // Tìm tất cả GameObject có gắn Tag tương ứng
            GameObject[] objects = GameObject.FindGameObjectsWithTag(tag);
            List<Transform> transforms = new List<Transform>();

            foreach (var obj in objects) transforms.Add(obj.transform);

            _tagGroups.Add(tag, transforms);
            Debug.Log($"[MapData] Index thành công {transforms.Count} điểm cho Tag: {tag}");
        }
    }

    // Hàm để các Spawner xin danh sách vị trí theo Tag
    public List<Transform> GetSpawnPoints(string tag)
    {
        if (_tagGroups.TryGetValue(tag, out List<Transform> points))
            return points;

        Debug.LogWarning($"[MapData] Tag '{tag}' không tồn tại hoặc không có điểm spawn nào!");
        return new List<Transform>();
    }
}