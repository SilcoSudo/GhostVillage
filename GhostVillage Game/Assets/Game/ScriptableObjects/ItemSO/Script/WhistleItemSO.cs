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

        // Nếu là Master thì chọc thẳng vào AI
        if (Photon.Pun.PhotonNetwork.IsMasterClient)
        {
            MonsterEvents.AlertPlayerSpotted(character.transform.position);
        }
        else
        {
            // Nếu là Client thì gọi cái hàm RPC mình vừa ném vào InventoryManager
            var pv = character.GetComponent<Photon.Pun.PhotonView>();
            if (pv != null)
            {
                pv.RPC("RpcBlowWhistle", Photon.Pun.RpcTarget.MasterClient, character.transform.position);
            }
        }

        // Báo lại cho InventoryManager biết là xài xong rồi, xóa cái còi đi
        return true;
    }
}