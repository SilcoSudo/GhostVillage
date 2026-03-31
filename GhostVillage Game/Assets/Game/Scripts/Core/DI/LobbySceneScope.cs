using VContainer;
using VContainer.Unity;
using UnityEngine;
using Game.Scripts.UI.Lobby;
using Game.Scripts.View.Lobby;
using Game.Domain.Perk.Services;
using Game.Domain.Perk.Controllers;

namespace Game.Core.DI
{
    public class LobbySceneScope : LifetimeScope
    {
        [Header("Lobby Managers")]
        [SerializeField] private LobbyUIManager _uiManager;
        [SerializeField] private LobbyManager _lobbyManager;

        protected override void Configure(IContainerBuilder builder)
        {
            // Đăng ký trực tiếp tham chiếu đã kéo từ Inspector
            if (_uiManager != null) builder.RegisterComponent(_uiManager);
            if (_lobbyManager != null) builder.RegisterComponent(_lobbyManager);

            builder.RegisterComponentInHierarchy<FriendBoardInteract>();
            builder.RegisterComponentInHierarchy<PerkBoardInteract>();
            builder.Register<PerkService>(Lifetime.Scoped);
            builder.Register<PerkController>(Lifetime.Scoped);

        }
    }
}