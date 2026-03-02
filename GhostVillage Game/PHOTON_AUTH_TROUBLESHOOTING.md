# 🔐 PHOTON AUTHENTICATION TROUBLESHOOTING GUIDE

## 📍 Lỗi Hiện Tại

```
❌ "Authenticate without Token is only allowed on Name Server"
❌ "OpAuthenticate failed. ReturnCode: 32736"
❌ Timeout 15 giây
```

---

## 🔍 DIAGNOSIS STEPS

### **Step 1: Add Diagnostic Script**

1. Mở Unity Editor
2. Tạo empty GameObject: `PhotonDiagnostics`
3. Thêm component `PhotonAuthDiagnostics` vào
4. Chạy game
5. Bấm phím **D** để print diagnostic info

---

### **Step 2: Check Backend Token Format**

```csharp
// Thêm vào LoginController trước khi gọi Photon
Debug.Log($"[AUTH] Token from API:");
Debug.Log($"  Type: {response.token?.GetType().Name ?? "null"}");
Debug.Log($"  Length: {response.token?.Length ?? 0}");
Debug.Log($"  Preview: {response.token?.Substring(0, Mathf.Min(50, response.token.Length))}");
Debug.Log($"  Contains '.': {response.token?.Contains(".") ?? false}");  // JWT format check
Debug.Log($"  Is empty: {string.IsNullOrWhiteSpace(response.token)}");
```

**Expected:**

- Token length: > 50 characters
- JWT format: 3 parts separated by `.` (header.payload.signature)
- Not null/empty/whitespace

---

### **Step 3: Verify Photon Dashboard Settings**

**Check on Photon Dashboard (dashboard.photonengine.com):**

1. **Go to your App → Settings**
   - [ ] AppID matches `54437dd2-f377-4b2d-9061-5c3094e6fbb3` ✓
   - [ ] Region: `asia` ✓

2. **Authentication Settings**
   - [ ] Check if "Custom Authentication" is **enabled**
   - [ ] Check auth backend URL (if enabled)
   - [ ] Check auth token format requirement

3. **Free vs Paid**
   - Free tier: May have limitations on Custom Auth
   - Check if Custom Auth is available for your plan

---

### **Step 4: Check PhotonServerSettings.asset**

**Current settings:**

```yaml
UseNameServer: 1 # ← Route through Name Server
AuthMode: 0 # ← Auth mode (0 = default)
AppVersion: 1.0 # ← Needs to match all clients
```

**Possible fix:** Try disabling Custom Auth temporarily:

```yaml
AuthMode: -1 # OR disable Custom Auth completely
```

---

## 🚨 ROOT CAUSE ANALYSIS

### **Scenario A: Token is NULL/EMPTY**

```
Problem: response.token is null or empty
Effect: Can't authenticate
Fix: Check API response, ensure login endpoint returns token
```

### **Scenario B: Token Format Invalid**

```
Problem: Token is string but not JWT or expected format
Effect: Server rejects token
Fix: Verify backend token format with API team
```

### **Scenario C: Photon Dashboard Custom Auth Conflict**

```
Problem: Dashboard has conflicting auth settings
Effect: Server says "no auth on MasterServer, only on NameServer"
Fix: Align Photon Dashboard settings with code
```

### **Scenario D: AppVersion Mismatch**

```
Problem: AppVersion in code ≠ AppVersion on Photon Dashboard
Effect: Connection rejected
Fix: Ensure all clients use same AppVersion (currently "1.0")
```

### **Scenario E: AuthMode Mismatch**

```
Problem: AuthMode in code doesn't match Photon server expectation
Effect: Different auth flows expected
Fix: Check Photon server logs for expected AuthMode
```

---

## 🔧 QUICK FIXES TO TRY

### **Fix 1: Disable Custom Auth Temporarily**

_To test if token is the problem:_

```csharp
// PhotonNetworkManager.cs - Line 60
PhotonNetwork.AuthValues = null;  // Don't send token
PhotonNetwork.ConnectUsingSettings();
```

**Expected result:**

- If connects without error → Token is the problem
- If still fails → Problem is elsewhere (AppID, AppVersion, etc.)

---

### **Fix 2: Change AuthMode**

```csharp
// Try different AuthMode values
PhotonNetwork.PhotonServerSettings.AppSettings.AuthMode = -1;  // Disable auth
// OR
PhotonNetwork.PhotonServerSettings.AppSettings.AuthMode = 1;   // Try mode 1
```

---

### **Fix 3: Use NickName Instead of Token**

_As a fallback (not recommended, less secure):_

```csharp
PhotonNetwork.AuthValues = new AuthenticationValues(nickName);  // Use nickname
```

---

### **Fix 4: Check AppVersion Consistency**

```csharp
// All three must match:
PhotonNetwork.PhotonServerSettings.AppSettings.AppVersion = "1.0";  // Code
// PhotonServerSettings.asset AppVersion = "1.0"  // Asset file
// Photon Dashboard AppVersion (if specified)
```

---

## 📋 INFORMATION TO GATHER

When reporting the issue, collect:

```
1. Console logs from PhotonAuthDiagnostics (press D in game)
2. Backend API response token (with first 20 chars visible)
3. Photon Dashboard Custom Auth settings screenshot
4. PhotonServerSettings.asset content
5. Complete authentication flow logs
```

**Format:**

```
=== DEBUG INFO ===
Token from API: eyJhbGc... (length: 152)
Token format: JWT? YES/NO
PhotonAuthValues.UserId: [preview]
PhotonNetwork.NetworkClientState: [state]
AppVersion: 1.0
UseNameServer: 1
AuthMode: 0
OnConnectedToMaster called: YES/NO
OnCustomAuthenticationFailed called: YES/NO
Error message: [exact error]
=================
```

---

## 🎯 RECOMMENDED NEXT STEPS

### **Immediate Actions:**

1. ✅ Add `PhotonAuthDiagnostics` script
2. ✅ Run game & press **D** to see detailed info
3. ✅ Screenshot all diagnostic output
4. ✅ Check if `response.token` is null/empty
5. ✅ Verify Photon Dashboard Custom Auth settings

### **If Token is NULL:**

```
→ Issue is with Backend API
→ Check LoginResponseDTO mapping
→ Verify API endpoint returns token field
→ Debug LoginController to see actual response
```

### **If Token is NOT NULL but still fails:**

```
→ Issue could be:
  1. Token format (need JWT format?)
  2. Photon Dashboard Custom Auth config
  3. Auth token expiry
  4. AppID/AppVersion mismatch
```

### **If everything looks OK:**

```
→ Try Fix 1: Disable Custom Auth (set AuthValues = null)
→ If works → Token/Auth is problem
→ If fails → Problem is AppID/AppVersion/Network config
```

---

## 📞 ADDITIONAL RESOURCES

- **Photon Dashboard:** https://dashboard.photonengine.com
- **Photon Docs:** https://doc.photonengine.com/en-us/pun/current
- **Custom Auth Guide:** https://doc.photonengine.com/en-us/realtime/current/authentication/custom-authentication

---

## ✅ SUCCESS INDICATORS

When it works, you should see:

```
✅ [Photon] Bắt đầu kết nối Server...
✅ [Photon] Custom authentication successful!
✅ [Photon] Connected to Master.
✅ [Photon] Joined Lobby.
```

Not:

```
❌ Authenticate without Token is only allowed on Name Server
❌ OpAuthenticate failed
❌ Timeout
```
