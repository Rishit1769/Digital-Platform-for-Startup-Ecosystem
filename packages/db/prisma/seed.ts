import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertUserWithProfile(input: {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'mentor' | 'student';
  startupIntent?: 'has_startup' | 'finding_startup';
  profile: {
    bio?: string;
    designation?: string;
    expertise?: string;
    yearsOfExperience?: number;
    college?: string;
    skills?: string[];
  };
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      passwordHash,
      name: input.name,
      role: input.role,
      startupIntent: input.startupIntent,
      isVerified: true,
      isEmailVerified: true,
    },
    create: {
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
      startupIntent: input.startupIntent,
      isVerified: true,
      isEmailVerified: true,
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: input.profile,
    create: {
      userId: user.id,
      ...input.profile,
    },
  });

  return user;
}

async function main() {
  console.log('Seeding database...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@startup-ecosystem.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'Platform Admin';

  await upsertUserWithProfile({
    email: adminEmail,
    password: adminPassword,
    name: adminName,
    role: 'admin',
    profile: {
      bio: 'Platform administrator',
      designation: 'System Admin',
    },
  });
  console.log(`Admin user synced: ${adminEmail}`);

  await upsertUserWithProfile({
    email: 'mentor@startup-ecosystem.com',
    password: 'Mentor@123',
    name: 'Sample Mentor',
    role: 'mentor',
    profile: {
      bio: 'Experienced startup mentor with 10+ years in the industry',
      expertise: 'Product Strategy, Fundraising, Growth',
      yearsOfExperience: 10,
    },
  });
  console.log('Sample mentor synced: mentor@startup-ecosystem.com');

  await upsertUserWithProfile({
    email: 'student@startup-ecosystem.com',
    password: 'Student@123',
    name: 'Sample Student',
    role: 'student',
    startupIntent: 'has_startup',
    profile: {
      bio: 'Aspiring entrepreneur passionate about building tech solutions',
      college: 'Tech University',
      skills: ['JavaScript', 'React', 'Node.js', 'Product Management'],
    },
  });
  console.log('Sample student synced: student@startup-ecosystem.com');

  console.log('Seeding complete.');
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
