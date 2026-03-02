using UnityEngine;
using Photon.Pun;
using Game.Domain.Map.DTOs;
using System.Collections;
using System.Collections.Generic;
using Game.Core.Database; // Thêm namespace này

public class MonsterSpawnerManager : MonoBehaviour
{
    [Header("Minion Settings")]
    [SerializeField] private int maxActiveMinions = 5;
    [SerializeField] private float checkInterval = 10f;

    private MonsterSystemConfigDTO _currentConfig;
    private MapDataManager _mapData;
    private GameResourceDatabaseSO _resourceDB; // Lưu Database

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
        if (_currentConfig.bossConfig.spawnPointIds.Count == 0) return;

        string randomPointId = _currentConfig.bossConfig.spawnPointIds[Random.Range(0, _currentConfig.bossConfig.spawnPointIds.Count)];
        Transform target = _mapData.GetSpawnPointById(randomPointId);

        string bossId = _currentConfig.bossConfig.monsterId;
        GameObject prefab = _resourceDB.GetPrefabById(bossId);

        if (target != null && prefab != null)
        {
            PhotonNetwork.InstantiateRoomObject(prefab.name, target.position, target.rotation);
            Debug.Log($"👹 [MonsterSpawner] Boss {bossId} đã xuất hiện tại {randomPointId}!");
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
                for (int i = 0; i < needed; i++)
                {
                    SpawnSingleMinion();
                }
            }

            yield return new WaitForSeconds(checkInterval);
        }
    }

    private void SpawnSingleMinion()
    {
        var minionPool = _currentConfig.minionConfig.allowedMonsterIds;
        var pointPool = _currentConfig.minionConfig.spawnPointIds;

        if (minionPool.Count == 0 || pointPool.Count == 0) return;

        string randomMinionId = minionPool[Random.Range(0, minionPool.Count)];
        string randomPointId = pointPool[Random.Range(0, pointPool.Count)];

        Transform target = _mapData.GetSpawnPointById(randomPointId);
        GameObject prefab = _resourceDB.GetPrefabById(randomMinionId);

        if (target != null && prefab != null)
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