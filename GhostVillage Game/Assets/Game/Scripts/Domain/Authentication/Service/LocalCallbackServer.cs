using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Cysharp.Threading.Tasks;
using UnityEngine;

namespace Game.Domain.Authentication
{
    /// <summary>
    /// Local HTTP server to handle OAuth callbacks
    /// Runs on localhost:8888 to receive authorization code from Google
    /// </summary>
    public class LocalCallbackServer
    {
        private HttpListener _httpListener;
        private bool _isRunning;
        private readonly int _port;
        private Func<string, UniTask> _onCodeReceived;

        public LocalCallbackServer(int port = 8888)
        {
            _port = port;
        }

        /// <summary>
        /// Start the callback server with async callback
        /// </summary>
        public void Start(Func<string, UniTask> onCodeReceived)
        {
            _onCodeReceived = onCodeReceived;

            try
            {
                _httpListener = new HttpListener();
                _httpListener.Prefixes.Add($"http://localhost:{_port}/");
                _httpListener.Start();
                _isRunning = true;

                Debug.Log($"[LocalCallbackServer] Started on port {_port}");

                // Listen for requests asynchronously
                ListenAsync();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[LocalCallbackServer] Failed to start: {ex.Message}");
            }
        }

        /// <summary>
        /// Listen for incoming requests in background
        /// </summary>
        private async void ListenAsync()
        {
            while (_isRunning)
            {
                try
                {
                    HttpListenerContext context = await _httpListener.GetContextAsync();
                    ProcessRequest(context);
                }
                catch (HttpListenerException ex)
                {
                    if (ex.ErrorCode != 995) // 995 = server closed
                        Debug.LogWarning($"[LocalCallbackServer] Listen error: {ex.Message}");
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[LocalCallbackServer] Error: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Process incoming request and extract authorization code
        /// </summary>
        private async void ProcessRequest(HttpListenerContext context)
        {
            try
            {
                HttpListenerRequest request = context.Request;
                HttpListenerResponse response = context.Response;

                Debug.Log($"[LocalCallbackServer] Request: {request.RawUrl}");

                // Parse query string to get authorization code
                string authCode = request.QueryString["code"];
                string error = request.QueryString["error"];

                if (!string.IsNullOrEmpty(error))
                {
                    Debug.LogError($"[LocalCallbackServer] OAuth error: {error}");
                    SendResponse(response, $"Error: {error}", false);
                    if (_onCodeReceived != null)
                        await _onCodeReceived(null);
                    return;
                }

                if (string.IsNullOrEmpty(authCode))
                {
                    Debug.LogWarning("[LocalCallbackServer] No authorization code in callback");
                    SendResponse(response, "No authorization code received", false);
                    return;
                }

                Debug.Log($"[LocalCallbackServer] Authorization code received: {authCode.Substring(0, 10)}...");

                // Send success response to browser
                SendResponse(response, "Authorization successful! You can close this window.", true);

                // Notify controller (await the async callback)
                if (_onCodeReceived != null)
                    await _onCodeReceived(authCode);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[LocalCallbackServer] Process error: {ex.Message}");
            }
        }

        /// <summary>
        /// Send HTML response to browser
        /// </summary>
        private void SendResponse(HttpListenerResponse response, string message, bool isSuccess)
        {
            try
            {
                string html = $@"
<!DOCTYPE html>
<html>
<head>
    <title>Ghost Village - Google Login</title>
    <style>
        body {{ font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a1a; color: #fff; }}
        .container {{ text-align: center; }}
        .success {{ color: #4CAF50; }}
        .error {{ color: #f44336; }}
        h1 {{ margin-bottom: 20px; }}
    </style>
</head>
<body>
    <div class='container'>
        <h1 class='{(isSuccess ? "success" : "error")}'>{message}</h1>
        <p>Returning to game...</p>
    </div>
</body>
</html>";

                byte[] buffer = Encoding.UTF8.GetBytes(html);
                response.ContentLength64 = buffer.Length;
                response.ContentType = "text/html";
                response.OutputStream.Write(buffer, 0, buffer.Length);
                response.OutputStream.Close();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[LocalCallbackServer] Send response error: {ex.Message}");
            }
        }

        /// <summary>
        /// Stop the callback server
        /// </summary>
        public void Stop()
        {
            try
            {
                _isRunning = false;
                _httpListener?.Stop();
                _httpListener?.Close();
                Debug.Log("[LocalCallbackServer] Stopped");
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[LocalCallbackServer] Stop error: {ex.Message}");
            }
        }
    }
}
