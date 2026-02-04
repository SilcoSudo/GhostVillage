using UnityEngine;

public interface IInteractable
{
    // Thêm GameObject actor để biết ai đang tương tác (để bỏ đồ vào túi người đó)
    void Interact(GameObject actor);
    string GetPromptMessage();
}

public abstract class Interactable : MonoBehaviour, IInteractable
{
    [Header("Interaction Settings")]
    [SerializeField] protected string promptText = "Tương tác";

    public abstract void Interact(GameObject actor);

    public virtual string GetPromptMessage() => $"{promptText} (F)";
}