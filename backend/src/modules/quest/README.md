# Quest Management Module - Implementation Guide

## 📁 Structure

```
backend/src/modules/quest/
├── questModel.js           # Schema định nghĩa quest
├── questController.js      # Logic xử lý CRUD + toggle
└── questRoutes.js          # Định nghĩa endpoints
```

## 🎯 Features Implemented

### 1. View Quest List 
- **GET** `/api/quests`
- Hỗ trợ phân trang (page, limit)
- Lọc theo trạng thái (isActive)
- Lọc theo questLine (Main Story/Side Quest/Daily/etc.)
- Lọc theo difficulty (Easy/Medium/Hard/etc.)
- Tìm kiếm full-text (search)

### 2. Edit Quest 
- **GET** `/api/quests/:id` - Xem chi tiết quest
- **POST** `/api/quests` - Tạo quest mới
- **PUT** `/api/quests/:id` - Cập nhật quest (objectives, rewards, quest lines)
- Hỗ trợ tìm theo MongoDB _id hoặc questId (QUEST_XXX)

### 3. Toggle Activate Quest 
- **PATCH** `/api/quests/:id/status` - Bật/tắt quest
- Hỗ trợ toggle hoặc set giá trị cụ thể

### 4. Additional Features 
- **DELETE** `/api/quests/:id` - Xóa quest
- **GET** `/api/quests/stats/summary` - Thống kê tổng quan

## 📊 Schema Structure

### Quest Model
```javascript
{
  questId: String,              // Mã quest (VD: "QUEST_MAIN_001")
  title: String,                // Tiêu đề
  description: String,          // Mô tả
  story: String,                // Lore/câu chuyện
  questLine: String,            // Main Story/Side Quest/Daily/Weekly/Event/Tutorial
  chapter: String,              // Chapter (optional)
  prerequisites: [String],      // Quest IDs cần hoàn thành trước
  
  // Objectives (Mục tiêu)
  objectives: [{
    type: String,               // kill/collect/reach/interact/survive/escort
    description: String,        // Mô tả mục tiêu
    target: String,             // Target ID (monster/item/location/npc)
    required: Number,           // Số lượng cần đạt
    current: Number             // Tiến độ hiện tại
  }],
  
  // Rewards (Phần thưởng)
  rewards: {
    exp: Number,
    coin: Number,
    items: [{ itemId: String, quantity: Number }],
    titles: [String]
  },
  
  // Status & Requirements
  difficulty: String,           // Easy/Medium/Hard/Expert/Nightmare
  levelRequired: Number,        // Level yêu cầu
  timeLimit: Number,            // Giới hạn thời gian (seconds)
  isRepeatable: Boolean,        // Có thể làm lại không
  cooldown: Number,             // Thời gian chờ để làm lại
  isActive: Boolean,            // Trạng thái kích hoạt
  
  // Additional Info
  npcGiver: String,             // NPC giao nhiệm vụ
  location: String,             // Vị trí nhận/nộp quest
  tags: [String],               // Tags để tìm kiếm
  
  createdAt: Date,
  updatedAt: Date
}
```

### Virtual Fields
- `isCompleted`: Kiểm tra quest đã hoàn thành chưa
- `progressPercentage`: Tính % hoàn thành quest

##  API Endpoints

### List Quests
```http
GET /api/quests
GET /api/quests?page=1&limit=20
GET /api/quests?isActive=true
GET /api/quests?questLine=Main Story
GET /api/quests?difficulty=Hard
GET /api/quests?search=temple
```

**Response:**
```json
{
  "success": true,
  "message": "Lấy danh sách quest thành công",
  "data": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Get Quest Detail
```http
GET /api/quests/QUEST_MAIN_001
GET /api/quests/507f1f77bcf86cd799439011
```

### Create Quest
```http
POST /api/quests
Content-Type: application/json

{
  "questId": "QUEST_MAIN_003",
  "title": "Defeat the Shadow Lord",
  "description": "Face the ultimate evil...",
  "questLine": "Main Story",
  "objectives": [
    {
      "type": "kill",
      "description": "Defeat Shadow Lord",
      "target": "BOSS_SHADOW_LORD",
      "required": 1
    }
  ],
  "rewards": {
    "exp": 5000,
    "coin": 3000,
    "items": [
      { "itemId": "LEGENDARY_SWORD", "quantity": 1 }
    ],
    "titles": ["Shadow Slayer"]
  },
  "difficulty": "Nightmare",
  "levelRequired": 20
}
```

### Update Quest
```http
PUT /api/quests/QUEST_MAIN_001
Content-Type: application/json

