using VContainer;
using VContainer.Unity;
using UnityEngine;

namespace GhostVillage.Shop
{
    public class ShopLifetimeScope : LifetimeScope
    {
        [Header("Shop Scene References")]
        [SerializeField] private ShopManager _shopManager;
        [SerializeField] private CharacterPreviewer _characterPreviewer;

        protected override void Configure(IContainerBuilder builder)
        {
            // Đăng ký các thành phần có sẵn trong Scene
            builder.RegisterComponent(_shopManager);
            builder.RegisterComponent(_characterPreviewer);
            builder.RegisterEntryPoint<ShopController>();
        }
    }
}