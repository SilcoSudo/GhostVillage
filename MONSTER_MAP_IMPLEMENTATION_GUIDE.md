# Monster & Map Management Implementation Guide

## 📋 Tổng quan

Hệ thống quản lý Quái vật (Monster Management) và Bản đồ (Map Management) đã được triển khai đầy đủ với:
- ✅ Backend API (Node.js + Express + MongoDB)
- ✅ Frontend Components (React + Tailwind CSS)
- ✅ Seed Data để test
- ✅ Xử lý lỗi hoàn chỉnh

---

## 🗂️ Cấu trúc File

### Backend

```
backend/
├── src/
│   ├── modules/
│   │   ├── monster/
│   │   │   ├── monsterModel.js          # Schema Monster
│   │   │   ├── monsterController.js     # Controller xử lý logic
│   │   │   └── monsterRoutes.js         # Routes định nghĩa endpoints
│   │   └── map/
│   │       ├── mapConfigModel.js        # Schema Map (đã cập nhật)
│   │       ├── mapController.js         # Controller (đã mở rộng)
│   │       ├── mapRoute.js              # Routes (đã mở rộng)
│   │       └── mapService.js
│   └── routes.js                        # Root routes (đã thêm monster)
├── seedMonster.js                       # Seed data cho Monster
└── seedMap.js                           # Seed data cho Map
```

### Frontend

```
GhostVillage Web/admin/src/
├── shared/
│   └── services/
│       ├── monsterService.js            # API service cho Monster
│       └── mapService.js                # API service cho Map
├── pages/
│   ├── MonsterManagementPage.jsx       # Trang quản lý Monster
│   ├── MapManagementPage.jsx           # Trang quản lý Map
│   └── components/
│       ├── EditMonsterModal.jsx        # Modal edit Monster
│       ├── CreateMonsterModal.jsx      # Modal tạo Monster
│       ├── EditMapModal.jsx            # Modal edit Map
│       ├── ToggleSwitch.jsx            # Component toggle switch
│       └── DeleteConfirmModal.jsx      # Modal xác nhận xóa (reusable)
```

---

## 🚀 Hướng dẫn Deployment

### 1. Backend Setup

#### Bước 1: Seed Database

```bash
# Di chuyển vào thư mục backend
cd backend

# Seed Monster data
node seedMonster.js

# Seed Map data
node seedMap.js
```

**Output mong đợi:**
```
🔗 Connected to MongoDB
🗑️  Cleared existing monsters
✅ Successfully seeded 12 monsters
```

#### Bước 2: Khởi động Backend Server

```bash
# Nếu đã có server đang chạy, restart lại
npm start
# hoặc
node src/server.js
```

**Verify:** Check http://localhost:5000/api/monsters và http://localhost:5000/api/maps

---

### 2. Frontend Setup

#### Bước 1: Cập nhật Routes (nếu cần)

Thêm routes cho 2 trang mới vào router config của admin panel.

**Ví dụ (trong App.jsx hoặc router config):**

```jsx
import MonsterManagementPage from './pages/MonsterManagementPage';
import MapManagementPage from './pages/MapManagementPage';

// Trong routes
<Route path="/monsters" element={<MonsterManagementPage />} />
<Route path="/maps" element={<MapManagementPage />} />
```

#### Bước 2: Cập nhật Navigation/Sidebar

Thêm links điều hướng đến 2 trang mới.

```jsx
// Trong Sidebar/Navigation component
<NavLink to="/monsters">
  <MonsterIcon /> Quản lý Quái Vật
</NavLink>
<NavLink to="/maps">
  <MapIcon /> Quản lý Bản Đồ
</NavLink>
```

---

## 📡 API Endpoints

### Monster Management

| Method | Endpoint | Mô tả | Body |
|--------|----------|-------|------|
| GET | `/api/monsters` | Lấy danh sách quái vật | Query: `page`, `limit`, `isActive` |
| GET | `/api/monsters/:id` | Lấy chi tiết một quái vật | - |
| POST | `/api/monsters` | Tạo quái vật mới | `{ name, avatar, hp, atk, def, spawnRate }` |
| PUT | `/api/monsters/:id` | Cập nhật quái vật | `{ name, avatar, hp, atk, def, spawnRate }` |
| PATCH | `/api/monsters/:id/status` | Toggle status | `{ isActive: boolean }` |
| DELETE | `/api/monsters/:id` | Xóa quái vật (soft delete) | - |

### Map Management

| Method | Endpoint | Mô tả | Body |
|--------|----------|-------|------|
| GET | `/api/maps` | Lấy danh sách maps | Query: `isActive` |
| GET | `/api/maps/:id` | Lấy chi tiết một map | - |
| PATCH | `/api/maps/:id/status` | Toggle status | `{ isActive: boolean }` |
| PUT | `/api/maps/:id` | Cập nhật metadata | `{ displayName, requiredLevel, shortDescription, thumbnailUrl }` |

---

## 🎯 Cách Sử dụng

### Monster Management

