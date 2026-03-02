# 🔴 PHOTON AUTH ERROR - DETAILED ANALYSIS

## Lỗi Được Nhận

```
❌ "Authenticate without Token is only allowed on Name Server.
    Connecting to: MasterServer on: 91.243.81.149:4530.
    State: ConnectingToMasterServer"
```

---

## 📍 Phân Tích Lỗi

### **Phần 1: Lỗi Msg Breakdown**

```
"Authenticate without Token is only allowed on Name Server"
 ↑                    ↑        ↑
 1. Verb             2. Negation  3. Constraint
```

**Dịch:** "Xác thực KHÔNG có Token chỉ được phép trên Name Server"

### **Phần 2: Ngữ Cảnh**

```
"Connecting to: MasterServer on: 91.243.81.149:4530"
```

**Dịch:** Đang kết nối đến MasterServer (không phải Name Server)

### **Phần 3: Trạng Thái**

```
"State: ConnectingToMasterServer"
```

Game đang cố kết nối trực tiếp tới MasterServer

---

## 🎯 Vấn Đề Nuansa

Lỗi này rất kỳ quặc vì:

```
┌─────────────────────────────────────────────────────────┐
│  Photon Server Error Message Analysis:                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Server says: "Auth without Token only on NameServer"   │
│                                                          │
│  Which means:                                           │
│  • If using Auth → Must go through NameServer           │
│  • NameServer routes properly to MasterServer           │
│  • But game trying to connect to MasterServer directly  │
│                                                          │
│  Conflict: UseNameServer=1 nhưng flow sai?             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 5 Khả Năng Gốc

### **Problem 1: cấu hình Photon Dashboard**

**Symptom:** Server reject auth on MasterServer

**Root Cause:**

- [ ] Custom Authentication **DISABLED** trên Photon Dashboard
- [ ] Hoặc Custom Auth **ENABLED** nhưng cấu hình NameServer only

**Test:**

```
Go to Photon Dashboard → Your App → Settings
✓ Check "Custom Authentication" status
✓ Check if auth backend is configured correctly
```

---

### **Problem 2: Token Format Invalid**

**Symptom:** Token không được Photon server nhận dạng

**Root Cause:**

```
Backend sends: { "token": "my-simple-token-123" }
Photon expects: { "token": "[JWT-FORMAT]" } or { "token": "[BASE64]" }

Mismatch → Token bị reject
```

**Test:**

```csharp
// Check token format:
if (response.token.Contains("."))
    Debug.Log("✓ Looks like JWT");  // JWT = 3 parts: header.payload.signature
else
    Debug.Log("✗ NOT JWT format standard");
```

---

### **Problem 3: Backend API không cấp Token**

**Symptom:** response.token = null hoặc empty

**Root Cause:**

```
LoginResponseDTO {
    token: null,        // ← EMPTY!
    user: {...},
    player: {...}
}
```

**Test:**

```csharp
if (string.IsNullOrEmpty(response.token))
    Debug.LogError("❌ API did NOT return token!");
```

---

### **Problem 4: UseNameServer Config Wrong**

**Symptom:** NameServer routing không normalize đúng

**Current Config:**

```yaml
UseNameServer: 1          ← Phải route qua NameServer
AuthMode: 0               ← Default auth mode
```

**Potential Issue:**

```
✓ UseNameServer = 1 means: NameServer → determinstic MasterServer route
✗ But token flow might be:
   Game → MasterServer directly (bypass NameServer)
   MasterServer → Reject (không expect token ở đây)
```

---

### **Problem 5: AppID + Settings Mismatch**

**Symptom:** AppID trên game ≠ AppID trên Photon Dashboard

**Current:**

```csharp
AppIdRealtime: 54437dd2-f377-4b2d-9061-5c3094e6fbb3
```

**Check:**

```
Photon Dashboard → Your App → Settings
✓ AppID matches?
✓ Custom Auth enabled for this AppID?
✓ Auth backend configured for this AppID?
```

---

## 🧪 DIAGNOSIS PLAN

### **Phase 1: Token Validation (5-10 min)**

```csharp
// 1. Check if backend returns token
if (response.token == null)
    → Blame Backend API team

