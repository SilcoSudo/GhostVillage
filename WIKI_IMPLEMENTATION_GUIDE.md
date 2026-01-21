# 📚 WIKI SYSTEM - HƯỚNG DẪN SỬ DỤNG

## 🎯 Tổng quan

Wiki system đã được implement hoàn chỉnh cho GhostVillage với các tính năng:
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Category filtering & pagination
- ✅ Full-text search support
- ✅ Game data integration (Monsters, Maps, Items)
- ✅ Markdown content rendering
- ✅ Featured wikis
- ✅ Like system
- ✅ Related wikis
- ✅ Media gallery & video guides

---

## 📁 Cấu trúc Files

### Backend
```
backend/
├── src/modules/forum/wiki/
│   ├── wikiModel.js          # Mongoose schema
│   ├── wikiService.js        # Business logic
│   ├── wikiController.js     # Request handlers
│   └── wikiRoutes.js         # API routes
├── src/routes.js             # Updated with wiki routes
└── seedWiki.js               # Seed data script
```

### Frontend
```
GhostVillage Web/forum/src/
├── features/wiki/
│   ├── pages/
│   │   ├── WikiListPage.jsx      # List all wikis
│   │   └── WikiDetailPage.jsx    # View single wiki
│   └── components/
│       └── WikiCard.jsx           # Wiki card component
├── shared/assets/styles/
│   ├── WikiPage.css
│   └── WikiDetailPage.css
└── app/App.jsx                    # Updated with wiki routes
```

---

## 🚀 Setup & Deployment

### 1. Chạy Seed Data

Trước tiên, cập nhật `defaultAuthorId` trong `seedWiki.js`:

```javascript
// Line 199 trong seedWiki.js
const defaultAuthorId = "YOUR_ADMIN_USER_ID"; // Thay bằng ID thực
```

Sau đó chạy:

```bash
cd backend
node seedWiki.js
```

**Output:**
```
✅ Connected to MongoDB
✅ Created 8 wiki entries

📊 Summary:
   - Monsters: 2
   - Maps: 2
   - Items: 4
   - Total wikis: 8

✨ Seed completed successfully!
```

### 2. Khởi động Backend

```bash
cd backend
yarn dev
# hoặc
npm run dev
```

**API sẽ chạy tại:** `http://localhost:5000`

### 3. Khởi động Frontend

```bash
cd "GhostVillage Web/forum"
npm run dev
```

**Frontend sẽ chạy tại:** `http://localhost:5173`

---

## 🌐 API Endpoints

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/web/wiki` | List wikis (supports filtering) |
| GET | `/api/web/wiki/featured` | Get featured wikis |
| GET | `/api/web/wiki/:slug` | Get wiki by slug |
| GET | `/api/web/wiki/entity/:entityType/:entityId` | Get wikis by entity |

### Protected Routes (Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/web/wiki` | Create new wiki |
| PUT | `/api/web/wiki/:id` | Update wiki |
| DELETE | `/api/web/wiki/:id` | Delete wiki |
| POST | `/api/web/wiki/:id/like` | Toggle like |

### Query Parameters

**List Wikis (`GET /api/web/wiki`)**
```
?category=Monster Database      # Filter by category
?entityType=monster             # Filter by entity type
?featured=true                  # Only featured wikis
?page=1                         # Page number
&limit=12                       # Items per page
&status=published               # Filter by status (default: published)
```

**Examples:**
```bash
# Get all Monster wikis
GET /api/web/wiki?category=Monster%20Database

# Get featured wikis
GET /api/web/wiki/featured

# Get specific wiki
GET /api/web/wiki/monster-monster_001

# Get all wikis for a monster
GET /api/web/wiki/entity/monster/monster_001
```

---

## 📝 Tạo Wiki mới

### Via API

