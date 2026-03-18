namespace GhostVillage.Shop
{
    public interface IShopItem
    {
        string GetId();
        string GetName();
        int GetPrice();
        ItemType GetItemType();
    }
}