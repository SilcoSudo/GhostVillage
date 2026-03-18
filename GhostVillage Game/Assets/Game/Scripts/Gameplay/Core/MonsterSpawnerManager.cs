using UnityEngine;
using Photon.Pun;
using Game.Domain.Map.DTOs;
using System.Collections;
using System.Collections.Generic;
using Game.Core.Database;

public class MonsterSpawnerManager : MonoBehaviour
{
    [Header("Minion Settings")]
    [SerializeField] private int maxActiveMinions = 5;
    [SerializeField] private float checkInterval = 10f;

    private MonsterSystemConfigDTO _currentConfig;
    private MapDataManager _mapData;
    private GameResourceDatabaseSO _resourceDB;

    private List<int> _activeMinionIds = new List<int>();

    public void SpawnMonsters(MonsterSystemConfigDTO config, MapDataManager mapData, GameResourceDatabaseSO resourceDB)
    {
        if (!PhotonNetwork.IsMasterClient) return;

        _currentConfig = config;
        _mapData = mapData;
        _resourceDB = resourceDB;

        Debug.Log("[MonsterSpawner] Khởi động hệ thống quái vật...");

        SpawnBoss();
        StartCoroutine(MinionPopulationControlRoutine());
    }

    private void SpawnBoss()
    {
        if (_currentConfig == null || _currentConfig.bossConfig == null) return;

        string bossId = _currentConfig.bossConfig.monsterId;
        if (string.IsNullOrEmpty(bossId)) return;

        // BỐC ĐIỂM BOSS TỪ TAG
        List<Transform> bossPoints = _mapData.GetSpawnPointsByTag("SP_Boss");
        if (bossPoints.Count == 0)
        {
            Debug.LogWarning("⚠️ [MonsterSpawner] Map không có điểm nào gắn Tag 'SP_Boss'!");
            return;
        }

        Transform target = bossPoints[Random.Range(0, bossPoints.Count)];
        GameObject prefab = _resourceDB.GetPrefabById(bossId);

        if (prefab != null)
        {
            PhotonNetwork.InstantiateRoomObject(prefab.name, target.position, target.rotation);
            Debug.Log($"👹 [MonsterSpawner] Boss {bossId} đã xuất hiện tại {target.name}!");
        }
    }

    private IEnumerator MinionPopulationControlRoutine()
    {
        while (true)
        {
            CleanupDeadMinions();
            int currentPopulation = _activeMinionIds.Count;

            if (currentPopulation < maxActiveMinions)
            {
                int needed = maxActiveMinions - currentPopulation;
                for (int i = 0; i < needed; i++) SpawnSingleMinion();
            }

            yield return new WaitForSeconds(checkInterval);
        }
    }

    private void SpawnSingleMinion()
    {
        if (_currentConfig == null || _currentConfig.minionConfig == null) return;
        var minionPool = _currentConfig.minionConfig.allowedMonsterIds;
        if (minionPool == null || minionPool.Count == 0) return;

        // BỐC ĐIỂM MINION TỪ TAG
        List<Transform> minionPoints = _mapData.GetSpawnPointsByTag("SP_Minion");
        if (minionPoints.Count == 0) return;

        string randomMinionId = minionPool[Random.Range(0, minionPool.Count)];
        Transform target = minionPoints[Random.Range(0, minionPoints.Count)];
        GameObject prefab = _resourceDB.GetPrefabById(randomMinionId);

        if (prefab != null)
        {
            GameObject minion = PhotonNetwork.InstantiateRoomObject(prefab.name, target.position, target.rotation);
            PhotonView pv = minion.GetComponent<PhotonView>();
            if (pv != null) _activeMinionIds.Add(pv.ViewID);
        }
    }

    private void CleanupDeadMinions()
    {
        for (int i = _activeMinionIds.Count - 1; i >= 0; i--)
        {
            PhotonView pv = PhotonView.Find(_activeMinionIds[i]);
            if (pv == null) _activeMinionIds.RemoveAt(i);
        }
    }
}