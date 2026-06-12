import { prisma } from '../db';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const calculateStartupSuccessScore = async (startupId: number | string): Promise<number> => {
  const id = Number(startupId);
  const [upvoteCount, memberCount, githubCache] = await Promise.all([
    prisma.startupUpvote.count({ where: { startupId: id } }),
    prisma.startupMember.count({ where: { startupId: id } }),
    prisma.githubCache.findUnique({ where: { startupId: id }, select: { commitCountWeek: true, commitCountMonth: true } }),
  ]);

  const weeklyCommits = githubCache?.commitCountWeek ?? 0;
  const monthlyCommits = githubCache?.commitCountMonth ?? 0;

  const raw = (upvoteCount * 3.5) + (memberCount * 6) + (weeklyCommits * 4) + (monthlyCommits * 1.2);
  return Math.round(clamp(raw, 0, 100));
};

export const calculateStartupPulse = async (
  startupId: number | string
): Promise<{ pulse_score: number; commits_last_7_days: number; meetings_last_7_days: number }> => {
  const id = Number(startupId);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [githubCache, meetingsLastWeek] = await Promise.all([
    prisma.githubCache.findUnique({ where: { startupId: id }, select: { commitCountWeek: true } }),
    prisma.meeting.count({
      where: {
        startupId: id,
        status: 'completed',
        confirmedSlot: { gte: sevenDaysAgo },
      },
    }),
  ]);

  const commitsLastWeek = githubCache?.commitCountWeek ?? 0;
  const rawPulse = (commitsLastWeek * 8) + (meetingsLastWeek * 12);

  return {
    pulse_score: Math.round(clamp(rawPulse, 0, 100)),
    commits_last_7_days: commitsLastWeek,
    meetings_last_7_days: meetingsLastWeek,
  };
};
