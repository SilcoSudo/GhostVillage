require('dotenv').config();
const mongoose = require('mongoose');

// Import các Models
const Player = require('./models/Player'); 
const Post = require('./models/Post'); // Import thêm model Post vừa tạo

const seedData = async () => {
    try {
        // 1. KẾT NỐI DATABASE: GHOSTVILLAGE
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'GhostVillage' // Đảm bảo chính xác tên DB
        });
        console.log('🔌 Đã kết nối MongoDB -> Database: GhostVillage');

        // 2. DỌN DẸP DỮ LIỆU CŨ (Xóa User và Post cũ)
        await Player.deleteMany({});
        await Post.deleteMany({});
        console.log('🗑️  Đã xóa dữ liệu cũ (Players & Posts).');

        // 3. CHUẨN BỊ ID (Để link giữa các bảng)
        const user1_Id = new mongoose.Types.ObjectId();
        const user2_Id = new mongoose.Types.ObjectId();

        // --- TẠO USER 1: Người chơi hệ "Cày cuốc" (Level 5) ---
        const user1 = {
            _id: user1_Id,
            auth: {
                email: 'nam.game thủ@gmail.com',
                username: 'NamGhostHunter',
                passwordHash: '123456', // Pass đơn giản
                role: 'user',
                isBanned: false
            },
            profile: {
                displayName: 'Nam Thợ Săn',
                avatar: 'avatar_boy_01.png',
                level: 5,
                exp: 1250,
                coin: 500, // Tiền ít
                gold: 0,
                title: 'Newbie'
            },
            stats: { // Chỉ số bình thường
                totalMatches: 10,
                wins: 4,
                losses: 6,
                timesRevivedTeammate: 2,
                timesJumpscared: 15
            },
            inventory: {
                unlockedSkins: ['skin_default'],
                unlockedPerks: [],
                consumables: [{ itemId: 'item_flashlight_battery', quantity: 2 }]
            },
            loadout: {
                equippedSkin: 'skin_default',
                equippedPerks: []
            },
            social: {
                friendList: [user2_Id], // Kết bạn với User 2
                friendRequests: [],
                blockList: []
            },
            settings: {
                masterVolume: 80,
                sensitivity: 2.5
            }
        };

        // --- TẠO USER 2: Người chơi hệ "Diễn đàn" (Level 2) ---
        const user2 = {
            _id: user2_Id,
            auth: {
                email: 'lan.support@gmail.com',
                username: 'LanSupport',
                passwordHash: '123456',
                role: 'user',
                isBanned: false
            },
            profile: {
                displayName: 'Lan Meo Meo',
                avatar: 'avatar_girl_02.png',
                level: 2,
                exp: 300,
                coin: 150,
                gold: 0,
                title: 'Villager'
            },
            stats: {
                totalMatches: 3,
                wins: 1,
                losses: 2,
                timesRevivedTeammate: 0,
                timesJumpscared: 50 // Rất hay bị hù
            },
            inventory: {
                unlockedSkins: ['skin_default'],
                unlockedPerks: [],
                consumables: []
            },
            loadout: {
                equippedSkin: 'skin_default',
                equippedPerks: []
            },
            social: {
                friendList: [user1_Id],
                friendRequests: [],
                blockList: []
            },
            settings: {
                masterVolume: 100,
                sensitivity: 4.0
            }
        };

        // --- TẠO POSTS (Bài viết diễn đàn) ---
        
        // Bài 1: User 1 hỏi về game
        const post1 = {
            title: 'Làm sao để thoát khỏi con ma ở Nhà Kho?',
            content: 'Mọi người ơi, tui chơi tới màn 2 đoạn nhà kho thì bị kẹt. Con ma nó cứ camp ở cửa hoài không ra được. Ai có mẹo gì không?',
            author: user1_Id,
            category: 'Discussion',
            views: 15,
            likes: [user2_Id], // User 2 đã like
            createdAt: new Date('2023-10-25') // Giả lập ngày cũ
        };

        // Bài 2: User 2 báo lỗi
        const post2 = {
            title: '[BUG] Game bị văng khi nhặt chìa khóa',
            content: 'Admin xem giúp, mình nhặt chìa khóa màu đỏ ở map Làng Cổ thì game bị crash văng ra desktop luôn. Cấu hình máy mình: Win 10, Ram 8GB.',
            author: user2_Id,
            category: 'Bug Report',
            views: 5,
            likes: [],
            createdAt: new Date() // Ngày hiện tại
        };

        // Bài 3: User 1 rủ chơi chung
        const post3 = {
            title: 'Tìm team chơi tối nay (20h)',
            content: 'Cần tìm 2 bạn nữa đi map Bệnh Viện bỏ hoang. Yêu cầu có mic để call team nhé.',
            author: user1_Id,
            category: 'General',
            views: 30,
            likes: [],
            createdAt: new Date()
        };

        // 4. LƯU VÀO DB
        console.log('⏳ Đang tạo Players...');
        await Player.create([user1, user2]); // Dùng create để kích hoạt hash password

        console.log('⏳ Đang tạo Forum Posts...');
        await Post.create([post1, post2, post3]);

        console.log('✅ KHỞI TẠO DỮ LIỆU THÀNH CÔNG CHO GHOSTVILLAGE!');
        
        // 5. Ngắt kết nối
        process.exit();

    } catch (error) {
        console.error('❌ Có lỗi xảy ra:', error);
        process.exit(1);
    }
};

seedData();