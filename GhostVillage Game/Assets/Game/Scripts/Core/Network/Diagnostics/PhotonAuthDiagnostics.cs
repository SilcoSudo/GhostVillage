// using UnityEngine;
// using Photon.Pun;
// using Photon.Realtime;
// using ExitGames.Client.Photon;

// namespace Game.Core.Network.Diagnostics
// {
//     /// <summary>
//     /// Script diagnose Photon Authentication flow
//     /// Gắn vào một empty GameObject để monitor logs
//     /// </summary>
//     public class PhotonAuthDiagnostics : MonoBehaviourPunCallbacks
//     {
//         private void Update()
//         {
//             // Bấm D để print info
//             if (Input.GetKeyDown(KeyCode.D))
//             {
//                 PrintPhotonState();
//             }
//         }

//         private void PrintPhotonState()
//         {
//             Debug.Log("\n" + new string('=', 60));
//             Debug.Log("🔍 PHOTON AUTHENTICATION DIAGNOSTICS");
//             Debug.Log(new string('=', 60));

//             // 1. Connection Status
//             Debug.Log($"\n📊 CONNECTION STATUS:");
//             Debug.Log($"  IsConnected: {PhotonNetwork.IsConnected}");
//             Debug.Log($"  IsConnectedAndReady: {PhotonNetwork.IsConnectedAndReady}");
//             Debug.Log($"  NetworkClientState: {PhotonNetwork.NetworkClientState}");
//             Debug.Log($"  InLobby: {PhotonNetwork.InLobby}");
//             Debug.Log($"  InRoom: {PhotonNetwork.InRoom}");

//             // 2. Auth Values
//             Debug.Log($"\n🔐 AUTH VALUES:");
//             if (PhotonNetwork.AuthValues != null)
//             {
//                 Debug.Log($"  UserId: {PhotonNetwork.AuthValues.UserId}");
//                 Debug.Log($"  AuthType: {PhotonNetwork.AuthValues.AuthType}");
//                 Debug.Log($"  Token length: {(string.IsNullOrEmpty(PhotonNetwork.AuthValues.UserId) ? 0 : PhotonNetwork.AuthValues.UserId.Length)}");
//                 Debug.Log($"  Token preview: {(string.IsNullOrEmpty(PhotonNetwork.AuthValues.UserId) ? "[NULL]" : PhotonNetwork.AuthValues.UserId.Substring(0, Mathf.Min(30, PhotonNetwork.AuthValues.UserId.Length)) + "...")}");
//             }
//             else
//             {
//                 Debug.Log($"  AuthValues: [NULL]");
//             }

//             // 3. App Settings
//             var appSettings = PhotonNetwork.PhotonServerSettings.AppSettings;
//             Debug.Log($"\n⚙️ APP SETTINGS:");
//             Debug.Log($"  AppVersion: {appSettings.AppVersion}");
//             Debug.Log($"  UseNameServer: {appSettings.UseNameServer}");
//             Debug.Log($"  AuthMode: {appSettings.AuthMode}");
//             Debug.Log($"  AppIdRealtime: {appSettings.AppIdRealtime}");
//             Debug.Log($"  FixedRegion: {appSettings.FixedRegion}");
//             Debug.Log($"  Server: {appSettings.Server}");
//             Debug.Log($"  Port: {appSettings.Port}");
//             Debug.Log($"  Protocol: {appSettings.Protocol}");

//             // 4. Local Player Info
//             Debug.Log($"\n👤 LOCAL PLAYER:");
//             Debug.Log($"  NickName: {PhotonNetwork.NickName}");
//             if (PhotonNetwork.LocalPlayer != null)
//             {
//                 Debug.Log($"  PlayerID: {PhotonNetwork.LocalPlayer.ID}");
//                 Debug.Log($"  IsLocal: {PhotonNetwork.LocalPlayer.IsLocal}");
//             }

//             // 5. Network Peer Info
//             Debug.Log($"\n🌐 PEER INFO:");
//             if (PhotonNetwork.NetworkingClient != null)
//             {
//                 Debug.Log($"  PeerID: {PhotonNetwork.NetworkingClient.PeerID}");
//                 Debug.Log($"  ServerAddress: {PhotonNetwork.NetworkingClient.ServerIpAddress}");
//                 Debug.Log($"  LoadBalancingPeer state: {PhotonNetwork.NetworkingClient.LoadBalancingPeer.PeerState}");
//             }

//             Debug.Log(new string('=', 60) + "\n");
//         }

//         public override void OnConnectedToMaster()
//         {
//             Debug.Log(" [Photon] OnConnectedToMaster called");
//             PrintPhotonState();
//         }

//         public override void OnDisconnected(DisconnectCause cause)
//         {
//             Debug.Log($" [Photon] OnDisconnected: {cause}");
//             PrintPhotonState();
//         }

//         public override void OnCustomAuthenticationResponse(Dictionary<string, object> data)
//         {
//             Debug.Log(" [Photon] OnCustomAuthenticationResponse called");
//             Debug.Log($"  Data keys: {string.Join(", ", data.Keys)}");
//             foreach (var kv in data)
//             {
//                 Debug.Log($"    {kv.Key}: {kv.Value}");
//             }
//         }

//         public override void OnCustomAuthenticationFailed(string debugMessage)
//         {
//             Debug.Log($" [Photon] OnCustomAuthenticationFailed: {debugMessage}");
//             PrintPhotonState();
//         }
//     }
// }
