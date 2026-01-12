# SWR Data Fetching and Caching Guide

## Overview

This application uses [SWR](https://swr.vercel.app/) for data fetching and caching. SWR provides:
- Automatic caching
- Revalidation on focus/reconnect
- Optimistic updates
- Request deduplication
- Automatic error retry

## Setup

### 1. Add SWR Provider to Root Layout

```typescript
// app/layout.tsx
import { SWRProvider } from '@/lib/providers/SWRProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SWRProvider>
          {children}
        </SWRProvider>
      </body>
    </html>
  );
}
```

## Available Hooks

### Lessons

#### useAvailableLessons
Fetch all available lessons for the current user.

```typescript
import { useAvailableLessons } from '@/lib/hooks/useSWR';

function LessonsPage() {
  const { lessons, isLoading, isError, revalidate } = useAvailableLessons();
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading lessons</div>;
  
  return (
    <div>
      {lessons?.map(lesson => (
        <div key={lesson.id}>{lesson.title}</div>
      ))}
      <button onClick={() => revalidate()}>Refresh</button>
    </div>
  );
}
```

#### useLesson
Fetch a specific lesson with its quiz.

```typescript
import { useLesson } from '@/lib/hooks/useSWR';

function LessonDetailPage({ lessonId }: { lessonId: string }) {
  const { lesson, quiz, isLoading, isError } = useLesson(lessonId);
  
  if (isLoading) return <div>Loading lesson...</div>;
  if (isError) return <div>Error loading lesson</div>;
  
  return (
    <div>
      <h1>{lesson?.title}</h1>
      <p>{lesson?.content}</p>
      {quiz && <QuizComponent quiz={quiz} />}
    </div>
  );
}
```

### Experts

#### useSelectedExpert
Fetch the user's currently selected expert.

```typescript
import { useSelectedExpert } from '@/lib/hooks/useSWR';

function ChatPage() {
  const { expert, isLoading, isError } = useSelectedExpert();
  
  if (isLoading) return <div>Loading expert...</div>;
  if (!expert) return <div>No expert selected</div>;
  
  return <ExpertAvatar expert={expert} />;
}
```

#### useExperts
Fetch all available experts.

```typescript
import { useExperts } from '@/lib/hooks/useSWR';

function ExpertSelectionPage() {
  const { experts, isLoading, isError } = useExperts();
  
  return (
    <div>
      {experts?.map(expert => (
        <ExpertCard key={expert.id} expert={expert} />
      ))}
    </div>
  );
}
```

### Leaderboard

#### useLeaderboard
Fetch leaderboard data with automatic refresh every 30 seconds.

```typescript
import { useLeaderboard } from '@/lib/hooks/useSWR';

function LeaderboardPage() {
  const { leaderboard, currentUser, isLoading } = useLeaderboard();
  
  return (
    <div>
      <h2>Your Position: {currentUser?.position}</h2>
      {leaderboard?.map((entry, index) => (
        <div key={entry.id}>
          {index + 1}. {entry.user.name} - {entry.score} points
        </div>
      ))}
    </div>
  );
}
```

### Chat

#### useChatHistory
Fetch chat message history.

```typescript
import { useChatHistory } from '@/lib/hooks/useSWR';

function ChatComponent() {
  const { messages, isLoading, revalidate } = useChatHistory();
  
  // Revalidate after sending a new message
  const sendMessage = async (content: string) => {
    await fetch('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    
    // Refresh chat history
    revalidate();
  };
  
  return (
    <div>
      {messages?.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

## Advanced Usage

### Optimistic Updates

Update the UI immediately before the server responds.

```typescript
import { optimisticUpdate } from '@/lib/hooks/useSWR';

async function likeLesson(lessonId: string) {
  // Optimistically update the UI
  optimisticUpdate(
    '/api/lessons/available',
    (data: { lessons: Lesson[] }) => ({
      lessons: data.lessons.map(lesson =>
        lesson.id === lessonId
          ? { ...lesson, likes: lesson.likes + 1 }
          : lesson
      ),
    }),
    false // Don't revalidate immediately
  );
  
  // Send request to server
  await fetch(`/api/lessons/${lessonId}/like`, { method: 'POST' });
  
  // Revalidate to get the actual data
  invalidateCache('/api/lessons/available');
}
```

### Cache Invalidation

Manually invalidate cache when data changes.

```typescript
import { invalidateCache } from '@/lib/hooks/useSWR';

async function createLesson(lessonData: any) {
  const response = await fetch('/api/lessons/create', {
    method: 'POST',
    body: JSON.stringify(lessonData),
  });
  
  // Invalidate lessons cache to refetch
  await invalidateCache('/api/lessons/available');
  await invalidateCache('/api/lessons/my-lessons');
  
  return response.json();
}
```

### Prefetching Data

Prefetch data before it's needed (e.g., on hover).

```typescript
import { prefetchData } from '@/lib/hooks/useSWR';

function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <div
      onMouseEnter={() => {
        // Prefetch lesson details on hover
        prefetchData(`/api/lessons/${lesson.id}`);
      }}
    >
      <Link href={`/lessons/${lesson.id}`}>
        {lesson.title}
      </Link>
    </div>
  );
}
```

### Conditional Fetching

Only fetch when certain conditions are met.

```typescript
import { useLesson } from '@/lib/hooks/useSWR';

