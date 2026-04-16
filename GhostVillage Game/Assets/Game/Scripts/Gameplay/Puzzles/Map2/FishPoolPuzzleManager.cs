using UnityEngine;
using Photon.Pun;
using System.Collections;
using System.Collections.Generic;
using VContainer;
using Game.Scripts.Gameplay.Core;

[RequireComponent(typeof(PhotonView))]
public class FishPoolPuzzleManager : MonoBehaviourPun
{
    [Header("Map References (Kéo AudioSource vào)")]
    public AudioSource speakerSource;
    public List<AudioSource> poolSources;

    [Header("Timing Settings")]
    public float delayAfterSpeaker = 1.5f;
    public float delayBetweenFishes = 1.2f;
    public float loopPauseDuration = 4.0f;

    [Inject] private GameAudioManager _audioManager;

    private List<int> _secretCode = new List<int>();
    private bool _isSolved = false;
    private Coroutine _playingRoutine;

    private void Start()
    {
        // ========================================================
        // [QUAN TRỌNG] ĐOẠN NÀY LÀ ĐỂ TÌM THẰNG AUDIOMANAGER
        // ========================================================
        if (_audioManager == null)
        {
            _audioManager = Object.FindFirstObjectByType<GameAudioManager>();

            if (_audioManager == null)
                Debug.LogError("<color=red>❌ [FISH POOL] TOANG! Không lùng ra được thằng GameAudioManager nào trong Scene!</color>");
            else
                Debug.Log("<color=green>✅ [FISH POOL] Móc nối GameAudioManager thành công bằng tay!</color>");
        }

        if (PhotonNetwork.IsMasterClient)
        {
            GenerateRandomCode();
        }
    }

    private void GenerateRandomCode()
    {
        int[] newCode = new int[4];
        for (int i = 0; i < 4; i++)
        {
            newCode[i] = Random.Range(0, poolSources.Count);
        }
        photonView.RPC(nameof(SyncSecretCodeRPC), RpcTarget.AllBuffered, newCode);
    }

    [PunRPC]
    private void SyncSecretCodeRPC(int[] code)
    {
        _secretCode = new List<int>(code);

        if (_playingRoutine != null) StopCoroutine(_playingRoutine);
        _playingRoutine = StartCoroutine(AudioLoopRoutine());

        string codeStr = string.Join("-", _secretCode);
        Debug.Log($"<color=cyan>====== [FISH POOL LOG] ======</color>\n" +
                  $"Đã tạo mật mã: {codeStr}\n" +
                  $"Ao sẽ kêu: {code[0] + 1} -> {code[1] + 1} -> {code[2] + 1} -> {code[3] + 1}");
    }

    private IEnumerator AudioLoopRoutine()
    {
        yield return new WaitForSeconds(2f);

        while (!_isSolved)
        {
            Debug.Log("<color=yellow>[FISH POOL] Tới lượt Loa phát tiếng còi BÍP BÍP...</color>");

            // LOGIC KIỂM TRA LỖI CHO LOA
            if (_audioManager == null)
            {
                Debug.LogError("<color=red>[FISH POOL] BÓ TAY: _audioManager đang NULL! Không có kho đĩa để mượn!</color>");
            }
            else if (speakerSource == null)
            {
                Debug.LogError("<color=red>[FISH POOL] BÓ TAY: speakerSource đang NULL! Loa chưa được kéo vào Inspector!</color>");
            }
            else
            {
                AudioClip beepClip = _audioManager.GetClip("RADIO_BEEP");
                if (beepClip != null)
                {
                    Debug.Log($"<color=magenta>=> Đã tìm thấy đĩa: {beepClip.name} (Thời lượng: {beepClip.length}s). TIẾN HÀNH PHÁT!</color>");
                    speakerSource.PlayOneShot(beepClip);
                }
                else
                {
                    Debug.LogError("<color=red>=> LỖI: Lấy được AudioManager nhưng gọi GetClip('RADIO_BEEP') nó trả về NULL! Sếp check lại ID bên GameAudioManager đi!</color>");
                }
            }

            yield return new WaitForSeconds(delayAfterSpeaker);

            foreach (int poolIndex in _secretCode)
            {
                if (_isSolved) break;

                if (poolIndex >= 0 && poolIndex < poolSources.Count)
                {
                    Debug.Log($"<color=orange>[FISH POOL] Tới lượt Ao số {poolIndex + 1} quẫy nước</color>");

                    if (_audioManager != null && poolSources[poolIndex] != null)
                    {
                        AudioClip splashClip = _audioManager.GetClip("FISH_SPLASH");
                        if (splashClip != null)
                        {
                            Debug.Log($"<color=magenta>=> Đã tìm thấy đĩa: {splashClip.name} (Thời lượng: {splashClip.length}s). PHÁT!</color>");
                            poolSources[poolIndex].PlayOneShot(splashClip);
                        }
                        else
                        {
                            Debug.LogError("<color=red>=> LỖI: Mất file AudioClip 'FISH_SPLASH'!</color>");
                        }
                    }
                }

                yield return new WaitForSeconds(delayBetweenFishes);
            }

            yield return new WaitForSeconds(loopPauseDuration);
        }
    }

    public bool TryUnlock(List<int> playerInput)
    {
        if (_isSolved) return true;

        bool isMatch = true;
        if (playerInput.Count != _secretCode.Count)
            isMatch = false;
        else
        {
            for (int i = 0; i < _secretCode.Count; i++)
            {
                if (playerInput[i] != _secretCode[i])
                {
                    isMatch = false;
                    break;
                }
            }
        }

        if (isMatch)
        {
            photonView.RPC(nameof(MarkAsSolvedRPC), RpcTarget.AllBuffered);
            return true;
        }
        else
        {
            photonView.RPC(nameof(TriggerPenaltyRPC), RpcTarget.All);
            return false;
        }
    }

    [PunRPC]
    private void MarkAsSolvedRPC()
    {
        _isSolved = true;
        if (_playingRoutine != null) StopCoroutine(_playingRoutine);

        if (_audioManager != null && speakerSource != null)
        {
            AudioClip unlockClip = _audioManager.GetClip("SAFE_UNLOCK");
            if (unlockClip != null) speakerSource.PlayOneShot(unlockClip);
        }

        Debug.Log("<color=green>[FishPool] ĐÃ GIẢI MÃ THÀNH CÔNG! NÍN TIẾNG CÁ!</color>");
        if (PhotonNetwork.IsMasterClient)
        {
            GameplayEvents.OnPuzzleSolved?.Invoke();
        }
    }

    [PunRPC]
    private void TriggerPenaltyRPC()
    {
        if (_audioManager != null && speakerSource != null)
        {
            AudioClip alarmClip = _audioManager.GetClip("ALARM_SIREN");
            speakerSource.volume = 1f;
            if (alarmClip != null) speakerSource.PlayOneShot(alarmClip);
        }

        if (speakerSource != null)
            GameplayEvents.OnWrongPuzzlePenalty?.Invoke(speakerSource.transform.position);

        Debug.Log("<color=red>[FishPool] NHẬP SAI MÃ! HÚ CÒI GỌI MA DA TỚI!</color>");
    }
}