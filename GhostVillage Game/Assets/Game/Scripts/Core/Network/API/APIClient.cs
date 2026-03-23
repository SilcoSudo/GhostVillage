using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using System;
using Game.ScriptableObjects.GameConfig;
using System.Text;

namespace Game.Core.Network.API
{
    public class APIClient
    {
        private readonly GameConfigSO _config; // Biến lưu config
        private readonly string _baseUrl;

        // Constructor Injection: VContainer sẽ tự điền config vào đây
        public APIClient(GameConfigSO config)
        {
            _config = config;
            _baseUrl = _config.ServerUrl; // Lấy URL từ ScriptableObject

            if (_config.IsDebugMode)
            {
                Debug.Log($"[APIClient] Init with URL: {_baseUrl}");
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

        // 3. Hàm GET Generic
        public async UniTask<T> GetAsync<T>(string endpoint)
        {
            // Xử lý nối chuỗi URL an toàn (tránh bị 2 dấu //)
            string url = $"{_baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";

            if (_config.IsDebugMode) Debug.Log($"[API] GET Request: {url}");

            using (var request = UnityWebRequest.Get(url))
            {
                // Gửi request và chờ (await) bằng UniTask
                await request.SendWebRequest();

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
                    Debug.LogError($"[API] Parse JSON Error: {e.Message}");
                    return default;
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
        public async UniTask<T> GetAsyncWithAuth<T>(string endpoint, string token)
        {
            string url = $"{_baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
            using var request = UnityWebRequest.Get(url);
            request.SetRequestHeader("Authorization", $"Bearer {token.Trim()}");

            try
            {
                await request.SendWebRequest();
                string jsonResponse = request.downloadHandler.text;

                // BƯỚC 1: Parse lớp vỏ success trước để kiểm tra
                var baseResponse = JsonUtility.FromJson<ResponseWrapper<string>>(jsonResponse);
                if (baseResponse == null || !baseResponse.success) return default;

                // BƯỚC 2: "Bóc" lấy nội dung bên trong trường 'data' và parse riêng
                // Vì JsonUtility yếu với Generics, ta cần parse thẳng vào kiểu T
                string dataJson = ExtractDataField(jsonResponse);
                return JsonUtility.FromJson<T>(dataJson);
            }
            catch (Exception e)
            {
                Debug.LogError($"[API Error] {e.Message}");
                return default;
            }
        }

        // Hàm hỗ trợ bóc tách trường "data" từ JSON thô
        private string ExtractDataField(string json)
        {
            // Tìm vị trí của "data": và bóc nội dung sau đó
            int dataIdx = json.IndexOf("\"data\":");
            if (dataIdx == -1) return "{}";

            int start = dataIdx + 7;
            int end = json.LastIndexOf("}");
            return json.Substring(start, end - start);
        }

        // Hàm POST Generic (Thêm đoạn này vào)
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
                    Debug.LogError($"[API] Parse JSON Error: {e.Message}");
                    return default;
                }
            }
        }

        /// <summary>
        /// POST request with Authorization header (for authenticated endpoints)
        /// </summary>
        public async UniTask<T> PostAsyncWithAuth<T>(string endpoint, string jsonBody, string token)
        {
            string url = $"{_baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";

            if (_config.IsDebugMode)
                Debug.Log($"[API] POST (Auth) Request: {url} | Token: {token?.Substring(0, 10)}...");

            using (var request = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {token}");

                await request.SendWebRequest();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogError($"[API] Error: {request.error} | Response: {request.downloadHandler.text}");
                    return default;
                }

                string jsonResponse = request.downloadHandler.text;

                try
                {
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
                    Debug.LogError($"[API] Parse JSON Error: {e.Message}");
                    return default;
                }
            }
        }

        public async UniTask<string> GetRawJsonWithAuth(string endpoint, string token)
        {
            string url = $"{_baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
            using var request = UnityWebRequest.Get(url);
            request.SetRequestHeader("Authorization", $"Bearer {token.Trim()}");

            try
            {
                await request.SendWebRequest();
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
        public async UniTask<T> PutAsyncWithAuth<T>(string endpoint, string jsonBody, string token)
        {
            string url = $"{_baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";

            if (_config.IsDebugMode)
                Debug.Log($"[API] PUT (Auth) Request: {url} | Token: {token?.Substring(0, 10)}...");

            using (var request = new UnityWebRequest(url, "PUT"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {token}");

                await request.SendWebRequest();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogError($"[API] Error: {request.error} | Response: {request.downloadHandler.text}");
                    return default;
                }

                string jsonResponse = request.downloadHandler.text;

                try
                {
                    var wrapper = JsonUtility.FromJson<ResponseWrapper<T>>(jsonResponse);

                    if (wrapper != null && wrapper.success) return wrapper.data;
                    
                    Debug.LogError($"[API] Server Logic Error: {wrapper?.error}");
                    return default;
                }
                catch (Exception e)
                {
                    Debug.LogError($"[API] Parse JSON Error: {e.Message}");
                    return default;
                }
            }
        }
    }
}