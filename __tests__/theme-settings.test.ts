import fc from 'fast-check';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

// Feature: ailesson-platform, Property 26: Theme validation
// Feature: ailesson-platform, Property 27: Theme persistence
// Feature: ailesson-platform, Property 28: Password change functionality

describe('Theme and Settings Property Tests', () => {
  // Clean up test data after each test
  afterEach(async () => {
    // Delete in correct order to respect foreign key constraints
    await prisma.userSettings.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test-theme-',
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-theme-',
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Property 26: Theme validation
  test('Property 26: For any UserSettings record, the theme field must be one of: LIGHT, DARK, or BASIC', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress().map(email => `test-theme-${email}`),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          password: fc.string({ minLength: 8, maxLength: 50 }),
          theme: fc.constantFrom('LIGHT', 'DARK', 'BASIC'),
        }),
        async (userData) => {
          // Create a test user
          const hashedPassword = await bcrypt.hash(userData.password, 4);
          const user = await prisma.user.create({
            data: {
              email: userData.email,
              name: userData.name,
              password: hashedPassword,
              role: 'STUDENT',
              wisdomCoins: 150,
            },
          });

          // Create user settings with the theme
          const settings = await prisma.userSettings.create({
            data: {
              userId: user.id,
              theme: userData.theme as 'LIGHT' | 'DARK' | 'BASIC',
            },
          });

          // Verify the theme is one of the valid values
          expect(['LIGHT', 'DARK', 'BASIC']).toContain(settings.theme);
          expect(settings.theme).toBe(userData.theme);
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  // Property 27: Theme persistence
  test('Property 27: For any user changing their theme preference, the new theme value should persist across sessions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress().map(email => `test-theme-${email}`),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          password: fc.string({ minLength: 8, maxLength: 50 }),
          initialTheme: fc.constantFrom('LIGHT', 'DARK', 'BASIC'),
          newTheme: fc.constantFrom('LIGHT', 'DARK', 'BASIC'),
        }),
        async (userData) => {
          // Create a test user
          const hashedPassword = await bcrypt.hash(userData.password, 4);
          const user = await prisma.user.create({
            data: {
              email: userData.email,
              name: userData.name,
              password: hashedPassword,
              role: 'STUDENT',
              wisdomCoins: 150,
            },
          });

          // Create initial settings
          await prisma.userSettings.create({
            data: {
              userId: user.id,
              theme: userData.initialTheme as 'LIGHT' | 'DARK' | 'BASIC',
            },
          });

          // Update theme (simulating user changing preference)
          await prisma.userSettings.update({
            where: { userId: user.id },
            data: { theme: userData.newTheme as 'LIGHT' | 'DARK' | 'BASIC' },
          });

          // Fetch settings again (simulating new session)
          const persistedSettings = await prisma.userSettings.findUnique({
            where: { userId: user.id },
          });

          // Verify the new theme persisted
          expect(persistedSettings).not.toBeNull();
          expect(persistedSettings?.theme).toBe(userData.newTheme);
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  // Property 28: Password change functionality
  test('Property 28: For any user changing their password with correct current password, the new password should be hashed and stored', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress().map(email => `test-theme-${email}`),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          currentPassword: fc.string({ minLength: 8, maxLength: 50 }),
          newPassword: fc.string({ minLength: 8, maxLength: 50 }),
        }),
        async (userData) => {
          // Create a test user with current password (use lower rounds for testing speed)
          const hashedCurrentPassword = await bcrypt.hash(userData.currentPassword, 4);
          const user = await prisma.user.create({
            data: {
              email: userData.email,
              name: userData.name,
              password: hashedCurrentPassword,
              role: 'STUDENT',
              wisdomCoins: 150,
            },
          });

          // Verify current password works
          const currentPasswordValid = await bcrypt.compare(
            userData.currentPassword,
            user.password
          );
          expect(currentPasswordValid).toBe(true);

          // Change password (simulating password change action)
          const hashedNewPassword = await bcrypt.hash(userData.newPassword, 4);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
          });

          // Fetch user again
          const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
          });

          // Verify new password works
          expect(updatedUser).not.toBeNull();
          const newPasswordValid = await bcrypt.compare(
            userData.newPassword,
            updatedUser!.password
          );
          expect(newPasswordValid).toBe(true);

          // Verify old password no longer works
          const oldPasswordStillValid = await bcrypt.compare(
            userData.currentPassword,
            updatedUser!.password
          );
          expect(oldPasswordStillValid).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);
});