function ConditionalFetch({ shouldFetch, lessonId }: { 
  shouldFetch: boolean; 
  lessonId: string;
}) {
  // Pass null to disable fetching
  const { lesson, isLoading } = useLesson(
    shouldFetch ? lessonId : null
  );
  
  return <div>{lesson?.title}</div>;
}
```

### Custom Configuration

Override default configuration for specific hooks.

```typescript
import { useAvailableLessons } from '@/lib/hooks/useSWR';

function LessonsPage() {
  const { lessons } = useAvailableLessons({
    refreshInterval: 10000, // Refresh every 10 seconds
    revalidateOnFocus: true, // Revalidate when window gains focus
    dedupingInterval: 5000, // Dedupe requests within 5 seconds
  });
  
  return <div>{/* ... */}</div>;
}
```

## Best Practices

### ✅ DO

1. **Use SWR for all data fetching**
   ```typescript
   // Good
   const { lessons } = useAvailableLessons();
   
   // Avoid
   const [lessons, setLessons] = useState([]);
   useEffect(() => {
     fetch('/api/lessons').then(r => r.json()).then(setLessons);
   }, []);
   ```

2. **Invalidate cache after mutations**
   ```typescript
   await createLesson(data);
   invalidateCache('/api/lessons/available');
   ```

3. **Use optimistic updates for better UX**
   ```typescript
   optimisticUpdate('/api/lessons', updateFn);
   await mutateData();
   ```

4. **Prefetch on hover for instant navigation**
   ```typescript
   onMouseEnter={() => prefetchData(`/api/lessons/${id}`)}
   ```

### ❌ DON'T

1. **Don't fetch the same data multiple times**
   ```typescript
   // Bad - fetches twice
   const { lessons: lessons1 } = useAvailableLessons();
   const { lessons: lessons2 } = useAvailableLessons();
   
   // Good - SWR deduplicates automatically
   const { lessons } = useAvailableLessons();
   ```

2. **Don't forget to handle loading and error states**
   ```typescript
   // Bad
   const { lessons } = useAvailableLessons();
   return <div>{lessons.map(...)}</div>; // Crashes if lessons is undefined
   
   // Good
   const { lessons, isLoading, isError } = useAvailableLessons();
   if (isLoading) return <Loading />;
   if (isError) return <Error />;
   return <div>{lessons?.map(...)}</div>;
   ```

3. **Don't use SWR for mutations**
   ```typescript
   // Bad - SWR is for fetching, not mutations
   const { data } = useSWR('/api/lessons/create', () => createLesson());
   
   // Good - Use regular fetch for mutations
   const createLesson = async () => {
     await fetch('/api/lessons/create', { method: 'POST', ... });
     invalidateCache('/api/lessons/available');
   };
   ```

## Performance Tips

1. **Use conditional fetching** to avoid unnecessary requests
2. **Implement pagination** for large datasets
3. **Use `dedupingInterval`** to prevent duplicate requests
4. **Prefetch data** on hover or route change
5. **Use optimistic updates** for instant feedback
6. **Configure `refreshInterval`** based on data freshness needs

## Debugging

### Enable SWR DevTools

```typescript
import { SWRConfig } from 'swr';

<SWRConfig value={{ 
  onError: (error, key) => console.error('SWR Error:', key, error),
  onSuccess: (data, key) => console.log('SWR Success:', key, data),
}}>
  {children}
</SWRConfig>
```

### Check Cache State

```typescript
import { cache } from 'swr';

// View all cached keys
console.log(Array.from(cache.keys()));

// View specific cache entry
console.log(cache.get('/api/lessons/available'));
```

## Migration from useState/useEffect

### Before
```typescript
function LessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch('/api/lessons/available')
      .then(r => r.json())
      .then(data => {
        setLessons(data.lessons);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;
  
  return <div>{lessons.map(...)}</div>;
}
```

### After
```typescript
function LessonsPage() {
  const { lessons, isLoading, isError } = useAvailableLessons();
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  
  return <div>{lessons?.map(...)}</div>;
}
```

Benefits:
- ✅ Automatic caching
- ✅ Automatic revalidation
- ✅ Request deduplication
- ✅ Error retry
- ✅ Less code
- ✅ Better performance
