# MTr Backend Storage Architecture

## 🏗️ System Overview

This document outlines the complete backend storage architecture for MTr - a sophisticated note-taking application that handles both link bookmarks and text notes with rich metadata extraction.

## 📊 Database Schema Design

### Core Tables

#### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### 2. Notes Table
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('link', 'text')),
  title TEXT,
  content TEXT,
  url TEXT,
  description TEXT,
  domain VARCHAR(255),
  favicon_url TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_type ON notes(type);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX idx_notes_metadata ON notes USING GIN(metadata);
CREATE INDEX idx_notes_search ON notes USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '') || ' ' || COALESCE(description, '')));
```

#### 3. Collections Table (for organizing notes)
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_collections_user_id ON collections(user_id);
```

#### 4. Note Collections Junction Table
```sql
CREATE TABLE note_collections (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (note_id, collection_id)
);
```

#### 5. Shared Notes Table
```sql
CREATE TABLE shared_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shared_notes_token ON shared_notes(share_token);
CREATE INDEX idx_shared_notes_note_id ON shared_notes(note_id);
```

## 🔧 API Layer Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **API Routes**: Next.js API routes for serverless functions
- **Validation**: Zod schemas (already in your stack)
- **ORM**: Prisma or Drizzle ORM
- **Database**: PostgreSQL with pgvector for vector search

### API Endpoints Structure

```typescript
// API Routes Structure
/api/
├── auth/
│   ├── login/           POST - User authentication
│   ├── register/        POST - User registration
│   ├── logout/          POST - User logout
│   └── refresh/         POST - Token refresh
├── notes/
│   ├── route.ts         GET, POST - List/create notes
│   ├── [id]/
│   │   ├── route.ts     GET, PUT, DELETE - CRUD operations
│   │   └── share/       POST - Share note
│   ├── search/          GET - Full-text search
│   └── bulk/            POST - Bulk operations
├── collections/
│   ├── route.ts         GET, POST - List/create collections
│   └── [id]/
│       ├── route.ts     GET, PUT, DELETE - CRUD operations
│       └── notes/       GET, POST - Collection notes
├── metadata/
│   └── extract/         POST - URL metadata extraction
└── upload/
    └── image/           POST - Image upload
```

### API Response Format
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## 🔐 Authentication & Authorization

### Authentication Strategy
- **Primary**: NextAuth.js with JWT tokens
- **Session Storage**: Database sessions for security
- **Password**: bcrypt hashing with salt rounds: 12

### Authorization Levels
1. **Public**: Shared notes (read-only)
2. **Authenticated**: User's own notes (full CRUD)
3. **Admin**: System administration (future)

### Security Measures
```typescript
// Middleware for API routes
export async function authMiddleware(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const user = await verifyJWT(token);
  if (!user) {
    return new Response('Invalid token', { status: 401 });
  }
  
  // Add user to request context
  req.user = user;
  return NextResponse.next();
}
```

## ⚡ Caching Strategy

### Multi-Layer Caching
1. **Browser Cache**: Static assets (24h)
2. **CDN Cache**: Images and public content (7d)
3. **Application Cache**: Redis for API responses (5m-1h)
4. **Database Cache**: PostgreSQL query cache

### Redis Cache Structure
```typescript
interface CacheKeys {
  userNotes: `user:${userId}:notes:${page}`;
  noteMetadata: `note:${noteId}:metadata`;
  urlMetadata: `url:${urlHash}:metadata`;
  userCollections: `user:${userId}:collections`;
  searchResults: `search:${queryHash}:${userId}`;
}
```

### Cache Invalidation Strategy
- **Write-through**: Update cache on write operations
- **TTL-based**: Automatic expiration
- **Tag-based**: Invalidate related cache entries

## 📁 File Storage Architecture

### Storage Providers
- **Primary**: Vercel Blob Storage (seamless with Vercel deployment)
- **Alternative**: AWS S3 + CloudFront
- **Local Development**: Local filesystem with multer

### File Organization
```
storage/
├── users/
│   └── {userId}/
│       ├── avatars/
│       └── uploads/
├── notes/
│   └── {noteId}/
│       ├── images/
│       └── attachments/
└── shared/
    └── favicons/
```

### Image Processing Pipeline
```typescript
interface ImageProcessor {
  original: string;      // Full resolution
  large: string;         // 1200px width
  medium: string;        // 600px width  
  thumbnail: string;     // 300px width
  webp: string;         // WebP format for modern browsers
}
```

## 🌐 Infrastructure & Deployment

### Recommended Stack for Production

#### Database
- **Provider**: Neon PostgreSQL or Railway PostgreSQL
- **Features**: Auto-scaling, backups, read replicas
- **Connection**: PgBouncer for connection pooling

#### Caching
- **Provider**: Upstash Redis
- **Features**: Serverless Redis, global edge locations

#### File Storage
- **Provider**: Vercel Blob
- **Features**: Global CDN, automatic optimization

#### Monitoring
- **Application**: Vercel Analytics + Sentry
- **Database**: Built-in provider monitoring
- **Logs**: Vercel Function logs

### Environment Configuration
```env
# Database
DATABASE_URL="postgresql://..."
DATABASE_POOL_SIZE=20

# Redis Cache
REDIS_URL="redis://..."

# File Storage
BLOB_READ_WRITE_TOKEN="..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="..."

# External Services
OPENAI_API_KEY="..."  # For AI-powered features
```

## 🔄 Data Migration Strategy

### Phase 1: Setup Infrastructure
1. Deploy PostgreSQL database
2. Set up Redis cache
3. Configure file storage
4. Deploy API endpoints

### Phase 2: Migrate Existing Data
```typescript
// Migration script for existing mock data
async function migrateToDatabase() {
  const mockNotes = getCurrentMockNotes();
  
  for (const note of mockNotes) {
    await createNote({
      userId: defaultUserId,
      type: note.type,
      title: note.title,
      content: note.content,
      url: note.url,
      // ... other fields
    });
  }
}
```

### Phase 3: Enable Real-time Features
- WebSocket connections for collaborative editing
- Server-sent events for real-time updates
- Optimistic UI updates

## 📈 Performance Optimization

### Database Optimization
- **Indexing**: Strategic indexes on query patterns
- **Partitioning**: By user_id for large datasets
- **Materialized Views**: For complex analytics queries

### API Optimization
- **Pagination**: Cursor-based for large datasets
- **Field Selection**: GraphQL-style field selection
- **Batch Operations**: Bulk create/update/delete

### Frontend Optimization
- **Infinite Scrolling**: Virtual scrolling for large note lists
- **Optimistic Updates**: Immediate UI feedback
- **Offline Support**: Service worker for offline access

## 🔮 Future Enhancements

### Advanced Features
1. **AI Integration**: Automatic tagging, content summarization
2. **Collaborative Editing**: Real-time collaborative notes
3. **Advanced Search**: Vector search with embeddings
4. **Export/Import**: Multiple format support
5. **API Gateway**: Rate limiting, analytics
6. **Microservices**: Service decomposition for scale

### Scaling Considerations
- **Horizontal Scaling**: Database read replicas
- **Caching**: Multi-region Redis clusters  
- **CDN**: Global content distribution
- **Search**: Elasticsearch for advanced search
- **Analytics**: ClickHouse for user analytics

---

This architecture provides a robust foundation for your MTr application while maintaining flexibility for future growth and feature additions.