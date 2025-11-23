# Phase 6: Advanced Navigation & AI Features

## Overview

Phase 6 focuses on advanced folder navigation, AI-powered features, and production hardening. This phase will transform the diary into an intelligent, context-aware journaling platform.

**Status**: 🟡 Planning  
**Start Date**: TBD  
**Estimated Duration**: 3-4 weeks  
**Complexity**: High

---

## Goals

1. **Advanced Folder Navigation** - Google Drive-style tree navigation
2. **AI Features** - Sentiment analysis, auto-tagging, insights
3. **Production Hardening** - Fix security warnings, optimize performance
4. **Enhanced Search** - Vector search, semantic search
5. **Collaboration** (Optional) - Share entries with trusted people

---

## Part 1: Advanced Folder Navigation 🗂️

### Priority: HIGH

### Current State
- Single folder per entry
- Dropdown folder selector
- Date-based auto-folders
- Limited folder hierarchy visualization

### Target State
- Multi-folder entry assignment (one entry in multiple folders)
- Tree view navigation with expand/collapse
- Breadcrumb navigation
- Context-aware folder suggestions
- Drag-and-drop folder organization

### Database Changes

#### 1.1 Many-to-Many Entry-Folder Relationship

**New Table**: `entry_folders`
```sql
CREATE TABLE entry_folders (
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (entry_id, folder_id)
);

-- Migrate existing data
INSERT INTO entry_folders (entry_id, folder_id)
SELECT id, folder_id 
FROM entries 
WHERE folder_id IS NOT NULL;

-- Add RLS policies
ALTER TABLE entry_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their entry folders"
  ON entry_folders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = entry_folders.entry_id 
      AND entries.user_id = auth.uid()
    )
  );
```

#### 1.2 Folder Metadata Enhancement

```sql
-- Add folder metadata
ALTER TABLE folders ADD COLUMN parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE;
ALTER TABLE folders ADD COLUMN is_expanded BOOLEAN DEFAULT false;
ALTER TABLE folders ADD COLUMN sort_order INTEGER DEFAULT 0;
ALTER TABLE folders ADD COLUMN is_pinned BOOLEAN DEFAULT false;

-- Index for hierarchy queries
CREATE INDEX idx_folders_parent ON folders(parent_folder_id);
CREATE INDEX idx_folders_user_parent ON folders(user_id, parent_folder_id);
```

### UI Components

#### 1.3 FolderTreeView Component

**File**: `components/folders/FolderTreeView.tsx`

```tsx
interface FolderNode {
  id: string
  name: string
  icon: string
  color: string
  parent_id: string | null
  children: FolderNode[]
  entry_count: number
  is_expanded: boolean
}

export function FolderTreeView({
  folders,
  selectedFolders,
  onFolderSelect,
  onFolderExpand
}: FolderTreeViewProps) {
  return (
    <div className="folder-tree">
      {buildTree(folders).map(node => (
        <FolderTreeNode 
          key={node.id}
          node={node}
          level={0}
          selected={selectedFolders.includes(node.id)}
          onSelect={onFolderSelect}
          onExpand={onFolderExpand}
        />
      ))}
    </div>
  )
}
```

#### 1.4 MultiFolderSelector Component

**File**: `components/folders/MultiFolderSelector.tsx`

```tsx
export function MultiFolderSelector({
  selectedFolders,
  onChange
}: MultiFolderSelectorProps) {
  return (
    <div className="multi-folder-selector">
      <div className="selected-folders">
        {selectedFolders.map(folder => (
          <FolderChip 
            key={folder.id}
            folder={folder}
            onRemove={() => removeFolder(folder.id)}
          />
        ))}
      </div>
      
      <button onClick={openFolderModal}>
        <FolderPlus /> Add to Folder
      </button>
      
      {isModalOpen && (
        <FolderTreeModal
          selectedFolders={selectedFolders}
          onSelect={handleFolderSelect}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
```

