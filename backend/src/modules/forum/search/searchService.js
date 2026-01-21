import Post from '../posts/postModel.js';
import Wiki from '../wiki/wikiModel.js';
import Announcement from '../announcement/announcementModel.js';
import User from '../../user/userModel.js';

/**
 * Search across multiple collections using full-text and partial search
 * @param {string} query - Search query string
 * @param {Object} options - Search options
 * @param {Array<string>} options.collections - Collections to search in (default: all)
 * @param {number} options.limit - Max results per collection
 * @param {number} options.page - Page number for pagination
 * @returns {Object} Search results grouped by collection
 */
export const searchAll = async (query, options = {}) => {
  const {
    collections = ['posts', 'users', 'wiki', 'announcements'],
    limit = 10,
    page = 1
  } = options;

  if (!query || typeof query !== 'string') {
    throw new Error('Search query is required');
  }

  const skip = (page - 1) * limit;
  const results = {};

  // Create search regex for partial matching (case-insensitive)
  const searchRegex = new RegExp(query.split(' ').filter(Boolean).join('|'), 'i');

  // Search Posts
  if (collections.includes('posts')) {
    try {
      // Use regex for partial matching (case-insensitive)
      const postQuery = {
        $or: [
          { title: searchRegex },
          { body: searchRegex }
        ]
      };

      const posts = await Post.find(postQuery)
        .populate('author', 'fullname username avatar email')
        .select('title body category author likes commentCount createdAt media')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Post.countDocuments(postQuery);

      results.posts = {
        items: posts.map(post => ({
          ...post,
          type: 'post',
          likesCount: post.likes?.length || 0
        })),
        total,
        page,
        limit,
        hasMore: skip + posts.length < total
      };
    } catch (error) {
      console.error('Error searching posts:', error);
      results.posts = { items: [], total: 0, page, limit, hasMore: false };
    }
  }

  // Search Users
  if (collections.includes('users')) {
    try {
      const userQuery = {
        $or: [
          { fullname: searchRegex },
          { username: searchRegex },
          { email: searchRegex },
          { bio: searchRegex }
        ]
      };

      const users = await User.find(userQuery)
        .select('fullname username email avatar bio role createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await User.countDocuments(userQuery);

      results.users = {
        items: users.map(user => ({
          ...user,
          type: 'user'
        })),
        total,
        page,
        limit,
        hasMore: skip + users.length < total
      };
    } catch (error) {
      console.error('Error searching users:', error);
      results.users = { items: [], total: 0, page, limit, hasMore: false };
    }
  }

  // Search Wiki
  if (collections.includes('wiki')) {
    try {
      const wikiQuery = {
        status: 'published',
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { excerpt: searchRegex },
          { tags: searchRegex }
        ]
      };

      const wikis = await Wiki.find(wikiQuery)
        .populate('author', 'fullname username avatar')
        .select('title slug excerpt category tags entityType coverImage author views likes createdAt isFeatured')
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Wiki.countDocuments(wikiQuery);

      results.wiki = {
        items: wikis.map(wiki => ({
          ...wiki,
          type: 'wiki',
          likesCount: wiki.likes?.length || 0
        })),
        total,
        page,
        limit,
        hasMore: skip + wikis.length < total
      };
    } catch (error) {
      console.error('Error searching wiki:', error);
      results.wiki = { items: [], total: 0, page, limit, hasMore: false };
    }
  }

  // Search Announcements
  if (collections.includes('announcements')) {
    try {
      const announcementQuery = {
        isActive: true,
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { excerpt: searchRegex }
        ]
      };

      const announcements = await Announcement.find(announcementQuery)
        .populate('author', 'fullname username avatar')
        .select('title slug excerpt coverImage author views isPinned createdAt')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Announcement.countDocuments(announcementQuery);

      results.announcements = {
        items: announcements.map(announcement => ({
          ...announcement,
          type: 'announcement'
        })),
        total,
        page,
        limit,
        hasMore: skip + announcements.length < total
      };
    } catch (error) {
      console.error('Error searching announcements:', error);
      results.announcements = { items: [], total: 0, page, limit, hasMore: false };
    }
  }

  // Calculate overall stats
  const totalResults = Object.values(results).reduce((sum, r) => sum + r.total, 0);

  return {
    query,
    results,
    totalResults,
    collections: Object.keys(results)
  };
};

/**
 * Search in a specific collection only
 * @param {string} collection - Collection name (posts, users, wiki, announcements)
 * @param {string} query - Search query
 * @param {Object} options - Search options
 */
export const searchByCollection = async (collection, query, options = {}) => {
  const validCollections = ['posts', 'users', 'wiki', 'announcements'];
  
  if (!validCollections.includes(collection)) {
    throw new Error(`Invalid collection: ${collection}`);
  }

  const result = await searchAll(query, {
    ...options,
    collections: [collection]
  });

  return result.results[collection] || { items: [], total: 0, page: 1, limit: 10, hasMore: false };
};

/**
 * Get search suggestions (top matching results across all collections)
 * @param {string} query - Search query
 * @param {number} limit - Max suggestions
 */
