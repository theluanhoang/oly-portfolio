import prisma from './prisma';
import bcrypt from 'bcryptjs';

let initPromise: Promise<void> | null = null;
let isInitialized = false;

export async function initAdmin() {
  if (isInitialized) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const existingAdmin = await prisma.user.findUnique({
        where: { username: adminUsername },
      });

      if (existingAdmin) {
        console.log('[INIT] Admin user already exists');
        isInitialized = true;
        return;
      }

      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@oly-studio.com';
      
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await prisma.user.create({
        data: {
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
        },
      });

      console.log('[INIT] Admin user created successfully');
      isInitialized = true;
    } catch (error) {
      console.error('[INIT] Error initializing admin user:', error);
      isInitialized = true;
    }
  })();

  return initPromise;
}

