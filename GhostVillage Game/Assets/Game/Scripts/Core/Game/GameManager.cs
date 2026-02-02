using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    public GameState CurrentState { get; private set; }

    private void Awake()
    {
        if (Instance == null) Instance = this;
    }

    private void Start()
    {
        // 1. Set trạng thái Playing luôn
        SetState(GameState.Playing);

        // 2. HÚ SPAWNER: "Thả người đi em ơi!"
        if (PlayerSpawner.Instance != null)
        {
            PlayerSpawner.Instance.SpawnLocalPlayer();
        }
        else
        {
            Debug.LogError("[GameManager] Không tìm thấy PlayerSpawner!");
        }
    }

    public void SetState(GameState newState)
    {
        CurrentState = newState;
        Debug.Log($"[GameManager] State changed to: {newState}");
    }

    public void OnObjectiveCompleted()
    {
        SetState(GameState.Triggered);
    }
}