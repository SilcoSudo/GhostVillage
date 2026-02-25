using Game.Core.Scene;
using VContainer;
using VContainer.Unity;

public class ProfileLifetimeScope : LifetimeScope
{
    protected override void Configure(IContainerBuilder builder)
    {
        builder.RegisterComponentInHierarchy<ProfileUIManager>();
        builder.Register<SceneLoaderService>(Lifetime.Singleton);
    }
}