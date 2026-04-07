using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using System;
using Game.ScriptableObjects.GameConfig;
using System.Text;
using VContainer;

namespace Game.Core.Network.API
{
    public class APIClient
    {
        private readonly GameConfigSO _config; // Biến lưu config
        private readonly string _baseUrl;
        private readonly Script.UI.GlobalUIManager _globalUI;
        private readonly GameSession _session;
        private readonly Scene.ISceneLoaderService _sceneLoader;

        // Constructor Injection: VContainer sẽ tự điền config vào đây
        [Inject]
        public APIClient(
            GameConfigSO config,
            Script.UI.GlobalUIManager globalUI,
            GameSession session,
            Scene.ISceneLoaderService sceneLoader)
        {
            _config = config;
            _baseUrl = _config.ServerUrl;
            _globalUI = globalUI;
            _session = session;
            _sceneLoader = sceneLoader;

            if (_config.IsDebugMode)
            {
                Debug.Log($"[APIClient] Init with URL: {_baseUrl}");
                // Log check xem UI có bị null không
                if (_globalUI == null) Debug.LogError("[APIClient] GlobalUIManager is NULL after Inject!");
            }
        }

        // 2. Class Wrapper để hứng JSON chuẩn từ Server { success: ..., data: ... }
        [Serializable]
        private class ResponseWrapper<T>
        {
            public bool success;
            public T data;
            public string error;
            public string message;
        }

        [Serializable]
        private class ErrorResponseDTO
        {
            public bool success;
            public string message;
            public bool isKicked;
        }

        // 3. Hàm GET Generic
        [Obsolete]
        public async UniTask<T> GetAsync<T>(string endpoint)
        {
            // Xử lý nối chuỗi URL an toàn (tránh bị 2 dấu //)
            string url = $"{_baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";

            if (_config.IsDebugMode) Debug.Log($"[API] GET Request: {url}");

            using (var request = UnityWebRequest.Get(url))
            {
                // Gửi request và chờ (await) bằng UniTask
                await request.SendWebRequest();
                if (CheckForKickedStatus(request))
                {
                    Debug.Log("<color=red>[API] Account Kicked detected. Stopping request flow.</color>");
                    return default;
                }

                if (request.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogError($"[API] Error: {request.error}");
                    return default;
                }

                string jsonResponse = request.downloadHandler.text;
                Debug.Log($"[API] Raw Response: {jsonResponse}");

                try
                {
                    // 4. Parse lớp vỏ bên ngoài trước
                    var wrapper = JsonUtility.FromJson<ResponseWrapper<T>>(jsonResponse);

                    if (wrapper != null)
                    {
                        Debug.Log($"[API] Wrapper parsed - success: {wrapper.success}");
                    }

                    if (wrapper != null && wrapper.success)
                    {
                        return wrapper.data; // Trả về lõi dữ liệu thật
                    }
                    else
                    {
                        Debug.LogError($"[API] Server Logic Error: {wrapper?.error}");
                        return default;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"[API Error] {e.Message}");
                    throw;
                }
            }
        }

        /// <summary>
        /// Thực hiện gửi yêu cầu GET kèm mã xác thực (JWT Token).
        /// Thường dùng cho các API lấy dữ liệu cá nhân như Profile, Lịch sử đấu, Thành tựu.
        /// </summary>
        /// <typeparam name="T">Kiểu dữ liệu mong muốn nhận về (Entity hoặc DTO)</typeparam>
        /// <param name="endpoint">Đường dẫn API (Ví dụ: "/api/game/player/profile")</param>
        /// <param name="token">Mã JWT Token lấy từ PlayerPrefs hoặc AuthService</param>
        /// <returns>Trả về dữ liệu kiểu T nếu thành công, ngược lại trả về default</returns>
        [Obsolete]
        public async UniTask<T> GetAsyncWithAuth<T>(string endpoint, string token)
        {
            string url = $"{_baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
            using var request = UnityWebRequest.Get(url);
            request.SetRequestHeader("Authorization", $"Bearer {token.Trim()}");

            try
            {
                // Thằng này hễ thấy 401 là nó quăng thẳng xuống 'catch' bên dưới
                await request.SendWebRequest();

                // Nếu tới được đây tức là 200 OK, cứ parse data bình thường
                string jsonResponse = request.downloadHandler.text;
                var baseResponse = JsonUtility.FromJson<ResponseWrapper<string>>(jsonResponse);
                if (baseResponse == null || !baseResponse.success) return default;

                string dataJson = ExtractDataField(jsonResponse);
                return JsonUtility.FromJson<T>(dataJson);
            }
            catch (Exception e)
            {
                // [GIĂNG LƯỚI TẠI ĐÂY]: Khi UniTask quăng 401, ta check ngay xem có phải bị kick không!
                if (CheckForKickedStatus(request))
                {
                    Debug.Log("<color=red>[API] Account Kicked detected in Catch block. Stopping request flow.</color>");
                    return default; // Đã hú UI đuổi khách, thoát hàm im lặng!
                }

                // Nếu lỗi mạng hoặc lỗi khác, lúc này mới log đỏ
                Debug.LogError($"[API Error] {e.Message}");
                throw;
            }
        }

