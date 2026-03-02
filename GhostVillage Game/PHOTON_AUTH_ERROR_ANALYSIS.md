# 🔴 Phân Tích Lỗi Photon Authentication

## 📋 Lỗi Hiện Tại

```
❌ Authenticate without Token is only allowed on Name Server
❌ OpAuthenticate failed. ReturnCode: 32736 (No auth request during expected wait time)
❌ Kết nối Server thất bại (Timeout 15 giây)
```

---

## 🔍 Nguyên Nhân Gốc (Root Causes)

### **1️⃣ Token Backend không được lưu trữ**

**File:** `PlayerDataStore.cs`

```csharp
// ❌ Hiện tại: Chỉ lưu player profile, KHÔNG lưu token
public void Initialize(LoginResponseDTO data)
{
    if (data?.player?.profile == null) return;
    var profile = data.player.profile;
    DisplayName.Value = profile.displayName;
    Level.Value = profile.level;
    // ... nhưng TOKEN đâu??? 🤔
}

// ✅ LoginResponseDTO chứa:
// public string token;            // <-- CÓ NHƯNG KHÔNG LƯU
// public UserDTO user;
// public PlayerDTO player;
```

---

### **2️⃣ PhotonNetworkManager dùng Token ngẫu nhiên thay vì Backend Token**

**File:** `PhotonNetworkManager.cs` - dòng 52

```csharp
// ❌ WRONG: Tạo GUID ngẫu nhiên thay vì dùng token từ API
PhotonNetwork.AuthValues = new AuthenticationValues(Guid.NewGuid().ToString());

// ✅ SHOULD BE: Dùng token thực từ backend
// PhotonNetwork.AuthValues = new AuthenticationValues(storedToken);
```

---

### **3️⃣ Cấu hình Photon bắt buộc Custom Authentication**

**File:** `PhotonServerSettings.asset`

```yaml
UseNameServer: 1 # ← Bắt buộc xác thực qua Name Server
AuthMode: 0 # ← Mong đợi Custom Authentication
AppVersion: 1.0 # ← Phiên bản app
```

**Kịch bản xảy ra:**

```
1. Game gọi: PhotonNetwork.ConnectUsingSettings()
2. Photon SDK cố kết nối đến Name Server
3. Name Server yêu cầu: "Bạn có token không?"
4. Game trả lời: "Có, token tôi là: [random GUID ngẫu nhiên]"
5. Name Server: "Token này không hợp lệ! ❌ REJECT"
6. Timeout 15 giây → Kết nối thất bại
```

---

### **4️⃣ Thiếu Custom Authentication Callback**

**File:** `PhotonNetworkManager.cs`

```csharp
// ❌ Không có callback này để xử lý từ chối authentication
// public void OnCustomAuthenticationResponse(Dictionary<string, object> data) { }
// public void OnCustomAuthenticationFailed(string debugMessage) { }
```

---

## 📊 Flow So Sánh

### ❌ **Hiện Tại (Lỗi)**

```
Backend Login
    ↓
[Token: "eyJhbGc..."]
    ↓
LoginController
    ↓
PlayerDataStore.Initialize()
    [❌ Token bị DROP, chỉ lưu player data]
    ↓
PhotonNetworkManager.ConnectAsync()
    [❌ Tạo AuthValues = GUID ngẫu nhiên]
    ↓
PhotonNetwork.ConnectUsingSettings()
    [❌ Gửi random GUID lên server]
    ↓
Photon Name Server
    [❌ "Token không hợp lệ!" → REJECT]
    ↓
Timeout 15 giây → FALSE
```

### ✅ **Nên Là (Đúng)**

```
Backend Login
    ↓
[Token: "eyJhbGc..."]
    ↓
LoginController
    ↓
PlayerDataStore.Initialize(data)
    [✅ Lưu token: data.token]
    ↓
PhotonNetworkManager.ConnectAsync(token)
    [✅ AuthValues = new AuthenticationValues(token)]
    ↓
PhotonNetwork.ConnectUsingSettings()
    [✅ Gửi token Backend lên Photon]
    ↓
Photon Name Server
    [✅ "Token hợp lệ!" → ACCEPT]
    ↓
OnConnectedToMaster() → TRUE
```

---

## 🛠️ Giải Pháp Chi Tiết

### **Bước 1: Lưu Token vào PlayerDataStore**

**File:** `PlayerDataStore.cs`

```csharp
public class PlayerDataStore
{
    public readonly ReactiveProperty<string> DisplayName = new("");
    public readonly ReactiveProperty<string> AuthToken = new("");  // ✅ NEW
    public readonly ReactiveProperty<int> Level = new(1);
    // ...

    public void Initialize(LoginResponseDTO data)
    {
        if (data?.player?.profile == null) return;

        // ✅ LƯU TOKEN
        AuthToken.Value = data.token ?? "";

        var profile = data.player.profile;
        DisplayName.Value = profile.displayName;
        Level.Value = profile.level;
    }

    public void Clear()
    {
        DisplayName.Value = "";
        AuthToken.Value = "";  // ✅ Clear token when logout
        // ...
    }
}
```

---

### **Bước 2: Cập nhật Interface INetworkService**

**File:** `INetworkService.cs`

