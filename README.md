# AILesson Platform

A gamified educational platform with modern 3D design, built with Next.js 14+, React Three Fiber, and AI-powered content generation.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript
- **3D Graphics**: React Three Fiber, Three.js, @react-three/drei
- **Styling**: Tailwind CSS, Framer Motion
- **AI Services**: OpenRouter, Groq API
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Testing**: Jest, fast-check (property-based testing), React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your database URL and API keys

4. Set up the database:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Project Structure

```
ailesson-platform/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── 3d/                # 3D components (React Three Fiber)
│   ├── ui/                # UI components
│   ├── lessons/           # Lesson-related components
│   ├── quiz/              # Quiz components
│   └── chat/              # Chat components
├── lib/                   # Utility functions and services
│   ├── ai/               # AI service integrations
│   ├── db/               # Database utilities
│   └── auth/             # Authentication configuration
├── prisma/               # Prisma schema and migrations
├── types/                # TypeScript type definitions
└── public/               # Static assets
    └── models/           # 3D models for avatars
```

## Features

- User registration with role-based access (Student, Teacher, Admin)
- Personalized AI expert avatars
- AI-powered lesson generation from various sources
- Automatic quiz generation
- Gamification with wisdom coins and achievements
- Daily leaderboard system
- 3D UI with modern design
- Chat with AI experts
- Progress tracking for teachers
- Admin panel for platform management

## License

This project is developed by students of MAOU Lyceum 7.
