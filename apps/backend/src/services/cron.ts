import cron from 'node-cron';
import { prisma } from '../db';

export const initCronJobs = () => {
  // Run daily at midnight — ecosystem snapshot
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running daily ecosystem snapshot cron...');
      const date = new Date();
      date.setHours(0, 0, 0, 0);

      const [totalUsers, totalStartups, totalMeetings, totalIdeas, totalConnections] = await Promise.all([
        prisma.user.count(),
        prisma.startup.count(),
        prisma.meeting.count(),
        prisma.idea.count(),
        prisma.startupMember.count(),
      ]);

      await prisma.ecosystemSnapshot.upsert({
        where: { snapshotDate: date },
        update: { totalUsers, totalStartups, totalMeetings, totalIdeas, totalConnections },
        create: { snapshotDate: date, totalUsers, totalStartups, totalMeetings, totalIdeas, totalConnections },
      });

      console.log('Ecosystem snapshot saved.');
    } catch (err) {
      console.error('Error running daily cron:', err);
    }
  });

  // Run every 6 hours for GitHub cache
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('Running GitHub cache refresh...');
      const startups = await prisma.startup.findMany({
        where: { githubRepoOwner: { not: null } },
        select: { id: true, githubRepoOwner: true, githubRepoName: true },
      });

      // Need to import fetchAndCacheGitHubData locally to avoid circular deps
      const { fetchAndCacheGitHubData } = require('./githubService');

      for (const st of startups) {
        try {
          await fetchAndCacheGitHubData(st.id, st.githubRepoOwner, st.githubRepoName);
          await new Promise((r) => setTimeout(r, 1000));
        } catch (err) {
          console.error(`Failed to refresh repo for startup ${st.id}`);
        }
      }
      console.log('GitHub cache refresh complete.');
    } catch (err) { /* silent */ }
  });
};