export const getSearchSuggestions = async (query, limit = 5) => {
  if (!query || query.length < 2) {
    return [];
  }

  const searchRegex = new RegExp(`^${query}`, 'i');
  const suggestions = [];

  try {
    // Get post titles
    const posts = await Post.find({ title: searchRegex })
      .select('title')
      .limit(limit)
      .lean();
    suggestions.push(...posts.map(p => ({ text: p.title, type: 'post' })));

    // Get wiki titles
    const wikis = await Wiki.find({ title: searchRegex, status: 'published' })
      .select('title')
      .limit(limit)
      .lean();
    suggestions.push(...wikis.map(w => ({ text: w.title, type: 'wiki' })));

    // Get announcement titles
    const announcements = await Announcement.find({ title: searchRegex, isActive: true })
      .select('title')
      .limit(limit)
      .lean();
    suggestions.push(...announcements.map(a => ({ text: a.title, type: 'announcement' })));

    // Get usernames
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { fullname: searchRegex }
      ]
    })
      .select('username fullname')
      .limit(limit)
      .lean();
    suggestions.push(...users.map(u => ({ text: u.username || u.fullname, type: 'user' })));

    // Remove duplicates and limit
    const uniqueSuggestions = suggestions
      .filter((item, index, self) => 
        index === self.findIndex(t => t.text === item.text)
      )
      .slice(0, limit);

    return uniqueSuggestions;
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
};

/**
 * Search with filters
 * @param {string} query - Search query
 * @param {Object} filters - Filter options
 */
export const searchWithFilters = async (query, filters = {}) => {
  const {
    collections = ['posts', 'users', 'wiki', 'announcements'],
    dateFrom,
    dateTo,
    category,
    entityType,
    featured,
    pinned,
    limit = 10,
    page = 1
  } = filters;

  const skip = (page - 1) * limit;
  const searchRegex = new RegExp(query.split(' ').filter(Boolean).join('|'), 'i');
  const results = {};

  // Search Posts with filters
  if (collections.includes('posts')) {
    const postQuery = {
      $or: [
        { title: searchRegex },
        { body: searchRegex }
      ]
    };

    if (category) postQuery.category = category;
    if (dateFrom || dateTo) {
      postQuery.createdAt = {};
      if (dateFrom) postQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) postQuery.createdAt.$lte = new Date(dateTo);
    }

    const posts = await Post.find(postQuery)
      .populate('author', 'fullname username avatar')
      .select('title body category author likes commentCount createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments(postQuery);

    results.posts = {
      items: posts.map(post => ({ ...post, type: 'post', likesCount: post.likes?.length || 0 })),
      total,
      page,
      limit,
      hasMore: skip + posts.length < total
    };
  }

  // Search Wiki with filters
  if (collections.includes('wiki')) {
    const wikiQuery = {
      status: 'published',
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex }
      ]
    };

    if (category) wikiQuery.category = category;
    if (entityType) wikiQuery.entityType = entityType;
    if (featured !== undefined) wikiQuery.isFeatured = featured;
    if (dateFrom || dateTo) {
      wikiQuery.createdAt = {};
      if (dateFrom) wikiQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) wikiQuery.createdAt.$lte = new Date(dateTo);
    }

    const wikis = await Wiki.find(wikiQuery)
      .populate('author', 'fullname username avatar')
      .select('title slug excerpt category tags entityType coverImage author views likes createdAt isFeatured')
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Wiki.countDocuments(wikiQuery);

    results.wiki = {
      items: wikis.map(wiki => ({ ...wiki, type: 'wiki', likesCount: wiki.likes?.length || 0 })),
      total,
      page,
      limit,
      hasMore: skip + wikis.length < total
    };
  }

  // Search Announcements with filters
  if (collections.includes('announcements')) {
    const announcementQuery = {
      isActive: true,
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { excerpt: searchRegex }
      ]
    };

    if (pinned !== undefined) announcementQuery.isPinned = pinned;
    if (dateFrom || dateTo) {
      announcementQuery.createdAt = {};
      if (dateFrom) announcementQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) announcementQuery.createdAt.$lte = new Date(dateTo);
    }

    const announcements = await Announcement.find(announcementQuery)
      .populate('author', 'fullname username avatar')
      .select('title slug excerpt coverImage author views isPinned createdAt')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Announcement.countDocuments(announcementQuery);

    results.announcements = {
      items: announcements.map(a => ({ ...a, type: 'announcement' })),
      total,
      page,
      limit,
      hasMore: skip + announcements.length < total
    };
  }

  // Users don't have many filterable fields
  if (collections.includes('users')) {
    const userQuery = {
      $or: [
        { fullname: searchRegex },
        { username: searchRegex },
        { email: searchRegex },
        { bio: searchRegex }
      ]
    };

    const users = await User.find(userQuery)
      .select('fullname username email avatar bio role createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(userQuery);

    results.users = {
      items: users.map(user => ({ ...user, type: 'user' })),
      total,
      page,
      limit,
      hasMore: skip + users.length < total
    };
  }

  const totalResults = Object.values(results).reduce((sum, r) => sum + r.total, 0);

  return {
    query,
    filters,
    results,
    totalResults,
    collections: Object.keys(results)
  };
};
