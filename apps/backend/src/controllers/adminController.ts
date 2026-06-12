import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { sendMail } from '../services/email';

export const getVerificationRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { not: 'admin' },
        verificationBadges: { none: {} },
      },
      select: {
        id: true, email: true, role: true, name: true, createdAt: true,
        profile: { select: { bio: true, college: true, company: true, linkedinUrl: true, skills: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

export const verifyUser = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { badge_type } = req.body;
    const adminId = req.user.id;

    if (!badge_type) {
      res.status(400).json({ success: false, error: 'Badge type is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    await prisma.verificationBadge.upsert({
      where: { id: 0 }, // force create path
      update: {},
      create: { userId: Number(userId), badgeType: badge_type, grantedBy: adminId },
    }).catch(async () => {
      // If duplicate (user+badgeType), ignore
      const existing = await prisma.verificationBadge.findFirst({
        where: { userId: Number(userId), badgeType: badge_type },
      });
      if (!existing) throw new Error('Badge insert failed');
    });

    try {
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px;">
          <h2 style="color: #1C1C1C;">Congratulations — You're Verified!</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your account on the <strong>Ecosystem</strong> platform has been <strong>verified</strong> by our admin team.</p>
          <p>Your verification badge (<em>${badge_type}</em>) is now active on your profile.</p>
          <p style="margin-top: 24px; color: #888;">Log in to see your verified badge and unlock additional features.</p>
        </div>
      `;
      await sendMail(user.email, 'You have been verified on Ecosystem!', `Congratulations ${user.name}, your account has been verified!`, html);
    } catch (emailErr) {
      console.error('Verification email failed (non-blocking):', emailErr);
    }

    res.json({ success: true, message: 'User verified successfully' });
  } catch (err) { next(err); }
};

export const revokeVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { email: true, name: true },
    });

    await prisma.verificationBadge.deleteMany({ where: { userId: Number(userId) } });

    if (user) {
      try {
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px;">
            <h2 style="color: #1C1C1C;">Verification Request Update</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your verification request on the <strong>Ecosystem</strong> platform has been reviewed.</p>
            <p>Unfortunately, your request has been <strong>rejected</strong> at this time.</p>
            <p style="margin-top: 24px; color: #888;">If you believe this is an error, please contact the platform admin.</p>
          </div>
        `;
        await sendMail(user.email, 'Verification Request Update — Ecosystem', `Hi ${user.name}, your verification request has been reviewed.`, html);
      } catch (emailErr) {
        console.error('Rejection email failed (non-blocking):', emailErr);
      }
    }

    res.json({ success: true, message: 'Verification revoked' });
  } catch (err) { next(err); }
};

// ─── Public Mentor Sessions ────────────────────────────────────────

export const listPublicSessions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();

    await prisma.publicMentorSession.updateMany({
      where: {
        isActive: true,
        sessionDate: { not: null, lt: now },
      },
      data: { isActive: false },
    });

    const sessions = await prisma.publicMentorSession.findMany({
      orderBy: [{ sessionDate: 'asc' }, { createdAt: 'desc' }],
    });

    const data = sessions.map((s) => ({
      ...s,
      is_full: s.maxParticipants != null && s.joinedCount >= s.maxParticipants,
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const createPublicSession = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, mentor_name, description, session_date, session_time, meet_link, max_participants } = req.body;

    if (!title || !mentor_name || !meet_link) {
      res.status(400).json({ success: false, error: 'title, mentor_name and meet_link are required' });
      return;
    }

    const maxParticipants = Number(max_participants || 100);
    if (!Number.isFinite(maxParticipants) || maxParticipants <= 0) {
      res.status(400).json({ success: false, error: 'max_participants must be a positive number' });
      return;
    }

    try { new URL(meet_link); } catch {
      res.status(400).json({ success: false, error: 'meet_link must be a valid URL' });
      return;
    }

    const session = await prisma.publicMentorSession.create({
      data: {
        title,
        mentorName: mentor_name,
        description: description || null,
        sessionDate: session_date ? new Date(session_date) : null,
        sessionTime: session_time || null,
        meetLink: meet_link,
        maxParticipants,
        joinedCount: 0,
        createdBy: req.user.id,
      },
    });

    res.status(201).json({ success: true, id: session.id });
  } catch (err) { next(err); }
};

export const deletePublicSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.publicMentorSession.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const togglePublicSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = await prisma.publicMentorSession.findUnique({
      where: { id: Number(req.params.id) },
      select: { isActive: true },
    });
    if (!session) { res.status(404).json({ success: false, error: 'Session not found' }); return; }

    await prisma.publicMentorSession.update({
      where: { id: Number(req.params.id) },
      data: { isActive: !session.isActive },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── Startup Leaders ───────────────────────────────────────────────

export const getStartupLeaders = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const startups = await prisma.startup.findMany({
      include: {
        creator: { select: { id: true, name: true, email: true, phone: true } },
        members: { select: { userId: true } },
        upvotes: { select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = startups.map((s) => ({
      startup_id: s.id,
      startup_name: s.name,
      domain: s.domain,
      stage: s.stage,
      startup_email: s.startupEmail,
      leader_id: s.creator.id,
      leader_name: s.creator.name,
      leader_email: s.creator.email,
      leader_phone: s.creator.phone,
      member_count: s.members.length,
      upvote_count: s.upvotes.length,
      created_at: s.createdAt,
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const updateStartupLeaderContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startupId } = req.params;
    const { startup_email } = req.body;

    if (startup_email && !/^\S+@\S+\.\S+$/.test(startup_email)) {
      res.status(400).json({ success: false, error: 'startup_email must be a valid email' });
      return;
    }

    await prisma.startup.update({
      where: { id: Number(startupId) },
      data: { startupEmail: startup_email || null },
    });
    res.json({ success: true, message: 'Startup contact updated' });
  } catch (err) { next(err); }
};

// ─── Featured Works ────────────────────────────────────────────────

export const listFeaturedWorks = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const works = await prisma.featuredWork.findMany({
      include: { startup: { select: { name: true, domain: true, stage: true } } },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: works });
  } catch (err) { next(err); }
};

const normalizeUrl = (value?: string | null): string | null => {
  if (!value || !String(value).trim()) return null;
  const trimmed = String(value).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
};

export const createFeaturedWork = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startup_id, headline, summary, hero_image_url, cta_label, cta_url, display_order, is_active } = req.body;

    const normalizedHeroImageUrl = normalizeUrl(hero_image_url);
    const normalizedCtaUrl = normalizeUrl(cta_url);

    if (!startup_id) { res.status(400).json({ success: false, error: 'startup_id is required' }); return; }

    if (normalizedHeroImageUrl) {
      try { new URL(normalizedHeroImageUrl); } catch {
        res.status(400).json({ success: false, error: 'hero_image_url must be a valid URL' }); return;
      }
    }
    if (normalizedCtaUrl) {
      try { new URL(normalizedCtaUrl); } catch {
        res.status(400).json({ success: false, error: 'cta_url must be a valid URL' }); return;
      }
    }

    const work = await prisma.featuredWork.create({
      data: {
        startupId: Number(startup_id),
        headline: headline || null,
        summary: summary || null,
        heroImageUrl: normalizedHeroImageUrl,
        ctaLabel: cta_label || null,
        ctaUrl: normalizedCtaUrl,
        displayOrder: Number(display_order) || 0,
        isActive: is_active === undefined ? true : Boolean(is_active),
        createdBy: req.user.id,
      },
    });

    res.status(201).json({ success: true, id: work.id });
  } catch (err) { next(err); }
};

export const deleteFeaturedWork = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.featuredWork.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const toggleFeaturedWork = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const work = await prisma.featuredWork.findUnique({
      where: { id: Number(req.params.id) },
      select: { isActive: true },
    });
    if (!work) { res.status(404).json({ success: false, error: 'Not found' }); return; }

    await prisma.featuredWork.update({
      where: { id: Number(req.params.id) },
      data: { isActive: !work.isActive },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};