#### 1.5 Breadcrumb Navigation

**File**: `components/navigation/FolderBreadcrumbs.tsx`

```tsx
export function FolderBreadcrumbs({ 
  currentFolderId 
}: FolderBreadcrumbsProps) {
  const path = useFolderPath(currentFolderId)
  
  return (
    <nav className="breadcrumbs">
      <Link href="/app">
        <Home /> Home
      </Link>
      {path.map((folder, index) => (
        <Fragment key={folder.id}>
          <ChevronRight />
          <Link href={`/app/folder/${folder.id}`}>
            <span>{folder.icon}</span> {folder.name}
          </Link>
        </Fragment>
      ))}
    </nav>
  )
}
```

### Features

- **Tree Navigation**: Expandable/collapsible folder hierarchy
- **Multi-Select**: Assign entries to multiple folders
- **Drag & Drop**: Move entries between folders
- **Breadcrumbs**: Always know your location
- **Quick Access**: Pin favorite folders
- **Smart Suggestions**: Based on entry content and history

---

## Part 2: AI-Powered Features 🤖

### Priority: MEDIUM-HIGH

### 2.1 Sentiment Analysis

**Goal**: Automatically detect emotional tone of entries

**Implementation**:
```typescript
// lib/ai/sentiment.ts
export async function analyzeSentiment(content: string) {
  // Option 1: OpenAI API
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'system',
      content: 'Analyze the sentiment and return: positive/negative/neutral with confidence score'
    }, {
      role: 'user',
      content
    }]
  })
  
  // Option 2: Local model (sentiment-node)
  const sentiment = Sentiment.analyze(content)
  
  return {
    sentiment: sentiment.score > 0 ? 'positive' : sentiment.score < 0 ? 'negative' : 'neutral',
    confidence: Math.abs(sentiment.score) / 10,
    emotions: detectEmotions(content) // joy, sadness, anger, fear, surprise
  }
}
```

**Database**:
```sql
ALTER TABLE entries ADD COLUMN ai_sentiment VARCHAR(20);
ALTER TABLE entries ADD COLUMN ai_emotions JSONB;
ALTER TABLE entries ADD COLUMN ai_confidence DECIMAL(3,2);
```

### 2.2 Auto-Tagging

**Goal**: Suggest tags based on entry content

```typescript
// lib/ai/auto-tag.ts
export async function suggestTags(content: string, existingTags: string[]) {
  const prompt = `
    Analyze this diary entry and suggest 3-5 relevant tags.
    Existing user tags: ${existingTags.join(', ')}
    
    Entry: ${content}
    
    Return only tag names, comma-separated.
  `
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  })
  
  return response.choices[0].message.content.split(',').map(t => t.trim())
}
```

### 2.3 Writing Insights

**Goal**: Provide feedback on writing patterns

```typescript
// lib/ai/insights.ts
export async function generateInsights(entries: Entry[]) {
  return {
    writingStyle: analyzeWritingStyle(entries),
    commonThemes: extractThemes(entries),
    emotionalPatterns: analyzeEmotionalPatterns(entries),
    growthMetrics: calculateGrowthMetrics(entries),
    recommendations: generateRecommendations(entries)
  }
}
```

**Features**:
- Writing style analysis (formal, casual, poetic)
- Common themes and topics
- Emotional patterns over time
- Word usage statistics
- Readability scores
- Growth tracking

### 2.4 Smart Prompts

**Goal**: AI-generated writing prompts based on history

```typescript
export async function generatePrompts(userContext: UserContext) {
  const prompt = `
    Based on the user's recent entries, suggest 3 thoughtful journal prompts.
    
    Recent themes: ${userContext.themes}
    Current mood trend: ${userContext.moodTrend}
    Days since last entry: ${userContext.daysSinceLastEntry}
    
    Generate prompts that encourage reflection and growth.
  `
  
  // Return personalized prompts
}
```