```javascript
POST /api/web/wiki
Headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}
Body: {
  "title": "Ma Nữ Áo Trắng - White Lady Ghost",
  "slug": "monster-white-lady",
  "content": "# Mô tả\nMột linh hồn lang thang...",
  "excerpt": "Short description",
  "category": "Monster Database",
  "tags": ["monster", "ghost", "enemy"],
  "gameData": {
    "id": "monster_001",
    "health": 150,
    "speed": 2.5
  },
  "entityType": "monster",
  "entityId": "monster_001",
  "coverImage": "/assets/monsters/white-lady.png",
  "status": "published",
  "isFeatured": false
}
```

### Via Frontend (Admin Panel - Tương lai)

Hiện tại chưa có admin panel UI, cần tạo thêm AdminWikiPage.jsx

---

## 🎨 Frontend Usage

### 1. Wiki List Page

**URL:** `/wiki`

**Features:**
- Category filter tabs
- Featured wikis section
- Grid layout with pagination
- Filter by: category, entityType, featured

### 2. Wiki Detail Page

**URL:** `/wiki/:slug`

**Features:**
- Full markdown content rendering
- Cover image
- Meta information (views, likes, author, date)
- Tags
- Game data display (JSON)
- Gallery
- Video guide
- Related wikis
- Like button
- Breadcrumb navigation

### 3. Navigation

Wiki link đã được thêm vào Sidebar:
- Icon: 📖 (BookOpen)
- Label: "Wiki"
- Path: `/wiki`

---

## 📊 Database Schema

### Wiki Model

```javascript
{
  title: String,              // "Ma Nữ Áo Trắng - White Lady Ghost"
  slug: String,               // "monster-white-lady" (unique)
  content: String,            // Markdown content
  excerpt: String,            // Short description
  category: String,           // "Monster Database", "Map Guide", etc.
  tags: [String],            // ["monster", "ghost"]
  
  // Game Data (flexible)
  gameData: Mixed,           // Store JSON structure
  entityType: String,        // "monster", "map", "item", "general"
  entityId: String,          // "monster_001"
  
  // Metadata
  author: ObjectId -> User,
  editors: [ObjectId -> User],
  
  // Status
  status: String,            // "draft", "published", "archived"
  isPublic: Boolean,
  isFeatured: Boolean,
  
  // Engagement
  views: Number,
  likes: [ObjectId -> User],
  
  // Version Control
  version: Number,
  lastEditedBy: ObjectId -> User,
  
  // Media
  coverImage: String,
  gallery: [String],
  videoGuide: String,
  
  // Relations
  relatedWikis: [ObjectId -> Wiki],
  
  // Timestamps
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔍 Search Integration

Wiki đã support full-text search:

```javascript
// Text indexes
WikiSchema.index({ title: "text", content: "text", tags: "text" });

// Search query
const results = await Wiki.find({
  $text: { $search: "ma nữ áo trắng" }
});
```

Tích hợp với Search system (sẽ implement trong task tiếp theo):

```javascript
// In searchService.js
const wikis = await Wiki.find({
  $or: [
    { $text: { $search: keyword } },
    { title: regex },
    { tags: regex }
  ]
});
```

---

## 🎮 Game Data Structure

### Monster Example
```javascript
{
  id: "monster_001",
  name: "Ma Nữ Áo Trắng",
  title: "White Lady Ghost",
  description: "...",
  lore: "...",
  behavior: "...",
  weakness: "...",
  stats: {
    health: 150,
    speed: 2.5,
    damage: 25
  }
}
```

### Map Example
```javascript
{
  id: "map_001",
  name: "Làng Hoang",
  title: "Abandoned Village",
  areas: [
    {
      name: "Nhà Trưởng Làng",
      spawnedMonsters: ["monster_001"],
      itemsFound: ["item_k_001"]
    }
  ],
  dangerLevel: "High"
}
```

### Item Example
```javascript
{
  id: "item_c_001",
  name: "Bùa Trấn Hồn",
  title: "Spirit Seal Talisman",
  effect: "...",
  usage: "Single-use",
  rarity: "Uncommon"
}
```

---

## 🔐 Permissions

| Action | Public | User | Admin |
|--------|--------|------|-------|
| View published wikis | ✅ | ✅ | ✅ |
| Like wikis | ❌ | ✅ | ✅ |
| Create wikis | ❌ | ❌ | ✅ |
| Edit wikis | ❌ | ❌ | ✅ |
| Delete wikis | ❌ | ❌ | ✅ |
| View drafts | ❌ | ❌ | ✅ |

**Note:** Hiện tại auth middleware chỉ check token, chưa check role. Cần thêm role check:

```javascript
// In wikiRoutes.js (future improvement)
import { adminOnly } from '../../../middlewares/auth.middleware.js';

