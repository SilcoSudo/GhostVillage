using UnityEngine;
using Game.Core.Player.RayCast;
using Game.Scripts.Gameplay.Puzzles.Map2;

public class OngHaiHintPaper : MonoBehaviour, IInteractable
{
    [Header("Manager References")]
    public OngHaiPuzzleManager puzzleManager;

    [Header("Settings")]
    public string paperTitle = "Ong Hai's Note";
    public string promptMessage = "Read Note";

    public string GetPromptMessage()
    {
        return $"{promptMessage} (F)";
    }

    public void Interact(GameObject actor)
    {
        if (puzzleManager != null)
        {
            string hintContent = puzzleManager.GetActiveHint();

            // LƯU Ý: Chuyền biến HintType.Puzzle vào cuối
            HintModalUI.OnShowHint?.Invoke(paperTitle, hintContent, HintType.Puzzle);
        }
    }
}