        // Hàm hỗ trợ bóc tách trường "data" từ JSON thô
        private string ExtractDataField(string json)
        {
            // Tìm vị trí của "data": và bóc nội dung sau đó
            int dataIdx = json.IndexOf("\"data\":");
            if (dataIdx == -1) return "{}";

            // ✅ FIX: Tìm dấu ':' sau "data"
            int colonIdx = json.IndexOf(":", dataIdx);
            int start = colonIdx + 1;

            // ✅ FIX: Bỏ qua khoảng trắng & kiểm tra ký tự đầu tiên
            while (start < json.Length && char.IsWhiteSpace(json[start]))
            {
                start++;
            }

            // ✅ FIX: Bây giờ start trỏ tới '{' hoặc '[' hoặc "null" hoặc string
            if (start >= json.Length) return "{}";

            char firstChar = json[start];

            // Nếu là object {...} hoặc array [...]
            if (firstChar == '{' || firstChar == '[')
            {
                int bracketCount = 0;
                int end = start;

                // Tìm bracket khớp
                for (int i = start; i < json.Length; i++)
                {
                    char c = json[i];
                    if (c == '{' || c == '[')
                    {
                        bracketCount++;
                    }
                    else if (c == '}' || c == ']')
                    {
                        bracketCount--;
                        if (bracketCount == 0)
                        {
                            end = i + 1;
                            break;
                        }
                    }
                }

                return json.Substring(start, end - start);
            }

            // Nếu là null, string, number
            if (json.Substring(start).StartsWith("null"))
            {
                return "null";
            }

            // Parse string nếu là string value
            if (firstChar == '"')
            {
                int end = start + 1;
                while (end < json.Length && json[end] != '"')
                {
                    if (json[end] == '\\') end++; // Skip escaped character
                    end++;
                }
                return json.Substring(start, end - start + 1);
            }

            // Parse number hoặc boolean
            int numEnd = start;
            while (numEnd < json.Length && !char.IsWhiteSpace(json[numEnd]) && json[numEnd] != ',' && json[numEnd] != '}')
            {
                numEnd++;
            }
            return json.Substring(start, numEnd - start);
        }

        // Hàm POST Generic (Thêm đoạn này vào)
        [Obsolete]
        public async UniTask<T> PostAsync<T>(string endpoint, string jsonBody)
        {
            string url = $"{_baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";

            if (_config.IsDebugMode) Debug.Log($"[API] POST Request: {url} | Body: {jsonBody}");

            // Setup Request thủ công để gửi JSON (UnityWebRequest.Post mặc định là form-data)
            using (var request = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");

                await request.SendWebRequest();
                if (CheckForKickedStatus(request))
                {
                    Debug.Log("<color=red>[API] Account Kicked detected. Stopping request flow.</color>");
                    return default;
                }

                if (request.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogError($"[API] Error: {request.error} | Response: {request.downloadHandler.text}");
                    return default;
                }

                string jsonResponse = request.downloadHandler.text;
                // Debug.Log($"[API] Response: {jsonResponse}");

                try
                {
                    // Tái sử dụng logic parse wrapper giống hàm GET
                    var wrapper = JsonUtility.FromJson<ResponseWrapper<T>>(jsonResponse);

                    if (wrapper != null && wrapper.success)
                    {
                        return wrapper.data;
                    }
                    else
                    {
                        Debug.LogError($"[API] Server Logic Error: {wrapper?.error}");
                        return default;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"[API Error] {e.Message}");
                    throw;
                }
            }
        }

