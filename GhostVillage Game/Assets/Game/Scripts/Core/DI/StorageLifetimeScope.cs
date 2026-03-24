using VContainer;
using VContainer.Unity;
using UnityEngine;
using GhostVillage.Storage; // Namespace chứa StorageController
using Game.Core.Scene;

namespace GhostVillage.Domain.Storage.DI
{
    public class StorageLifetimeScope : LifetimeScope
    {
        [SerializeField] private StorageManager _storageManager;

        protected override void Configure(IContainerBuilder builder)
        {
            builder.RegisterComponent(_storageManager);
            builder.RegisterEntryPoint<StorageController>(Lifetime.Scoped);
            builder.Register<SceneLoaderService>(Lifetime.Singleton);
        }
    }
}