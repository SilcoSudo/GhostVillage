// using Photon.Pun;
// using Photon.Realtime;
// using UnityEngine;
// using ExitGames.Client.Photon;

// namespace Game.Core.Network.Diagnostics
// {
//     /// <summary>
//     /// Test script để thử các auth scenarios
//     /// Temp use only - để diagnose vấn đề
//     /// </summary>
//     public class PhotonAuthTestScenarios : MonoBehaviour
//     {
//         private string _testToken = "";

//         private void OnGUI()
//         {
//             GUILayout.BeginArea(new Rect(10, 10, 400, 500));

//             GUILayout.Label("🔐 PHOTON AUTH TEST SCENARIOS", new GUIStyle(GUI.skin.label) { fontSize = 16, fontStyle = FontStyle.Bold });
//             GUILayout.Space(10);

//             // Show current state
//             GUILayout.Label($"Current State: {PhotonNetwork.NetworkClientState}");
//             GUILayout.Label($"IsConnectedAndReady: {PhotonNetwork.IsConnectedAndReady}");
//             GUILayout.Space(10);

//             // Test Token Input
//             GUILayout.Label("Token (for testing):");
//             _testToken = GUILayout.TextField(_testToken, GUILayout.Width(350));
//             GUILayout.Space(5);

//             // Scenario A: With Token
//             if (GUILayout.Button("Test A: Connect WITH Token", GUILayout.Height(40)))
//             {
//                 TestScenarioA_WithToken(_testToken);
//             }

//             // Scenario B: Without Token (null)
//             if (GUILayout.Button("Test B: Connect WITHOUT Token (null)", GUILayout.Height(40)))
//             {
//                 TestScenarioB_NoToken();
//             }

//             // Scenario C: With NickName instead of Token
//             if (GUILayout.Button("Test C: Connect WITH NickName Only", GUILayout.Height(40)))
//             {
//                 TestScenarioC_NicknameOnly();
//             }

//             // Scenario D: Reset Auth
//             if (GUILayout.Button("Test D: Reset AuthValues", GUILayout.Height(40)))
//             {
//                 TestScenarioD_ResetAuth();
//             }

//             // Scenario E: Custom AuthMode
//             if (GUILayout.Button("Test E: Try AuthMode = -1", GUILayout.Height(40)))
//             {
//                 TestScenarioE_CustomAuthMode();
//             }

//             GUILayout.Space(20);
//             GUILayout.Label("Notes:", new GUIStyle(GUI.skin.label) { fontStyle = FontStyle.Bold });
//             GUILayout.Label("• Paste your backend token to test");
//             GUILayout.Label("• Each test will attempt Photon connection");
//             GUILayout.Label("• Check console for results");
//             GUILayout.Label("• Press ESC to hide this UI");

//             GUILayout.EndArea();

//             if (Input.GetKeyDown(KeyCode.Escape))
//             {
//                 gameObject.SetActive(false);
//             }
//         }

//         private void TestScenarioA_WithToken(string token)
//         {
//             if (string.IsNullOrEmpty(token))
//             {
//                 Debug.LogError("[TEST A]  Token is empty!");
//                 return;
//             }

//             Debug.Log("\n" + new string('=', 60));
//             Debug.Log("[TEST A] 🔐 Connect WITH Token");
//             Debug.Log(new string('=', 60));
//             Debug.Log($"Token: {token.Substring(0, Mathf.Min(30, token.Length))}...");
//             Debug.Log($"Token length: {token.Length}");

//             PhotonNetwork.NickName = "TestUser_A";
//             PhotonNetwork.AuthValues = new AuthenticationValues(token);
//             PhotonNetwork.PhotonServerSettings.AppSettings.AppVersion = "1.0";
//             PhotonNetwork.ConnectUsingSettings();
//             Debug.Log("[TEST A] Connecting...");
//         }

//         private void TestScenarioB_NoToken()
//         {
//             Debug.Log("\n" + new string('=', 60));
//             Debug.Log("[TEST B] 🔓 Connect WITHOUT Token (null)");
//             Debug.Log(new string('=', 60));

//             PhotonNetwork.NickName = "TestUser_B";
//             PhotonNetwork.AuthValues = null;  // ← No auth
//             PhotonNetwork.PhotonServerSettings.AppSettings.AppVersion = "1.0";
//             PhotonNetwork.ConnectUsingSettings();
//             Debug.Log("[TEST B] Connecting...");
//         }

//         private void TestScenarioC_NicknameOnly()
//         {
//             Debug.Log("\n" + new string('=', 60));
//             Debug.Log("[TEST C] 👤 Connect WITH NickName Only");
//             Debug.Log(new string('=', 60));

//             string nickName = "TestUser_C";
//             PhotonNetwork.NickName = nickName;
//             PhotonNetwork.AuthValues = new AuthenticationValues(nickName);  // ← Use nickname as auth
//             PhotonNetwork.PhotonServerSettings.AppSettings.AppVersion = "1.0";
//             PhotonNetwork.ConnectUsingSettings();
//             Debug.Log($"[TEST C] Connecting with NickName: {nickName}");
//         }

//         private void TestScenarioD_ResetAuth()
//         {
//             Debug.Log("\n" + new string('=', 60));
//             Debug.Log("[TEST D] ↩️ Reset AuthValues");
//             Debug.Log(new string('=', 60));

//             PhotonNetwork.Disconnect();
//             PhotonNetwork.AuthValues = null;
//             PhotonNetwork.NickName = "TestUser_D";
//             PhotonNetwork.PhotonServerSettings.AppSettings.AppVersion = "1.0";
//             Debug.Log("[TEST D] Disconnected and reset. Ready to connect.");
//         }

//         private void TestScenarioE_CustomAuthMode()
//         {
//             Debug.Log("\n" + new string('=', 60));
//             Debug.Log("[TEST E] ⚙️ Try AuthMode = -1");
//             Debug.Log(new string('=', 60));

//             PhotonNetwork.NickName = "TestUser_E";
//             PhotonNetwork.PhotonServerSettings.AppSettings.AuthMode = -1;  // ← Disable custom auth
//             PhotonNetwork.AuthValues = null;
//             PhotonNetwork.PhotonServerSettings.AppSettings.AppVersion = "1.0";
//             PhotonNetwork.ConnectUsingSettings();
//             Debug.Log("[TEST E] Connecting with AuthMode = -1...");
//         }
//     }
// }
