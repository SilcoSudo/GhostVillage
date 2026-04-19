using UnityEngine;
using Game.Scripts.Gameplay.Core;
using GhostVillage.Gameplay.Shared;

[CreateAssetMenu(fileName = "NewWhistle", menuName = "Game Data/Items/Whistle")]
public class WhistleItemSO : ItemDataSO
{
    // [Header("Whistle Stats")]
    // public float alertRadius = 100f;

    private void OnEnable()
    {
        itemType = ItemType.Consumable;
        holdType = HoldType.OneHand;
    }

    public override bool OnUse(GameObject character)
    {
        Debug.Log("<color=orange>[Whistle] Tuýt tuýt!! Đã thổi còi gọi quái!</color>");

        var pv = character.GetComponent<Photon.Pun.PhotonView>();
        if (pv != null)
        {
            // [FIX CHÍ MẠNG]: Bắn RPC cho TẤT CẢ mọi người để ai cũng nghe thấy tiếng còi!
            // RPC này sẽ gọi thẳng vào hàm RpcBlowWhistle bên InventoryManager của character đó
            pv.RPC("RpcBlowWhistle", Photon.Pun.RpcTarget.All, character.transform.position);
        }

        // Báo lại cho InventoryManager biết là xài xong rồi, xóa cái còi đi
        return true;
    }
}