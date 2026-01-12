import { Role, Theme, Difficulty, QuestionType, TransactionType, AchievementCondition } from '@prisma/client'

export type {
  Role,
  Theme,
  Difficulty,
  QuestionType,
  TransactionType,
  AchievementCondition,
}

export interface User {
  id: string
  email: string
  name: string
  role: Role
  wisdomCoins: number
  selectedExpertId?: string
}

export interface Expert {
  id: string
  name: string
  personality: string
  communicationStyle: string
  appearance: string
}

export interface Lesson {
  id: string
  title: string
  content: string
  keyPoints: string[]
  difficulty: Difficulty
  subjectId: string
  creatorId: string
}

export interface Quiz {
  id: string
  lessonId: string
  questions: Question[]
}

export interface Question {
  id: string
  type: QuestionType
  text: string
  correctAnswer: any
  options?: any
  order: number
}
