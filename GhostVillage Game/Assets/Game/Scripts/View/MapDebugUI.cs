// using Cysharp.Threading.Tasks;
// using Game.Domain.Maps;
// using TMPro; // Nhớ cài package TextMeshPro
// using UnityEngine;
// using VContainer; // Cần để dùng [Inject]

// namespace Game.UI
// {
//     public class MapDebugUI : MonoBehaviour
//     {
//         [Header("UI References")]
//         [SerializeField] private TextMeshProUGUI _logText; // Kéo UI Text vào đây
//         [SerializeField] private string _mapIdToLoad = "map_01_jungle"; // ID Map muốn test

//         private IMapDataService _mapService;

//         // VContainer sẽ tự tìm hàm này và bơm Service vào (Method Injection)
//         [Inject]
//         public void Construct(IMapDataService mapService)
//         {
//             _mapService = mapService;
//         }

//         private async void Start()
//         {
//             // Đảm bảo chạy trên Main Thread ngay từ đầu
//             await UniTask.SwitchToMainThread();

//             _logText.text = "⏳ Đang tải dữ liệu từ Server...";

//             // Gọi Service lấy data
//             var data = await _mapService.GetMapConfig(_mapIdToLoad);

//             // QUAN TRỌNG: Chuyển về Main Thread trước khi update UI
//             await UniTask.SwitchToMainThread();

//             if (data != null)
//             {
//                 // Format hiển thị cho đẹp để dễ check
//                 string display = $" LOAD SUCCESS!\n" +
//                                  $"------------------\n" +
//                                  $"ID: {data._id}\n" +
//                                  $"Name: <color=yellow>{data.name}</color>\n" +
//                                  $"Diff: {data.baseDifficulty}\n" +
//                                  $"Monsters: {data.monsterSettings.maxMonsters} (Boss: {data.monsterSettings.enemyTypes[0]})\n" +
//                                  $"Rewards: {data.rewards.Count} items";

//                 _logText.text = display;
//             }
//             else
//             {
//                 _logText.text = " Lỗi: Không lấy được dữ liệu. Check Console!";
//             }
//         }
//     }
// }