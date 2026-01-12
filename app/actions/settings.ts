'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function updateTheme(theme: 'LIGHT' | 'DARK' | 'BASIC') {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Validate theme value
    if (!['LIGHT', 'DARK', 'BASIC'].includes(theme)) {
      return { success: false, error: 'Invalid theme value' };
    }

    // Check if user settings exist
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSettings) {
      // Update existing settings
      await prisma.userSettings.update({
        where: { userId: session.user.id },
        data: { theme },
      });
    } else {
      // Create new settings
      await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          theme,
        },
      });
    }

    return { success: true, theme };
  } catch (error) {
    console.error('Error updating theme:', error);
    return { success: false, error: 'Failed to update theme' };
  }
}

export async function getUserSettings() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          theme: 'BASIC',
        },
      });
    }

    return { success: true, settings };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return { success: false, error: 'Failed to fetch settings' };
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long' };
    }

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: 'Failed to change password' };
  }
}
