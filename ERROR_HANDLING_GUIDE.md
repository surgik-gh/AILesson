# Error Handling and User Feedback Guide

This guide explains how to use the error handling and notification systems in the AILesson platform.

## Table of Contents

1. [Error Boundaries](#error-boundaries)
2. [Loading States](#loading-states)
3. [Toast Notifications](#toast-notifications)
4. [Best Practices](#best-practices)

## Error Boundaries

### Global Error Boundary

The application has three levels of error boundaries:

1. **Component-level Error Boundary** (`components/ui/ErrorBoundary.tsx`)
2. **Page-level Error Handler** (`app/error.tsx`)
3. **Global Error Handler** (`app/global-error.tsx`)

#### Using the ErrorBoundary Component

```tsx
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

function MyComponent() {
  return (
    <ErrorBoundary>
      <YourComponentThatMightError />
    </ErrorBoundary>
  );
}
```

#### Custom Fallback UI

```tsx
<ErrorBoundary
  fallback={
    <div>
      <h1>Oops! Something went wrong</h1>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  }
>
  <YourComponent />
</ErrorBoundary>
```

### Next.js Error Pages

- `app/error.tsx` - Catches errors in page components
- `app/global-error.tsx` - Catches errors in the root layout
- Both automatically log errors in development mode
- In production, errors should be sent to a monitoring service

## Loading States

### Loading Spinner

```tsx
import { LoadingSpinner, LoadingOverlay, LoadingButton } from '@/components/ui/LoadingSpinner';

// Basic spinner
<LoadingSpinner size="md" label="Loading..." />

// Full-screen overlay
<LoadingOverlay message="Processing..." />

// Button with loading state
<LoadingButton loading={isLoading} onClick={handleClick}>
  Submit
</LoadingButton>
```

### Skeleton Screens

```tsx
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonList, 
  SkeletonTable,
  SkeletonAvatar,
  SkeletonText 
} from '@/components/ui/Skeleton';

// Basic skeleton
<Skeleton variant="rectangular" width={200} height={100} />

// Pre-built skeletons
<SkeletonCard />
<SkeletonList count={5} />
<SkeletonTable rows={10} columns={4} />
<SkeletonAvatar size="lg" />
<SkeletonText lines={3} />
```

### Next.js Loading Pages

Create `loading.tsx` files in your route folders:

```tsx
// app/(dashboard)/student/lessons/loading.tsx
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function LessonsLoading() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
```

## Toast Notifications

### Basic Usage

```tsx
'use client';

import { useToast } from '@/lib/contexts/ToastContext';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Success!', 'Operation completed successfully');
  };

  const handleError = () => {
    toast.error('Error!', 'Something went wrong');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

### Using the Notification Hook

The `useNotification` hook provides pre-configured notifications for common actions:

```tsx
'use client';

import { useNotification } from '@/hooks/useNotification';

function QuizComponent() {
  const notify = useNotification();

  const handleCorrectAnswer = () => {
    notify.correctAnswer(); // Shows: "Правильно! 🎯 +2 монеты мудрости, +10 очков"
  };

  const handleIncorrectAnswer = () => {
    notify.incorrectAnswer(); // Shows: "Неправильно -1 очко в рейтинге"
  };

  const handlePerfectQuiz = () => {
    notify.perfectQuiz(); // Shows achievement notification
  };

  return (
    <div>
      <button onClick={handleCorrectAnswer}>Correct</button>
      <button onClick={handleIncorrectAnswer}>Incorrect</button>
    </div>
  );
}
```

### Available Notification Methods

#### Generic Notifications
- `notify.success(title, message?)`
- `notify.error(title, message?)`
- `notify.info(title, message?)`
- `notify.warning(title, message?)`

#### Achievement Notifications
- `notify.achievementUnlocked(achievementName)`
- `notify.perfectQuiz()`
- `notify.leaderboardWinner(coins)`

#### Coin Notifications
- `notify.coinsEarned(amount, reason?)`
- `notify.coinsSpent(amount, reason?)`
- `notify.insufficientCoins(required, current)`

#### Quiz Notifications
- `notify.correctAnswer()`
- `notify.incorrectAnswer()`
- `notify.quizCompleted(score)`

#### Lesson Notifications
- `notify.lessonCreated()`
- `notify.lessonShared(studentName)`

#### Expert Notifications
- `notify.expertGenerated(expertName)`
- `notify.expertSelected(expertName)`

#### Settings Notifications
- `notify.settingsSaved()`
- `notify.passwordChanged()`
- `notify.themeChanged(theme)`

#### Error Notifications
- `notify.networkError()`
- `notify.serverError()`
- `notify.unauthorized()`
- `notify.validationError(message)`
- `notify.aiError()`

### Custom Toast Configuration

```tsx
import { useToast } from '@/lib/contexts/ToastContext';

function MyComponent() {
  const { addToast } = useToast();

  const showCustomToast = () => {
    addToast({
      type: 'success',
      title: 'Custom Title',
      message: 'Custom message',
      duration: 10000, // 10 seconds
      icon: <CustomIcon />, // Optional custom icon
    });
  };

  return <button onClick={showCustomToast}>Show Custom Toast</button>;
}
```

## Best Practices

### 1. Error Handling in API Routes

```tsx
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body.requiredField) {
      return NextResponse.json(
        { success: false, error: 'Missing required field' },
        { status: 400 }
      );
    }

    // Process request
    const result = await processData(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API Error:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. Error Handling in Server Actions

```tsx
'use server';

import { getServerSession } from 'next-auth';

export async function myServerAction(data: FormData) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    // Process action
    const result = await processAction(data);

    return { success: true, data: result };
  } catch (error) {
    console.error('Server action error:', error);
    return { success: false, error: 'Operation failed' };
  }
}
```

### 3. Client-Side Error Handling with Notifications

```tsx
'use client';

import { useState } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { LoadingButton } from '@/components/ui/LoadingSpinner';

function MyForm() {
  const [loading, setLoading] = useState(false);
  const notify = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/example', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        notify.error('Error', result.error);
        return;
      }

      notify.success('Success!', 'Operation completed');
    } catch (error) {
      notify.networkError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <LoadingButton loading={loading} type="submit">
        Submit
      </LoadingButton>
    </form>
  );
}
```

### 4. Loading States for Async Operations

```tsx
'use client';

import { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SkeletonCard } from '@/components/ui/Skeleton';

function DataList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>{/* Render data */}</div>;
}
```

### 5. Accessibility Considerations

- All loading states include `aria-live="polite"` for screen readers
- Toast notifications use `role="alert"` and `aria-live="assertive"`
- Error messages are announced to screen readers
- Loading spinners include descriptive labels
- Focus management is handled automatically

### 6. Performance Considerations

- Toast notifications auto-dismiss after 5 seconds (configurable)
- Maximum of 5 toasts shown at once (oldest removed first)
- Skeleton screens use CSS animations (no JavaScript)
- Loading states are optimized for reduced motion preferences

## Testing

### Testing Error Boundaries

```tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('error boundary catches errors', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/что-то пошло не так/i)).toBeInTheDocument();
});
```

### Testing Toast Notifications

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider } from '@/lib/contexts/ToastContext';
import { useToast } from '@/lib/contexts/ToastContext';

const TestComponent = () => {
  const toast = useToast();
  return <button onClick={() => toast.success('Test')}>Show Toast</button>;
};

test('shows toast notification', () => {
  render(
    <ToastProvider>
      <TestComponent />
    </ToastProvider>
  );

  fireEvent.click(screen.getByText('Show Toast'));
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

## Demo Component

A demo component is available at `components/ui/NotificationDemo.tsx` that shows all notification types in action. You can temporarily add it to any page to test the notification system:

```tsx
import { NotificationDemo } from '@/components/ui/NotificationDemo';

export default function TestPage() {
  return <NotificationDemo />;
}
```

## Integration with Existing Code

To integrate notifications into existing components:

1. Import the notification hook:
   ```tsx
   import { useNotification } from '@/hooks/useNotification';
   ```

2. Use it in your component:
   ```tsx
   const notify = useNotification();
   ```

3. Call notification methods where appropriate:
   ```tsx
   // After successful operation
   notify.success('Success!', 'Operation completed');
   
   // After error
   notify.error('Error', error.message);
   
   // For specific actions
   notify.coinsEarned(2, 'Correct answer');
   ```

## Future Enhancements

- Integration with error tracking services (Sentry, LogRocket)
- Persistent notifications for critical errors
- Notification history/log
- User preferences for notification types
- Sound effects for achievements
- Haptic feedback on mobile devices
