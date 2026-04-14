using UnityEngine;
using Photon.Pun;
using System.Collections;
using System.Collections.Generic;
using Game.Scripts.Gameplay.Core;
using GhostVillage.Gameplay.Base;

public class XRayPerkController : MonoBehaviourPun
{
    [Header("X-Ray Settings")]
    [SerializeField] private Material _xRayMaterial;
    [SerializeField] private float _xRayDuration = 5f;

    private PlayerStatsManager _stats;

    private void Awake()
    {
        _stats = GetComponent<PlayerStatsManager>();
        if (_stats == null)
        {
            Debug.LogError("<color=red>[X-Ray]</color> LỖI: Không tìm thấy PlayerStatsManager trên nhân vật!");
        }
    }

    private void OnEnable()
    {
        if (photonView.IsMine)
        {
            GameplayEvents.OnPuzzleSolved += TriggerXRay;
            Debug.Log("<color=cyan>[X-Ray]</color> Đã đăng ký sự kiện OnPuzzleSolved thành công.");
        }
        else
        {
            Debug.LogWarning("<color=orange>[X-Ray]</color> Không đăng ký sự kiện vì đây không phải Local Player.");
        }
    }

    private void OnDisable()
    {
        if (photonView.IsMine)
        {
            GameplayEvents.OnPuzzleSolved -= TriggerXRay;
        }
    }

    private void TriggerXRay()
    {
        Debug.Log("<color=yellow>[X-Ray]</color> Hàm TriggerXRay vừa được gọi! Đang kiểm tra điều kiện...");

        if (_stats == null)
        {
            Debug.LogError("<color=red>[X-Ray]</color> Không thể kích hoạt: _stats bị null.");
            return;
        }

        Debug.Log($"<color=yellow>[X-Ray]</color> Giá trị của hasPropheticSight hiện tại là: {_stats.hasPropheticSight}");

        if (_stats.hasPropheticSight)
        {
            Debug.Log("<color=green>[X-Ray]</color> Đủ điều kiện! Đang bắt đầu Coroutine...");
            StartCoroutine(XRayRoutine());
        }
        else
        {
            Debug.Log("<color=red>[X-Ray]</color> Tạch! Người chơi này KHÔNG có cờ hasPropheticSight.");
        }
    }

    private IEnumerator XRayRoutine()
    {
        if (_xRayMaterial == null)
        {
            Debug.LogError("<color=red>[X-Ray]</color> LỖI: Chưa gắn Material vào ô X Ray Material trong Inspector!");
            yield break;
        }

        Debug.Log("<color=magenta>[X-Ray]</color> ĐANG BẬT HACK NHÌN XUYÊN TƯỜNG!");

        MonsterBase[] allMonsters = FindObjectsOfType<MonsterBase>();
        Debug.Log($"<color=magenta>[X-Ray]</color> Quét thấy {allMonsters.Length} quái vật trên bản đồ.");

        List<SkinnedMeshRenderer> affectedRenderers = new List<SkinnedMeshRenderer>();

        foreach (var monster in allMonsters)
        {
            var renderers = monster.GetComponentsInChildren<SkinnedMeshRenderer>();
            foreach (var r in renderers)
            {
                Material[] mats = r.materials;
                Material[] newMats = new Material[mats.Length + 1];

                mats.CopyTo(newMats, 0);
                newMats[newMats.Length - 1] = _xRayMaterial;

                r.materials = newMats;
                affectedRenderers.Add(r);
            }
        }

        yield return new WaitForSeconds(_xRayDuration);

        foreach (var r in affectedRenderers)
        {
            if (r != null)
            {
                Material[] mats = r.materials;
                if (mats.Length > 0)
                {
                    Material[] originalMats = new Material[mats.Length - 1];
                    System.Array.Copy(mats, originalMats, mats.Length - 1);
                    r.materials = originalMats;
                }
            }
        }

        Debug.Log("<color=magenta>[X-Ray]</color> Đã tắt hack và xóa Material.");
    }
}