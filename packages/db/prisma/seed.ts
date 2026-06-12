import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@startup-ecosystem.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'Platform Admin';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: 'admin',
        isVerified: true,
        isEmailVerified: true,
      },
    });

    await prisma.userProfile.create({
      data: {
        userId: admin.id,
        bio: 'Platform administrator',
        designation: 'System Admin',
      },
    });

    console.log(`✅ Admin user created: ${adminEmail}`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  // Create sample mentor if not exists
  const mentorEmail = 'mentor@startup-ecosystem.com';
  const existingMentor = await prisma.user.findUnique({
    where: { email: mentorEmail },
  });

  if (!existingMentor) {
    const passwordHash = await bcrypt.hash('Mentor@123', 12);

    const mentor = await prisma.user.create({
      data: {
        email: mentorEmail,
        passwordHash,
        name: 'Sample Mentor',
        role: 'mentor',
        isVerified: true,
        isEmailVerified: true,
      },
    });

    await prisma.userProfile.create({
      data: {
        userId: mentor.id,
        bio: 'Experienced startup mentor with 10+ years in the industry',
        expertise: 'Product Strategy, Fundraising, Growth',
        yearsOfExperience: 10,
      },
    });

    console.log(`✅ Sample mentor created: ${mentorEmail}`);
  }

  // Create sample student if not exists
  const studentEmail = 'student@startup-ecosystem.com';
  const existingStudent = await prisma.user.findUnique({
    where: { email: studentEmail },
  });

  if (!existingStudent) {
    const passwordHash = await bcrypt.hash('Student@123', 12);

    const student = await prisma.user.create({
      data: {
        email: studentEmail,
        passwordHash,
        name: 'Sample Student',
        role: 'student',
        startupIntent: 'has_startup',
        isVerified: true,
        isEmailVerified: true,
      },
    });

    await prisma.userProfile.create({
      data: {
        userId: student.id,
        bio: 'Aspiring entrepreneur passionate about building tech solutions',
        college: 'Tech University',
        skills: ['JavaScript', 'React', 'Node.js', 'Product Management'],
      },
    });

    console.log(`✅ Sample student created: ${studentEmail}`);
  }

  console.log('🎉 Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
