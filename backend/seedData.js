import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/modules/user/userModel.js';
import Player from './src/modules/player/playerModel.js';
import { config } from './src/config/env.js';

dotenv.config();

const seedData = async () => {
    try {
        // 1. KẾT NỐI DATABASE
        await mongoose.connect(config.mongodb.uri);
        console.log('🔌 Đã kết nối MongoDB');

        // 2. DỌN DẸP DỮ LIỆU CŨ
        await User.deleteMany({});
        await Player.deleteMany({});
        console.log('🗑️  Đã xóa dữ liệu cũ (Users & Players).');

        // 3. CHUẨN BỊ ID (Để link giữa các bảng)
        const user1_Id = new mongoose.Types.ObjectId('659d4b1e9d3e2a1b3c4d5e6f');
        const user2_Id = new mongoose.Types.ObjectId();

        // --- TẠO USER 1: Web Auth User (Email-only) ---
        // Role: user | admin
        // Game sẽ dùng chung tài khoản này
        const user1 = {
            _id: user1_Id,
            email: 'hung@ghostvillage.com',
            password: '123456', // Sẽ được hash bởi pre-save hook
            avatar: 'avatar_default_01',
            bio: 'Hùng Đẹp Trai',
            role: 'user', // Chỉ có user hoặc admin
            isActive: true,
            isBanned: false,
            lastLogin: new Date()
        };

        // --- TẠO USER 2: Web Auth User thứ 2 ---
        const user2 = {
            _id: user2_Id,
            email: 'belan.support@gmail.com',
            password: '123456',
            avatar: 'avatar_default_01',
            bio: 'Bé Lan Support',
            role: 'user',
            isActive: true,
            isBanned: false
        };

        // --- TẠO PLAYER 1: Game Profile của User 1 ---
        // Player tham chiếu User qua userId
        // Chứa game-specific data: level, exp, coin, skins, perks
        const player1 = {
            _id: new mongoose.Types.ObjectId('659d4b1e9d3e2a1b3c4d5e70'),
            userId: user1_Id,
            profile: {
                displayName: 'Hùng Đẹp Trai',
                avatar: 'avatar_default_01',
                level: 1,
                exp: 0,
                coin: 1000
            },
            inventory: {
                unlockedSkins: ['skin_default'],
                unlockedPerks: []
            }
        };

        // --- TẠO PLAYER 2: Game Profile của User 2 ---
        const player2 = {
            userId: user2_Id,
            profile: {
                displayName: 'Bé Lan Support',
                avatar: 'avatar_default_01',
                level: 1,
                exp: 0,
                coin: 1000
            },
            inventory: {
                unlockedSkins: ['skin_default'],
                unlockedPerks: []
            }
        };

        // 4. LƯU VÀO DB
        console.log('⏳ Đang tạo Users...');
        await User.create([user1, user2]);

        console.log('⏳ Đang tạo Players (Game Profiles)...');
        await Player.create([player1, player2]);

        console.log('✅ KHỞI TẠO DỮ LIỆU THÀNH CÔNG!');
        console.log('👤 User 1: hung@ghostvillage.com | 👤 User 2: lan.support@gmail.com');
        console.log('🎮 Player 1: Hùng Đẹp Trai | 🎮 Player 2: Lan Support');
        
        // 5. Ngắt kết nối
        process.exit();

    } catch (error) {
        console.error('❌ Có lỗi xảy ra:', error);
        process.exit(1);
    }
};

seedData();