// 2. Check token format
if (response.token.Contains("."))
    → Likely JWT, good!
else
    → Might be invalid format

// 3. Check token length
if (response.token.Length < 20)
    → Too short, likely invalid

// 4. Check for special chars
if (response.token.Contains(" ") || response.token.Contains("\n"))
    → Malformed token
```

### **Phase 2: Photon Config (2-5 min)**

```
✓ Open Photon Dashboard
✓ Check Custom Authentication status
✓ Verify AppID matches code
✓ Check auth backend settings
✓ Note any warnings/errors
```

### **Phase 3: Test Scenarios (5-15 min)**

1. **Test A:** Connect WITH token
   - If fails with same error → Problem not token
   - If fails with different error → Problem might be token

2. **Test B:** Connect WITHOUT token (AuthValues = null)
   - If works → Custom Auth is mandatory (expected)
   - If works without error → Auth config different from expected

3. **Test C:** Use NickName as auth instead
   - If works → Token specifically rejected
   - If fails → Server expects something else entirely

---

## 💡 MOST LIKELY SCENARIO

Based on error message, my best guess:

```
┌──────────────────────────────────────────────────┐
│ HYPOTHESIS: Photon Dashboard Custom Auth issue   │
├──────────────────────────────────────────────────┤
│                                                   │
│ Scenario:                                        │
│ • Backend CAN send tokens                        │
│ • But Photon Dashboard NOT configured for auth   │
│ • OR Custom Auth backend NOT enabled             │
│ • OR AppID doesn't have custom auth enabled      │
│                                                   │
│ Evidence:                                        │
│ • Clear error from Photon server                 │
│ • Not connection error (that would be timeout)   │
│ • Specific about NameServer vs MasterServer      │
│ • Server is "aware" of auth requirement          │
│                                                   │
│ Likelihood: 70%                                  │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## 🛠️ IMMEDIATE ACTION ITEMS

### **For Game Developer (YOU):**

1. **Add diagnostic scripts:**

   ```
   ✓ PhotonAuthDiagnostics.cs (already created)
   ✓ PhotonAuthTestScenarios.cs (already created)
   ```

2. **Add to scene:**

   ```
   Create empty GameObject → Add PhotonAuthDiagnostics
   Create empty GameObject → Add PhotonAuthTestScenarios
   ```

3. **Gather data:**
   ```
   ✓ Run Test Scenario A with real token
   ✓ Press D in game to see diagnostics
   ✓ Screenshot console output
   ✓ Note which test scenarios pass/fail
   ```

### **For Backend Team:**

Send them this checklist:

```
□ Can you confirm your login endpoint returns token field?
□ What's the token format? (JWT? Raw string? Base64?)
□ Is token always non-null for successful login?
□ What's the expected token length?
□ Does token contain any newlines or spaces?
□ Is token format compatible with Photon custom auth?
```

### **For Photon Support (if needed):**

Send them:

```
□ AppID: 54437dd2-f377-4b2d-9061-5c3094e6fbb3
□ Error message: "Authenticate without Token is only allowed..."
□ NetworkClientState when error occurs: ConnectingToMasterServer
□ Server address: 91.243.81.149:4530
□ Region: asia
□ Are custom authentication enabled for this app?
□ Screenshot of Dashboard settings
```

---

## ✅ Next Steps

1. **Create diagnostic GameObjects** ← DO THIS FIRST
2. **Run Test Scenarios** ← This will tell us EXACTLY what's wrong
3. **Gather diagnostics output** ← Screenshot everything
4. **Share results** ← We'll pinpoint exact issue
5. **Implement fix** ← Based on test results

**Estimated time:** 15-30 minutes to diagnose

---

## 📝 NOTES

- **Don't blame token yet** - Other factors could be at play
- **This is a Photon server rejection** - Very specific error message
- **Configuration > Code** - Likely a setup issue, not implementation
- **Test methodically** - Each test eliminates one possibility
