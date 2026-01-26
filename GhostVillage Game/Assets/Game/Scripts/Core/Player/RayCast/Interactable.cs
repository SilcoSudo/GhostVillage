using UnityEngine;

public interface IInteractable
{
    void Interact();
    string GetPromptMessage();
}

public abstract class Interactable : MonoBehaviour, IInteractable
{
    [Header("Interaction Settings")]
    [SerializeField] protected string promptText = "Tương tác";

    public abstract void Interact();

    // Trả về dòng chữ hiển thị, vd: "Quản lý người chơi (F)"
    public virtual string GetPromptMessage() => $"{promptText} (F)";

}
