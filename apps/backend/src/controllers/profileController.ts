import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { buildObjectUrl, DEFAULT_MINIO_BUCKET, minioClient } from '../services/minio';

export const getMyProfile = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, role: true, name: true,
        isVerified: true, startupIntent: true,
        profile: true,
        verificationBadges: { select: { badgeType: true } },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const { verificationBadges, ...rest } = user;
    res.json({
      success: true,
      data: {
        ...rest,
        profile: user.profile || {},
        badges: verificationBadges.map((b) => b.badgeType),
      },
    });
  } catch (err) { next(err); }
};

export const updateMyProfile = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const {
      bio, avatar_url, github_url, linkedin_url,
      skills, interests, preferred_domains,
      college, year_of_study, cgpa,
      company, expertise, designation, years_of_experience,
    } = req.body;

    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        bio: bio ?? null,
        avatarUrl: avatar_url ?? null,
        githubUrl: github_url ?? null,
        linkedinUrl: linkedin_url ?? null,
        skills: skills ?? [],
        interests: interests ?? [],
        preferredDomains: preferred_domains ?? [],
        college: college ?? null,
        yearOfStudy: year_of_study ?? null,
        cgpa: cgpa ?? null,
        company: company ?? null,
        expertise: expertise ?? null,
        designation: designation ?? null,
        yearsOfExperience: years_of_experience ?? null,
      },
      create: {
        userId,
        bio: bio ?? null,
        avatarUrl: avatar_url ?? null,
        githubUrl: github_url ?? null,
        linkedinUrl: linkedin_url ?? null,
        skills: skills ?? [],
        interests: interests ?? [],
        preferredDomains: preferred_domains ?? [],
        college: college ?? null,
        yearOfStudy: year_of_study ?? null,
        cgpa: cgpa ?? null,
        company: company ?? null,
        expertise: expertise ?? null,
        designation: designation ?? null,
        yearsOfExperience: years_of_experience ?? null,
      },
    });

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) { next(err); }
};

export const uploadAvatar = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image uploaded' });
      return;
    }

    const userId = req.user.id;
    const file = req.file;
    const bucketName = process.env.MINIO_BUCKET || DEFAULT_MINIO_BUCKET;
    const extension = file.originalname.split('.').pop();
    const objectName = `avatars/avatar_${userId}_${Date.now()}.${extension}`;

    await minioClient.putObject(bucketName, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const avatarUrl = buildObjectUrl(bucketName, objectName);

    await prisma.userProfile.upsert({
      where: { userId },
      update: { avatarUrl },
      create: { userId, avatarUrl },
    });

    res.json({ success: true, data: { avatar_url: avatarUrl } });
  } catch (err) { next(err); }
};

export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = Number(req.params.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, role: true, name: true, isVerified: true,
        profile: true,
        verificationBadges: { select: { badgeType: true } },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const { verificationBadges, ...rest } = user;
    res.json({
      success: true,
      data: {
        ...rest,
        profile: user.profile || {},
        badges: verificationBadges.map((b) => b.badgeType),
      },
    });
  } catch (err) { next(err); }
};

export const getDiscoveryList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, limit = '20', offset = '0' } = req.query;

    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: {
        id: true, name: true, role: true, isVerified: true,
        profile: { select: { avatarUrl: true, bio: true, skills: true, company: true, college: true } },
      },
      take: Number(limit),
      skip: Number(offset),
    });

    const data = users.map((u) => ({ ...u, ...u.profile }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