---

## Part 3: Production Hardening 🔒

### Priority: HIGH (Security Critical)

### 3.1 Fix Security Definer View

**Issue**: `story_stats` view has security definer without proper constraints

**Fix**:
```sql
DROP VIEW IF EXISTS story_stats;

CREATE VIEW story_stats 
WITH (security_invoker = true) -- Use security invoker instead
AS
SELECT 
  s.id,
  s.title,
  COUNT(se.entry_id) as entry_count,
  MIN(e.entry_date) as earliest_entry,
  MAX(e.entry_date) as latest_entry
FROM stories s
LEFT JOIN story_entries se ON s.id = se.story_id
LEFT JOIN entries e ON se.entry_id = e.id
WHERE s.user_id = auth.uid() -- Critical: Filter by current user
GROUP BY s.id, s.title;
```

### 3.2 Fix Function Search Path Issues

**Issue**: Functions don't explicitly set search_path

**Fix**: Add `SECURITY DEFINER SET search_path = public` to all functions

```sql
-- Example fix
CREATE OR REPLACE FUNCTION search_entries(...)
RETURNS TABLE (...)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp -- Explicitly set search path
AS $$
BEGIN
  -- function body
END;
$$;
```

### 3.3 Enable Leaked Password Protection

**Supabase Dashboard**:
1. Go to Authentication > Settings
2. Enable "Leaked Password Protection"
3. Uses HaveIBeenPwned API to check passwords

### 3.4 Fix Auth RLS Initialization Warnings

**Issue**: RLS policies reference auth.uid() which might fail in some contexts

**Fix**: Add default policies for anonymous access where needed

```sql
-- Example: Allow anonymous read of public stories
CREATE POLICY "Allow public read of public stories"
  ON stories FOR SELECT
  USING (is_public = true OR user_id = COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid));
```

### 3.5 Remove Duplicate Index

**Check and remove**:
```sql
-- Find duplicate indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename = 'entries'
ORDER BY indexname;

-- Drop duplicates (keep one)
DROP INDEX IF EXISTS entries_duplicate_index_name;
```

### 3.6 Fix Multiple Permissive Policies

**Issue**: Multiple policies on `entries` table can conflict

**Solution**: Consolidate policies

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own entries" ON entries;
DROP POLICY IF EXISTS "Users can create own entries" ON entries;
DROP POLICY IF EXISTS "Users can update own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON entries;

-- Single comprehensive policy
CREATE POLICY "Users manage their own entries"
  ON entries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## Part 4: Enhanced Search 🔍

### Priority: MEDIUM

### 4.1 Vector Search (Semantic Search)

**Goal**: Search by meaning, not just keywords

**Setup**:
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column
ALTER TABLE entries ADD COLUMN embedding vector(1536);

