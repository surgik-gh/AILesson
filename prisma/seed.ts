import { prisma } from '../lib/db/prisma';
import * as bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting database seed...');

  // Seed Subjects
  console.log('Seeding subjects...');
  const subjects = [
    { name: 'Mathematics', description: 'Mathematical concepts and problem solving', icon: '🔢' },
    { name: 'Physics', description: 'Physical laws and phenomena', icon: '⚛️' },
    { name: 'Chemistry', description: 'Chemical reactions and compounds', icon: '🧪' },
    { name: 'Biology', description: 'Living organisms and life processes', icon: '🧬' },
    { name: 'Computer Science', description: 'Programming and computational thinking', icon: '💻' },
    { name: 'History', description: 'Historical events and civilizations', icon: '📜' },
    { name: 'Literature', description: 'Literary works and analysis', icon: '📚' },
    { name: 'Geography', description: 'Earth sciences and world geography', icon: '🌍' },
    { name: 'English', description: 'English language and grammar', icon: '🇬🇧' },
    { name: 'Art', description: 'Visual arts and creativity', icon: '🎨' },
  ];

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { name: subject.name },
      update: {},
      create: subject,
    });
  }
  console.log(`✓ Created ${subjects.length} subjects`);

  // Seed Achievements
  console.log('Seeding achievements...');
  const achievements = [
    {
      name: 'first_quiz',
      description: 'Complete your first quiz',
      condition: 'FIRST_QUIZ' as const,
      icon: '🎯',
    },
    {
      name: 'perfect_quiz',
      description: 'Complete a quiz with 100% correct answers',
      condition: 'PERFECT_QUIZ' as const,
      icon: '💯',
    },
    {
      name: 'ten_quizzes',
      description: 'Complete 10 quizzes',
      condition: 'TEN_QUIZZES' as const,
      icon: '🔟',
    },
    {
      name: 'fifty_quizzes',
      description: 'Complete 50 quizzes',
      condition: 'FIFTY_QUIZZES' as const,
      icon: '⭐',
    },
    {
      name: 'hundred_quizzes',
      description: 'Complete 100 quizzes',
      condition: 'HUNDRED_QUIZZES' as const,
      icon: '🏆',
    },
    {
      name: 'daily_streak_7',
      description: 'Maintain a 7-day learning streak',
      condition: 'DAILY_STREAK_7' as const,
      icon: '🔥',
    },
    {
      name: 'daily_streak_30',
      description: 'Maintain a 30-day learning streak',
      condition: 'DAILY_STREAK_30' as const,
      icon: '💪',
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement,
    });
  }
  console.log(`✓ Created ${achievements.length} achievements`);

  // Seed Admin Account
  console.log('Seeding admin account...');
  const hashedPassword = await bcrypt.hash('123456789', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ailesson.com' },
    update: {},
    create: {
      email: 'admin@ailesson.com',
      password: hashedPassword,
      name: 'админ228',
      role: 'ADMIN',
      wisdomCoins: 999999, // Unlimited coins for admin
    },
  });

  // Create initial token transaction for admin
  await prisma.tokenTransaction.create({
    data: {
      userId: admin.id,
      amount: 999999,
      type: 'INITIAL',
      description: 'Admin account initial allocation',
    },
  });

  console.log('✓ Created admin account');
  console.log('  Email: admin@ailesson.com');
  console.log('  Username: админ228');
  console.log('  Password: 123456789');

  console.log('\nDatabase seed completed successfully! 🎉');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
