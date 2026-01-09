using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using System;
using Game.ScriptableObjects.GameConfig;

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
                // Debug.Log($"[API] Response: {jsonResponse}");

                try
                {
                    // 4. Parse lớp vỏ bên ngoài trước
                    var wrapper = JsonUtility.FromJson<ResponseWrapper<T>>(jsonResponse);

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
    }
}