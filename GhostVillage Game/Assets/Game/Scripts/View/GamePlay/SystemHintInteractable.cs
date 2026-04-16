using UnityEngine;
using Game.Core.Player.RayCast;

public class SystemHintInteractable : MonoBehaviour, IInteractable
{
    [Header("Hint Content")]
    public string hintTitle = "SYSTEM LOG";

    [TextArea(5, 10)]
    public string hintContent = "Nhập nội dung Master Hint tiếng Anh vào đây...";

    public string promptMessage = "Read Hint";

    public string GetPromptMessage()
    {
        return $"{promptMessage} (F)";
    }

    public void Interact(GameObject actor)
    {
        // LƯU Ý: Chuyền biến HintType.System vào cuối
        HintModalUI.OnShowHint?.Invoke(hintTitle, hintContent, HintType.System);
    }
}