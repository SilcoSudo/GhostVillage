using UnityEngine;

public interface IInteractable
{
    void Interact(PlayerInteract player);
    string GetPromptMessage();
    KeyCode InteractKey { get; }
}

public abstract class Interactable : MonoBehaviour, IInteractable
{
    [Header("Common Settings")]
    public string objectName = "Vật thể"; // Tên item
    public string promptText = "Tương tác"; // Dòng prompt riêng cho item
    public KeyCode interactKey = KeyCode.F; // Phím dùng để tương tác
    public KeyCode InteractKey => interactKey;

    /// <summary>
    /// Hàm bắt buộc khi player tương tác
    /// </summary>
    public abstract void Interact(PlayerInteract player);

    /// <summary>
    /// Hàm trả về prompt hiển thị
    /// </summary>
    public virtual string GetPromptMessage()
    {
        // Tự động tạo câu: "Nhấn F để Rung Chuông"
        return $"{promptText}({interactKey})";
    }



}
