using UnityEngine;

[CreateAssetMenu(fileName = "KeyItemData", menuName = "Items/Key Item")]
public class KeyItemData : ScriptableObject
{
    public string itemName;
    public Sprite icon;
    public int slotSize = 1;
    [TextArea] public string description;

    [Header("World / Held Prefabs")]
    public GameObject worldPrefab;   // Model hiển thị trong map
    public GameObject heldPrefab;    // Model nhỏ cầm trên tay
}