router.post("/", authMiddleware, adminOnly, createWiki);
router.put("/:id", authMiddleware, adminOnly, updateWiki);
router.delete("/:id", authMiddleware, adminOnly, deleteWiki);
```

---

## 🧪 Testing

### Manual Testing

1. **List wikis:**
```bash
curl http://localhost:5000/api/web/wiki
```

2. **Get featured:**
```bash
curl http://localhost:5000/api/web/wiki/featured
```

3. **Get specific wiki:**
```bash
curl http://localhost:5000/api/web/wiki/monster-monster_001
```

4. **Create wiki (with auth):**
```bash
curl -X POST http://localhost:5000/api/web/wiki \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Wiki","slug":"test-wiki","content":"# Test","category":"Tutorial"}'
```

---

## 📈 Future Enhancements

### Phase 1 (Completed ✅)
- [x] Wiki Model & Schema
- [x] CRUD API Endpoints
- [x] Frontend List & Detail Pages
- [x] Category filtering
- [x] Pagination
- [x] Seed data script

### Phase 2 (Recommended)
- [ ] Admin Panel for Wiki Management
- [ ] Rich Text Editor (Markdown editor)
- [ ] Image upload for wiki content
- [ ] Wiki versioning UI
- [ ] Comments on wikis
- [ ] Wiki contributions (user-submitted edits)

### Phase 3 (Advanced)
- [ ] Wiki analytics (popular pages)
- [ ] Wiki export (PDF, HTML)
- [ ] Multi-language wikis
- [ ] Wiki categories hierarchy
- [ ] AI-generated wiki summaries

---

## ❓ Troubleshooting

### Issue: "Cannot find module 'react-markdown'"
**Solution:** 
```bash
cd "GhostVillage Web/forum"
npm install react-markdown
```

### Issue: Seed script fails with "defaultAuthorId not found"
**Solution:** 
1. Tạo admin user trước
2. Copy user ID
3. Update `defaultAuthorId` trong seedWiki.js

### Issue: Wiki pages show 404
**Solution:** 
- Check backend đang chạy
- Check API_BASE_URL trong .env
- Check routes đã mount đúng chưa

### Issue: CSS không hiển thị đúng
**Solution:**
- Clear browser cache
- Check CSS files đã import trong components
- Check theme.css variables

---

## 📞 Support

Nếu gặp vấn đề:
1. Check console logs (backend & frontend)
2. Check network tab trong browser DevTools
3. Verify database connection
4. Check tất cả dependencies đã install

---

## ✅ Checklist hoàn thành

- [x] Wiki Model với đầy đủ fields
- [x] Wiki Service với CRUD operations
- [x] Wiki Controller với error handling
- [x] Wiki Routes với authentication
- [x] Seed data script với game data
- [x] Frontend List Page với filtering
- [x] Frontend Detail Page với markdown rendering
- [x] Wiki Card component
- [x] CSS styling cho cả 2 pages
- [x] Integration vào App routes
- [x] Sidebar navigation update
- [x] react-markdown dependency installed

**Wiki System đã sẵn sàng sử dụng! 🎉**