1. **Xem danh sách**: Truy cập trang Monster Management
2. **Tìm kiếm**: Dùng search box để tìm theo tên
3. **Lọc**: Dùng filter dropdown để lọc theo trạng thái
4. **Toggle Status**: Click vào badge trạng thái để bật/tắt
5. **Chỉnh sửa**: Click nút Edit → Nhập thông tin → Save
6. **Tạo mới**: Click "Thêm quái vật" → Điền form → Tạo
7. **Xóa**: Click nút Delete → Xác nhận

### Map Management

1. **Xem danh sách**: Maps hiển thị dạng card grid
2. **Tìm kiếm**: Search theo tên, ID, hoặc mô tả
3. **Lọc**: Filter theo trạng thái active/inactive
4. **Toggle Status**: Dùng toggle switch trong mỗi card
5. **Chỉnh sửa**: Click "Sửa" → Cập nhật metadata → Save

---

## 🔧 Xử lý lỗi

### Backend

Tất cả API đều có try-catch và trả về format:

```json
// Success
{
  "success": true,
  "message": "...",
  "data": {...}
}

// Error
{
  "success": false,
  "message": "Lỗi...",
  "error": "Chi tiết lỗi"
}
```

### Frontend

- Loading state với spinner
- Error message hiển thị rõ ràng
- Validation trước khi submit
- Toast/Alert khi thao tác thành công

---

## 📊 Database Schema

### Monster

```javascript
{
  name: String,          // Tên quái vật
  avatar: String,        // URL avatar
  hp: Number,            // Health Points (min: 1)
  atk: Number,           // Attack (min: 0)
  def: Number,           // Defense (min: 0)
  spawnRate: Number,     // Tỷ lệ xuất hiện 0-100%
  isActive: Boolean,     // Trạng thái
  createdAt: Date,       // Tự động
  updatedAt: Date        // Tự động
}
```

### Map (identityConfig)

```javascript
{
  identityConfig: {
    mapId: String,           // ID duy nhất
    sceneName: String,       // Tên scene Unity
    displayName: String,     // Tên hiển thị
    thumbnailUrl: String,    // URL thumbnail
    shortDescription: String, // Mô tả ngắn
    requiredLevel: Number,   // Cấp độ yêu cầu (min: 1)
    isActive: Boolean        // Trạng thái
  },
  // ... các config khác
}
```

---

## 🧪 Testing

### Test Backend API với cURL/Postman

```bash
# Get all monsters
curl http://localhost:5000/api/monsters

# Update monster
curl -X PUT http://localhost:5000/api/monsters/{id} \
  -H "Content-Type: application/json" \
  -d '{"hp": 150, "atk": 20}'

# Toggle monster status
curl -X PATCH http://localhost:5000/api/monsters/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### Test Frontend

1. Kiểm tra UI responsive
2. Test tất cả CRUD operations
3. Verify state updates realtime
4. Check error handling

---

## 🎨 UI Components

### MonsterManagementPage
- Table view với tất cả thông tin
- Search & Filter
- Inline status toggle
- Modal-based editing

### MapManagementPage
- Card grid view (responsive)
- Visual thumbnail
- Toggle switch cho status
- Modal-based editing

### Shared Components
- EditMonsterModal
- CreateMonsterModal
- EditMapModal
- ToggleSwitch (reusable)
- DeleteConfirmModal (reusable)

---

## ⚙️ Customize

### Thêm field mới vào Monster

1. Update Model (`monsterModel.js`)
2. Update Controller validation
3. Update Service method
4. Update Form UI (Modal)
5. Update Table display

### Thêm field mới vào Map

1. Update Model (`mapConfigModel.js`) trong `identityConfig`
2. Update Controller
3. Update Service method
4. Update Form UI (EditMapModal)
5. Update Card display

---

## 🐛 Troubleshooting

### Backend không chạy
- Check MongoDB đã chạy chưa
- Verify MONGODB_URI trong .env
- Check port 5000 có bị chiếm không

### Frontend không kết nối được API
- Verify VITE_API_URL trong .env
- Check CORS settings
- Check Network tab trong DevTools

### Seed data không chạy
- Verify MongoDB connection string
- Check models đã import đúng chưa
- Xem log error chi tiết

---

## 📝 Notes

- Monster sử dụng **soft delete** (set isActive = false)
- Map status update là **instant** (không reload trang)
- Tất cả số liệu đều có validation cả client và server
- Image URLs có fallback khi load lỗi
- Pagination đã implement cho Monster (20 items/page)

---

## 🤝 Contribution

Để mở rộng thêm tính năng:
1. Thêm bulk operations (delete nhiều, update nhiều)
2. Export/Import CSV
3. Advanced filtering & sorting
4. Image upload thay vì URL
5. Audit log cho changes

---

## 📞 Support

Nếu gặp vấn đề, check:
1. Console logs (both browser & terminal)
2. Network requests trong DevTools
3. Database records trong MongoDB Compass
4. API response format

---

**Chúc bạn triển khai thành công! 🎉**