{
  "title": "Updated Title",
  "objectives": [...],
  "rewards": {...}
}
```

### Toggle Quest Status
```http
PATCH /api/quests/QUEST_MAIN_001/status
Content-Type: application/json

{} // Toggle current status
// OR
{ "isActive": true } // Set specific value
```

### Delete Quest
```http
DELETE /api/quests/QUEST_MAIN_001
```

### Get Statistics
```http
GET /api/quests/stats/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "active": 45,
    "inactive": 5,
    "byQuestLine": [
      { "_id": "Main Story", "count": 15 },
      { "_id": "Side Quest", "count": 20 },
      { "_id": "Daily", "count": 10 }
    ],
    "byDifficulty": [
      { "_id": "Easy", "count": 15 },
      { "_id": "Medium", "count": 20 },
      { "_id": "Hard", "count": 15 }
    ]
  }
}
```

## 🧪 Testing

### 1. Run Seed Data
```bash
cd backend
node seedQuest.js
```

This will create 8 sample quests:
- 2 Main Story quests
- 2 Side quests
- 1 Daily quest
- 1 Weekly quest
- 1 Tutorial quest
- 1 Event quest

### 2. Test Endpoints

#### Get all quests
```bash
curl http://localhost:5000/api/quests
```

#### Get active quests only
```bash
curl http://localhost:5000/api/quests?isActive=true
```

#### Get Main Story quests
```bash
curl http://localhost:5000/api/quests?questLine=Main%20Story
```

#### Get quest detail
```bash
curl http://localhost:5000/api/quests/QUEST_MAIN_001
```

#### Create new quest
```bash
curl -X POST http://localhost:5000/api/quests \
  -H "Content-Type: application/json" \
  -d '{
    "questId": "QUEST_TEST_001",
    "title": "Test Quest",
    "description": "This is a test",
    "questLine": "Side Quest",
    "objectives": [{
      "type": "kill",
      "description": "Test objective",
      "target": "TEST_TARGET",
      "required": 1
    }],
    "rewards": {
      "exp": 100,
      "coin": 50
    },
    "difficulty": "Easy",
    "levelRequired": 1
  }'
```

#### Toggle quest status
```bash
curl -X PATCH http://localhost:5000/api/quests/QUEST_MAIN_001/status \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Get statistics
```bash
curl http://localhost:5000/api/quests/stats/summary
```

## 📝 Notes

### Quest ID Format
- **MUST** follow pattern: `QUEST_[TYPE]_[NUMBER]`
- Examples: `QUEST_MAIN_001`, `QUEST_SIDE_TEMPLE`, `QUEST_DAILY_001`
- Automatically converted to uppercase

### Objective Types
- `kill`: Defeat monsters
- `collect`: Collect items
- `reach`: Reach a location
- `interact`: Interact with NPC/object
- `survive`: Survive for a duration
- `escort`: Escort NPC

### Quest Lines
- `Main Story`: Cốt truyện chính
- `Side Quest`: Nhiệm vụ phụ
- `Daily`: Nhiệm vụ hàng ngày
- `Weekly`: Nhiệm vụ hàng tuần
- `Event`: Sự kiện đặc biệt
- `Tutorial`: Hướng dẫn

### Difficulty Levels
- `Easy`: Dễ
- `Medium`: Trung bình
- `Hard`: Khó
- `Expert`: Chuyên gia
- `Nightmare`: Ác mộng

## 🔄 Integration with Game

### Player Quest Progress Tracking
Để track tiến độ quest của player, bạn cần tạo thêm:

```javascript
// PlayerQuest Model (player quest progress)
{
  userId: ObjectId,
  questId: String,
  status: String,           // "active", "completed", "failed"
  objectives: [{
    type: String,
    target: String,
    current: Number,        // Player's current progress
    required: Number
  }],
  startedAt: Date,
  completedAt: Date,
  lastUpdatedAt: Date
}
```

### Recommended Next Steps
1. Create `playerQuestModel.js` for tracking player progress
2. Create endpoints for:
   - Accept quest
   - Update progress
   - Complete quest
   - Claim rewards
3. Add quest progress tracking in game logic
4. Add quest notification system

##  Completed Tasks

- [x] Create questModel.js with schema
- [x] Create questController.js with CRUD operations
- [x] Create questRoutes.js for API endpoints
- [x] Register quest routes in main routes.js
- [x] Create seedQuest.js for sample data
- [x] Support for objectives and rewards editing
- [x] Support for quest line management
- [x] Toggle activate/deactivate quest feature

## 🎉 Success!

Quest Management module đã được triển khai thành công theo đúng cấu trúc dự án!