-- Create index
CREATE INDEX ON entries USING ivfflat (embedding vector_cosine_ops);
```

**Generate embeddings**:
```typescript
// lib/ai/embeddings.ts
export async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  })
  
  return response.data[0].embedding
}
```

**Semantic search**:
```sql
CREATE FUNCTION semantic_search(
  query_embedding vector(1536),
  user_id_param UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.content,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM entries e
  WHERE e.user_id = user_id_param
  ORDER BY e.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Hybrid Search

Combine full-text + semantic search for best results:

```typescript
export async function hybridSearch(query: string, userId: string) {
  // 1. Full-text search
  const textResults = await supabase.rpc('search_entries', { 
    search_query: query,
    user_id_param: userId 
  })
  
  // 2. Semantic search
  const embedding = await generateEmbedding(query)
  const semanticResults = await supabase.rpc('semantic_search', {
    query_embedding: embedding,
    user_id_param: userId
  })
  
  // 3. Merge and rank
  return mergeResults(textResults, semanticResults)
}
```

---

## Part 5: Collaboration (Optional) 🤝

### Priority: LOW

### 5.1 Share Entries

**Database**:
```sql
CREATE TABLE shared_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id),
  shared_with UUID REFERENCES auth.users(id),
  permission VARCHAR(20) DEFAULT 'view', -- view, comment
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow shared access
CREATE POLICY "View shared entries"
  ON entries FOR SELECT
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM shared_entries 
      WHERE entry_id = entries.id 
      AND shared_with = auth.uid()
      AND (expires_at IS NULL OR expires_at > now())
    )
  );
```

### 5.2 Comments on Shared Entries

```sql
CREATE TABLE entry_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Implementation Roadmap

### Week 1: Advanced Folder Navigation
- [ ] Create entry_folders junction table
- [ ] Migrate existing data
- [ ] Build FolderTreeView component
- [ ] Build MultiFolderSelector component
- [ ] Implement breadcrumb navigation
- [ ] Add drag-and-drop support

### Week 2: AI Features Foundation
- [ ] Set up OpenAI API integration
- [ ] Implement sentiment analysis
- [ ] Build auto-tagging system
- [ ] Create AI insights dashboard
- [ ] Add smart writing prompts

### Week 3: Production Hardening
- [ ] Fix all security warnings
- [ ] Consolidate RLS policies
- [ ] Add proper function security
- [ ] Enable password protection
- [ ] Remove duplicate indexes
- [ ] Performance optimization

### Week 4: Enhanced Search & Polish
- [ ] Set up pgvector extension
- [ ] Generate embeddings for entries
- [ ] Implement semantic search
- [ ] Build hybrid search
- [ ] UI polish and bug fixes
- [ ] Documentation updates

---

## Technical Requirements

### APIs & Services
- **OpenAI API** (or alternative: Anthropic Claude, local models)
- **pgvector extension** for Supabase
- **Stripe** (if adding premium AI features)

### Environment Variables
```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_AI_MODEL=gpt-4
```

### Database Requirements
- PostgreSQL 14+ with pgvector extension
- Additional 2-3 GB storage for embeddings
- Increased function timeout for AI processing

---

## Cost Estimates

### OpenAI API Costs
- **Embeddings**: ~$0.0004 per entry (one-time)
- **Sentiment Analysis**: ~$0.002 per entry
- **Auto-tagging**: ~$0.003 per entry
- **Insights**: ~$0.01 per analysis

**Example**: 1000 entries/month = ~$6-8/month

### Alternatives (Free/Cheaper)
- **Sentiment**: Use `sentiment` npm package (free, local)
- **Embeddings**: Use `@xenova/transformers` (free, local)
- **Auto-tag**: Rule-based extraction (free)

---

## Success Metrics

- [ ] Multi-folder navigation working smoothly
- [ ] AI sentiment accuracy > 80%
- [ ] Auto-tag relevance > 75%
- [ ] Zero critical security warnings
- [ ] Search response time < 500ms
- [ ] User satisfaction score > 4.5/5

---

## Risks & Mitigation

### Risk 1: AI Costs
**Mitigation**: 
- Implement caching
- Use local models for simple tasks
- Add rate limiting
- Offer as premium feature

### Risk 2: Performance Degradation
**Mitigation**:
- Background processing for AI
- Incremental embedding generation
- Database query optimization
- CDN for static assets

### Risk 3: Security Vulnerabilities
**Mitigation**:
- Fix all warnings before launch
- Regular security audits
- Penetration testing
- Keep dependencies updated

---

## Future Enhancements (Phase 7+)

- Voice journaling with transcription
- Mobile native apps (iOS, Android)
- Photo gallery with AI organization
- Habit tracking integration
- Goal tracking with progress charts
- Calendar integration (Google, Outlook)
- Export to PDF books
- Journaling challenges/prompts community

---

**Document Version**: 1.0  
**Last Updated**: November 23, 2025  
**Status**: Planning Phase  
**Next Review**: Upon Phase 5 completion verification
