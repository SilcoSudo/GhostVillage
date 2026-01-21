# Search System Documentation

## Overview
The search system provides full-text and partial search capabilities across multiple collections: Posts, Users, Wiki, and Announcements.

## Backend API Endpoints

### 1. Search All Collections
**GET** `/api/web/search`

Search across all collections simultaneously.

**Query Parameters:**
- `q` or `query` (required): Search query string
- `collections` (optional): Comma-separated list of collections to search (default: all)
  - Valid values: `posts`, `users`, `wiki`, `announcements`
- `limit` (optional): Results per collection (default: 10)
- `page` (optional): Page number for pagination (default: 1)

**Example:**
```bash
GET /api/web/search?q=ghost&collections=posts,wiki&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "ghost",
    "results": {
      "posts": {
        "items": [...],
        "total": 25,
        "page": 1,
        "limit": 5,
        "hasMore": true
      },
      "wiki": {
        "items": [...],
        "total": 12,
        "page": 1,
        "limit": 5,
        "hasMore": true
      }
    },
    "totalResults": 37,
    "collections": ["posts", "wiki"]
  }
}
```

### 2. Search Specific Collection
**GET** `/api/web/search/:collection`

Search in a single collection only.

**URL Parameters:**
- `collection` (required): One of `posts`, `users`, `wiki`, `announcements`

**Query Parameters:**
- `q` or `query` (required): Search query string
- `limit` (optional): Results limit (default: 10)
- `page` (optional): Page number (default: 1)

**Example:**
```bash
GET /api/web/search/wiki?q=phantom&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "phantom",
    "collection": "wiki",
    "items": [...],
    "total": 15,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

### 3. Get Search Suggestions
**GET** `/api/web/search/suggestions`

Get autocomplete suggestions based on query prefix.

**Query Parameters:**
- `q` or `query` (required): Search prefix (minimum 2 characters)
- `limit` (optional): Max suggestions (default: 5)

**Example:**
```bash
GET /api/web/search/suggestions?q=gho&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "text": "Ghost Hunter Guide", "type": "wiki" },
    { "text": "Ghost Types Explained", "type": "post" },
    { "text": "GhostMaster", "type": "user" },
    { "text": "Ghost Village Update", "type": "announcement" }
  ]
}
```

### 4. Advanced Search with Filters
**POST** `/api/web/search/advanced`

Search with advanced filtering options.

**Request Body:**
```json
{
  "query": "phantom",
  "filters": {
    "collections": ["wiki", "posts"],
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "category": "Monster",
    "entityType": "Ghost",
    "featured": true,
    "pinned": false,
    "limit": 10,
    "page": 1
  }
}
```

**Response:** Same structure as search all collections

## Search Features

### Full-Text Search
- Uses MongoDB text indexes for fast full-text search
- Automatically indexes `title`, `content`, `tags`, `body` fields
- Supports phrase matching and relevance scoring

### Partial Search (Regex Fallback)
- Falls back to regex-based partial matching
- Case-insensitive matching
- Searches across multiple fields using OR logic

### Search Fields by Collection

#### Posts
- title
- body
- category
- author information

#### Users
- fullname
- username
- email
- bio

#### Wiki
- title
- content
- excerpt
- tags
- category
- entityType

#### Announcements
- title
- content
- excerpt
- isPinned status

## Frontend Usage

### Search Page Component
Located at: `/search?q={query}`

**Features:**
- Tabbed interface for filtering by collection
- Real-time search with query parameter
- Display results grouped by type
- Pagination support
- Filter panel for collection selection
- Responsive design

**Usage:**
```jsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
```

### Header Search
The header includes a search bar that redirects to the search page.

## Search Service Functions

### `searchAll(query, options)`
Search across multiple collections

**Parameters:**
- `query` (string): Search query
- `options` (object):
  - `collections` (array): Collections to search
  - `limit` (number): Results per collection
  - `page` (number): Page number

### `searchByCollection(collection, query, options)`
Search in specific collection

### `getSearchSuggestions(query, limit)`
Get autocomplete suggestions

### `searchWithFilters(query, filters)`
Advanced search with filters

## Database Indexes

Ensure these text indexes exist for optimal performance:

```javascript
// Posts
db.posts.createIndex({ title: "text", body: "text" });

// Wiki
db.wikis.createIndex({ title: "text", content: "text", tags: "text" });

// Announcements
db.announcements.createIndex({ title: "text", content: "text" });
```

## Performance Considerations

1. **Pagination**: Always use pagination for large result sets
2. **Limit Results**: Default limit is 10 per collection to prevent overload
3. **Text Indexes**: Ensure text indexes are created for fast searches
4. **Caching**: Consider implementing Redis cache for frequent searches
5. **Rate Limiting**: Implement rate limiting to prevent abuse

## Error Handling

All search endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common errors:
- 400: Missing or invalid query
- 400: Invalid collection name
- 500: Server error during search

## Testing

### Test with curl:

```bash
# Search all collections
curl "http://localhost:5000/api/web/search?q=ghost"

# Search specific collection
curl "http://localhost:5000/api/web/search/wiki?q=phantom"

# Get suggestions
curl "http://localhost:5000/api/web/search/suggestions?q=gho"

# Advanced search
curl -X POST http://localhost:5000/api/web/search/advanced \
  -H "Content-Type: application/json" \
  -d '{"query":"phantom","filters":{"collections":["wiki"],"featured":true}}'
```

## Future Enhancements

- [ ] Implement search result highlighting
- [ ] Add search history tracking
- [ ] Implement fuzzy search for typo tolerance
- [ ] Add search analytics
- [ ] Implement saved searches
- [ ] Add advanced boolean operators (AND, OR, NOT)
- [ ] Implement faceted search
- [ ] Add search result sorting options
