using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    public GameState currentState { get; private set; }

    private ObjectiveManager currentObjective;

    private void Awake()
    {
        Instance = this;
    }

    private void Start()
    {
        currentObjective = FindAnyObjectByType<ObjectiveManager>();
        currentObjective?.Initialize();

        SetState(GameState.None);
    }

    public void SetState(GameState newState)
    {
        currentState = newState;
        Debug.Log($"[GameManager] State changed to {newState}");
    }

    public void NotifyTrigger(string triggerId)
    {
        currentObjective?.OnTriggerActivated(triggerId);
    }

    public void NotifyItemPickup(KeyItemData item, InventoryManager inv)
    {
        currentObjective?.OnItemCollected(item, inv);
    }

    public void CheckObjectiveProgress()
    {
        if (currentObjective != null && currentObjective.IsObjectiveComplete())
        {
            Debug.Log("[GameManager] Objective complete! Moving to next phase.");
            SetState(GameState.Result);
        }
    }
}

