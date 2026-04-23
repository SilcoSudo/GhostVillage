using VContainer;
using VContainer.Unity;
using UnityEngine;
using Game.Core.Scene;

namespace GhostVillage.Shop
{
    public class ShopLifetimeScope : LifetimeScope
    {
        [Header("Shop Scene References")]
        [SerializeField] private ShopManager _shopManager;

        protected override void Configure(IContainerBuilder builder)
        {
            // Đăng ký các thành phần có sẵn trong Scene
            builder.RegisterComponent(_shopManager);
            builder.RegisterEntryPoint<ShopController>();
            builder.Register<SceneLoaderService>(Lifetime.Singleton);
        }
    }
}