```csharp
public interface INetworkService
{
    UniTask<bool> ConnectAsync(string nickName, string token);  // ✅ Thêm token parameter
    // ...
}
```

---

### **Bước 3: Cập nhật PhotonNetworkManager**

**File:** `PhotonNetworkManager.cs`

```csharp
public async UniTask<bool> ConnectAsync(string nickName, string token)
{
    if (PhotonNetwork.IsConnectedAndReady) return true;

    PhotonNetwork.NickName = nickName;

    // ✅ SỬ DỤNG TOKEN THỰC TỬ BACKEND
    if (string.IsNullOrEmpty(token))
    {
        Debug.LogError("[Photon] Token is null or empty!");
        return false;
    }

    PhotonNetwork.AuthValues = new AuthenticationValues(token);
    PhotonNetwork.PhotonServerSettings.AppSettings.AppVersion = "1.0";
    PhotonNetwork.AutomaticallySyncScene = true;

    Debug.Log($"[Photon] Connecting with token: {token.Substring(0, 10)}...");
    PhotonNetwork.ConnectUsingSettings();

    // Timeout handling...
}

// ✅ THÊM CALLBACKS CHO CUSTOM AUTHENTICATION
public void OnCustomAuthenticationResponse(Dictionary<string, object> data)
{
    Debug.Log("[Photon] Custom authentication successful!");
}

public void OnCustomAuthenticationFailed(string debugMessage)
{
    Debug.LogError($"[Photon] Custom authentication failed: {debugMessage}");
}
```

---

### **Bước 4: Cập nhật LoginController**

**File:** `LoginController.cs`

```csharp
public async void HandleLogin(string email, string password, LoginUIManager view)
{
    var response = await _authService.LoginAsync(email, password);

    if (response != null && !string.IsNullOrEmpty(response.token))
    {
        // ✅ LƯU DỮ LIỆU VÀ TOKEN
        _syncService.SyncAllDataAsync(response);

        // ✅ TRUYỀN TOKEN SANG PHOTON
        string nickName = response.player?.profile?.displayName ?? "Player_" + Random.Range(1000, 9999);
        bool connected = await _network.ConnectAsync(nickName, response.token);  // ✅ Truyền token

        if (connected)
        {
            await _sceneLoader.LoadSceneAsync("MainMenu");
        }
    }
}
```

---

### **Bước 5: Cập nhật AppManager**

**File:** `AppManager.cs`

```csharp
private async UniTaskVoid RunFlow()
{
    if (_store.IsLoggedIn)
    {
        // ✅ LẤY TOKEN TỪ STORE
        string token = _store.AuthToken.Value;

        bool connected = await _network.ConnectAsync(
            _store.DisplayName.Value,
            token  // ✅ Truyền token
        );

        if (!connected)
        {
            // Token hết hạn? Cần login lại
            await _sceneLoader.LoadSceneAsync("LoginScene");
        }
    }
}
```

---

## ⚠️ Các Điểm Cần Lưu Ý

### **1. Photon Server Configuration**

```
✅ Kiểm tra trên Photon Dashboard:
- AppID (Realtime): 54437dd2-f377-4b2d-9061-5c3094e6fbb3 (khớp chứ?)
- Enable Custom Authentication: ON?
- Authentication Tokens type: JWT hoặc other?
```

### **2. Backend API Expected Format**

```
⚠️ Cần confirm:
- Token format: JWT, Bearer token, hay Session ID?
- Token lifetime: Bao lâu hết hạn?
- Photon server có accept token này không?
```

### **3. Token Expiration Handling**

```
⚠️ Cần thêm logic xử lý:
- Nếu Photon reject token → Token hết hạn?
- Cần refresh token?
- Hoặc yêu cầu user login lại?
```

---

## 📝 Checklist Giải Quyết

- [ ] Bước 1: Thêm `AuthToken` vào `PlayerDataStore`
- [ ] Bước 2: Update `INetworkService` interface thêm token parameter
- [ ] Bước 3: Update `PhotonNetworkManager.ConnectAsync(nickName, token)`
- [ ] Bước 4: Add Custom Authentication callbacks vào `PhotonNetworkManager`
- [ ] Bước 5: Update `LoginController` để truyền token
- [ ] Bước 6: Update `AppManager` để truyền token từ store
- [ ] Bước 7: Test authentication flow

---

## 🧪 Testing Steps

```csharp
// 1. Debug: In ra token từ backend
Debug.Log($"[Login] Token from API: {response.token}");

// 2. Debug: Kiểm tra token được lưu
Debug.Log($"[Store] Stored token: {_store.AuthToken.Value}");

// 3. Debug: Kiểm tra token được gửi tới Photon
Debug.Log($"[Photon] Auth token used: {PhotonNetwork.AuthValues.UserId}");

// 4. Monitor Photon callbacks:
// - OnConnectedToMaster() = thành công
// - OnCustomAuthenticationFailed() = lỗi xác thực
// - OnJoinedLobby() = đã vào lobby
```

---

## 🎯 Kết Luận

**Vấn đề chính:** Token từ backend không được lưu và sử dụng, thay vào đó dùng random GUID → Photon server từ chối

**Giải pháp:** Lưu token và truyền nó qua toàn bộ flow: Backend → Store → Photon

**Ước tính): 1-2 tiếng implement + test**
