import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Announcement from './src/modules/forum/announcement/announcementModel.js';
import User from './src/modules/user/userModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/GhostVillage';

const announcements = [
  {
    title: '🎮 Welcome to Ghost Village!',
    slug: 'welcome-to-ghost-village',
    excerpt: 'We are thrilled to announce the official launch of Ghost Village! Join thousands of players in this exciting multiplayer ghost hunting adventure.',
    content: `# Welcome to Ghost Village!

We are absolutely **thrilled** to welcome you to the official Ghost Village community!

## What is Ghost Village?

Ghost Village is a multiplayer co-op ghost hunting game where you and your friends explore haunted locations, investigate paranormal activities, and survive encounters with supernatural entities.

## Key Features

- **Multiplayer Co-op**: Team up with up to 4 players
- **Dynamic Ghost AI**: Each ghost has unique behaviors and abilities
- **Investigation Tools**: Use EMF readers, spirit boxes, and more
- **Progression System**: Unlock new equipment and abilities
- **Cross-Platform Play**: Play with friends on different platforms

## Getting Started

1. Download the game from our website
2. Complete the tutorial to learn the basics
3. Join or create a team
4. Start your first investigation!

## Community Resources

- **Wiki**: Check out our comprehensive game wiki for guides and strategies
- **Forums**: Join discussions with other players
- **Discord**: Connect with the community in real-time
- **Bug Reports**: Help us improve by reporting issues

Thank you for joining us on this supernatural adventure!

**The Ghost Village Team**`,
    coverImage: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800',
    isPinned: true,
    isActive: true
  },
  {
    title: '🔄 Update v1.2.0 Released',
    slug: 'update-v1-2-0-released',
    excerpt: 'Major update brings new ghost types, improved AI, and quality of life improvements.',
    content: `# Update v1.2.0 - The Phantom Update

We're excited to announce the release of version 1.2.0, our biggest update yet!

## New Features

### New Ghost Types
- **The Phantom**: A dangerous ghost that can walk through walls
- **The Shade**: A shy ghost that becomes more active when alone
- **The Wraith**: Can teleport to players and leave no footprints

### Improved Ghost AI
- Ghosts now have more realistic hunting patterns
- Better pathfinding and obstacle avoidance
- Dynamic difficulty adjustment based on team performance

### New Equipment
- **Motion Sensor**: Place sensors to detect ghost movement
- **Salt Shaker**: Create salt barriers to slow down ghosts
- **Crucifix**: Prevent hunts in a specific area

## Quality of Life Improvements

- Improved voice recognition for spirit box
- Better lighting system
- Enhanced graphics and performance optimization
- New in-game tutorial system
- Bug fixes and stability improvements

## Balance Changes

- Reduced ghost hunt duration by 10%
- Increased effectiveness of hiding spots
- Adjusted sanity drain rates
- Updated difficulty scaling

## Known Issues

- Some players may experience occasional frame drops (being investigated)
- Voice chat may cut out in certain situations (fix in progress)

## What's Next?

We're already working on version 1.3.0 which will include:
- New maps: Abandoned School and Old Cemetery
- Custom game modes
- Achievement system
- Season pass

Thank you for your continued support!`,
    coverImage: 'https://images.unsplash.com/photo-1614853035111-7ae3f0e35677?w=800',
    isPinned: true,
    isActive: true
  },
  {
    title: '🎃 Halloween Event Starting Soon!',
    slug: 'halloween-event-2024',
    excerpt: 'Get ready for our biggest Halloween event ever! New haunted mansion map, exclusive cosmetics, and limited-time challenges.',
    content: `# Halloween Event 2024 🎃

The most frightening time of year is almost here, and Ghost Village is going all out!

## Event Duration
**October 20th - November 5th, 2024**

## New Content

### Haunted Mansion Map
Explore a massive Victorian mansion with:
- 30+ rooms to investigate
- Multiple floors and secret passages
- Unique ghost encounters
- Interactive environment puzzles

### Limited-Time Ghosts
- **The Headless Horseman**: Roams the mansion grounds
- **The Banshee Queen**: Her scream can be heard throughout the mansion
- **Poltergeist Swarm**: Multiple weak ghosts that hunt as a pack

### Exclusive Cosmetics
- Witch outfit set
- Vampire hunter gear
- Skeleton mascot costume
- Jack-o'-lantern equipment skins
- Ghost sheet costume (ironic!)

## Special Challenges

Complete daily challenges to earn:
- **Candy Coins**: Event-exclusive currency
- **Horror Points**: Unlock special badges
- **Mystery Boxes**: Random cosmetic rewards

### Challenge Examples
- Survive 10 hunts in the Haunted Mansion
- Identify all ghost types correctly
- Complete investigations without using flashlight
- Finish a perfect investigation (all objectives, no deaths)

## Leaderboards

Compete for:
- Fastest investigation times
- Most successful identifications
- Highest difficulty completions

Top 100 players will receive exclusive "Ghost Hunter Master" title!

## Community Events

- **October 31st**: Live-streamed developer ghost hunt
- **Weekly Raffles**: Win game merchandise
- **Screenshot Contest**: Share your spookiest moments

## Store Sales

All cosmetics 20% off during the event!

Mark your calendars and prepare for the scariest Ghost Village experience yet!

*The spirits are waiting...*`,
    coverImage: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=800',
    isPinned: false,
    isActive: true
  },
  {
    title: '🛠️ Server Maintenance - Oct 15',
    slug: 'server-maintenance-oct-15',
    excerpt: 'Scheduled server maintenance on October 15th from 2:00 AM to 6:00 AM UTC. Game will be temporarily unavailable.',
    content: `# Scheduled Server Maintenance

## Maintenance Window
**Date**: October 15th, 2024  
**Time**: 2:00 AM - 6:00 AM UTC (approximately 4 hours)  
**Status**: All game servers will be offline

## What's Being Updated?

- Database optimization for better performance
- Network infrastructure upgrades
- Security patches
- Backend server updates
- Matchmaking improvements

## Impact

During maintenance:
-  Game servers will be unavailable
-  Cannot join or create games
-  Leaderboards will not update
-  Website and forums remain accessible
-  Wiki and community features available

## Compensation

All players will receive:
- 1000 in-game currency
- 24-hour XP boost (50%)
- Exclusive "Patient Ghost Hunter" badge

## What to Do?

- Finish any active games before maintenance starts
- Your progress is automatically saved
- Check our Discord for live updates
- Report any issues after maintenance

Thank you for your patience and understanding!

Questions? Contact support@ghostvillage.com`,
    coverImage: null,
    isPinned: false,
    isActive: true
  },
  {
    title: '🏆 Competitive Season 2 Announcement',
    slug: 'competitive-season-2-announcement',
    excerpt: 'Season 2 of competitive mode launches next month with new ranking system, rewards, and tournament support.',
    content: `# Competitive Season 2: Rise of the Hunters

Get ready for the most competitive Ghost Village experience yet!

## Season Start
**Launch Date**: November 1st, 2024  
**Season Duration**: 3 months

## New Ranking System

### Divisions
- **Bronze**: Entry level hunters
- **Silver**: Experienced investigators
- **Gold**: Elite ghost hunters
- **Platinum**: Master hunters
- **Diamond**: Legendary status
- **Ghost Hunter Elite**: Top 500 players

### How It Works
- Earn rank points from successful investigations
- Difficulty multiplier applies
- Team coordination bonuses
- Weekly rank decay prevents inactivity

## Season Rewards

### Division Rewards
Each division unlocks exclusive:
- Equipment skins
- Character cosmetics
- Victory emotes
- Profile badges
- Loading screens

### Top Player Rewards
- **Top 10**: Unique animated banner
- **Top 50**: Exclusive ghost pet
- **Top 100**: Custom name color
- **Top 500**: Elite border frame

## Competitive Features

### Leaderboards
- Global rankings
- Regional leaderboards
- Friends comparison
- Team rankings

### Tournaments
- Monthly community tournaments
- Prize pools up to $10,000
- Invitational events
- Qualifier rounds

### Spectator Mode
- Watch top-ranked players
- Learn strategies
- Replay analysis
- Live commentary (selected matches)

## Fair Play

We're implementing:
- Advanced anti-cheat system
- Behavior monitoring
- Ranked penalties for early quits
- Review system for reports

## Competitive-Only Maps

Four new maps exclusive to ranked:
- The Asylum (Large)
- Prison Block 13 (Medium)
- Lighthouse Point (Medium)
- Cursed Chapel (Small)

## Requirements

To play ranked:
- Account level 10+
- Complete tutorial
- Own at least basic equipment
- Verified email address

## Seasonal Challenges

Complete challenges for bonus rank points:
- Win 50 ranked matches
- Achieve perfect investigations
- Reach specific divisions
- Play all ranked maps

Start practicing now and prepare for the most competitive season yet!

Good luck, hunters!`,
    coverImage: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800',
    isPinned: false,
    isActive: true
  },
  {
    title: '💬 Community Feedback Survey',
    slug: 'community-feedback-survey-2024',
    excerpt: 'Help shape the future of Ghost Village! Take our 5-minute survey and earn exclusive rewards.',
    content: `# We Want Your Feedback!

Your opinion matters! Help us improve Ghost Village by completing our community survey.

## Survey Details

**Duration**: 5-10 minutes  
**Deadline**: October 31st, 2024  
**Topics Covered**:
- Gameplay experience
- Content preferences
- Technical performance
- Community features
- Future content ideas

## Rewards

Complete the survey to receive:
- 500 in-game currency
- Exclusive "Community Voice" badge
- Entry into prize drawing

### Prize Drawing
- **Grand Prize**: Custom ghost design in-game
- **2nd Prize**: $50 store credit
- **3rd-10th Prize**: Premium cosmetic pack

## Topics We're Interested In

### Gameplay
- Which ghost types do you enjoy most?
- What difficulty level do you prefer?
- How do you feel about current balance?
- What features would improve gameplay?

### Content
- What new maps would you like?
- Interest in new game modes?
- Priority for new equipment?
- Cosmetic preferences?

### Technical
- Performance satisfaction
- Common issues you face
- Platform-specific feedback
- Preferred settings

### Community
- Forum usage
- Discord activity
- Wiki helpfulness
- What community features to add?

## How to Participate

1. Visit: survey.ghostvillage.com
2. Log in with your game account
3. Complete the survey honestly
4. Submit and claim your rewards!

## Why This Matters

Your feedback directly influences:
- Development priorities
- Future content roadmap
- Bug fix priorities
- Community features
- Quality of life improvements

We read every response and take your suggestions seriously!

## Previous Survey Results

Last survey led to:
- New solo difficulty option
- Improved matchmaking
- Better tutorial system
- Equipment loadout presets
- Quick-join feature

## Questions?

- Email: feedback@ghostvillage.com
- Discord: #community-feedback
- Forums: Survey Discussion thread

Thank you for being part of the Ghost Village community!

**Your voice shapes our future.**`,
    coverImage: null,
    isPinned: false,
    isActive: true
  }
];

async function seedAnnouncements() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB!');

    // Find an admin user or create a default one
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found, looking for any user...');
      adminUser = await User.findOne();
    }

    if (!adminUser) {
      console.log('Creating a default author user...');
      adminUser = await User.create({
        username: 'GameMaster',
        email: 'admin@ghostvillage.com',
        password: 'tempPassword123',
        role: 'admin',
        isVerified: true
      });
    }

    console.log(`Using author: ${adminUser.username}`);

    // Clear existing announcements
    await Announcement.deleteMany({});
    console.log('Cleared existing announcements');

    // Add author to announcements
    const announcementsWithAuthor = announcements.map(announcement => ({
      ...announcement,
      author: adminUser._id
    }));

    // Insert announcements
    const result = await Announcement.insertMany(announcementsWithAuthor);
    console.log(` Successfully seeded ${result.length} announcements!`);

    // Display seeded announcements
    result.forEach((announcement, index) => {
      console.log(`${index + 1}. ${announcement.title} (${announcement.isPinned ? '📌 PINNED' : 'Regular'})`);
    });

  } catch (error) {
    console.error(' Error seeding announcements:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

seedAnnouncements();