        /// <summary>
        /// POST request with Authorization header (for authenticated endpoints)
        /// </summary>
        [Obsolete]
        public async UniTask<T> PostAsyncWithAuth<T>(string endpoint, string jsonBody, string token)
        {
            string url = $"{_baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
            using var request = new UnityWebRequest(url, "POST");
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            request.SetRequestHeader("Authorization", $"Bearer {token}");

            try
            {
                await request.SendWebRequest();

                string jsonResponse = request.downloadHandler.text;
                var wrapper = JsonUtility.FromJson<ResponseWrapper<T>>(jsonResponse);
                if (wrapper != null && wrapper.success) return wrapper.data;

                Debug.LogError($"[API] Server Logic Error: {wrapper?.error}");
                return default;
            }
            catch (Exception e)
            {
                // Bắt Kicked tại đây
                if (CheckForKickedStatus(request)) return default;

                Debug.LogError($"[API Error] {e.Message}");
                throw;
            }
        }

        [Obsolete]
        public async UniTask<string> GetRawJsonWithAuth(string endpoint, string token)
        {
            string url = $"{_baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
            using var request = UnityWebRequest.Get(url);
            request.SetRequestHeader("Authorization", $"Bearer {token.Trim()}");

            try
            {
                await request.SendWebRequest();
                if (CheckForKickedStatus(request))
                {
                    Debug.Log("<color=red>[API] Account Kicked detected. Stopping request flow.</color>");
                    return default;
                }


                if (request.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogError($"[API] Error: {request.error}");
                    return null;
                }
                return request.downloadHandler.text;
            }
            catch (Exception e)
            {
                Debug.LogError($"[API Error] {e.Message}");
                return null;
            }
        }

        /// <summary>
        /// PUT request (Dùng để cập nhật dữ liệu như Trang bị đồ)
        /// </summary>
        [Obsolete]
        public async UniTask<T> PutAsyncWithAuth<T>(string endpoint, string jsonBody, string token)
        {
            string url = $"{_baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
            using var request = new UnityWebRequest(url, "PUT");
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            request.SetRequestHeader("Authorization", $"Bearer {token}");

            try
            {
                await request.SendWebRequest();

                string jsonResponse = request.downloadHandler.text;
                var wrapper = JsonUtility.FromJson<ResponseWrapper<T>>(jsonResponse);
                if (wrapper != null && wrapper.success) return wrapper.data;

                Debug.LogError($"[API] Server Logic Error: {wrapper?.error}");
                return default;
            }
            catch (Exception e)
            {
                // Bắt Kicked tại đây
                if (CheckForKickedStatus(request)) return default;

                Debug.LogError($"[API Error] {e.Message}");
                throw;
            }
        }
        private bool CheckForKickedStatus(UnityWebRequest request)
        {
            if (request.responseCode == 401)
            {
                try
                {
                    string rawResponse = request.downloadHandler.text;
                    var errorData = JsonUtility.FromJson<ErrorResponseDTO>(rawResponse);
                    if (errorData != null && errorData.isKicked)
                    {
                        // Gọi vệ sĩ đá khách
                        HandleKickOut(errorData.message).Forget();
                        return true; // TRẢ VỀ TRUE ĐỂ BÁO LÀ ĐÃ BỊ KICK
                    }
                }
                catch { }
            }
            return false; // Bình thường, không bị kick
        }

        private async UniTaskVoid HandleKickOut(string msg)
        {
            // 1. Hiện thông báo ngay lập tức
            if (_globalUI != null) _globalUI.ShowError("Security Alert", msg);

            // 2. Xóa Token
            _session.Clear();
            PlayerPrefs.DeleteKey("AccessToken");
            PlayerPrefs.Save();

            // 3. Ngắt mạng Photon
            if (Photon.Pun.PhotonNetwork.IsConnected) Photon.Pun.PhotonNetwork.Disconnect();

            // 4. CHỜ 3 GIÂY ĐỂ NGƯỜI CHƠI ĐỌC CHỮ RỒI MỚI CHUYỂN CẢNH
            // Nếu sếp chuyển cảnh ngay là cái Popup nó biến mất theo Scene cũ đó!
            await UniTask.Delay(3000);

            _sceneLoader.LoadSceneAsync("LoginScene").Forget();
        }
    }
}