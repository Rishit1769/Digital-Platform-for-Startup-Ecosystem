import { initializeDatabase } from './src/db';

async function init() {
  await initializeDatabase();
  console.log('Database initialized successfully from manual trigger.');
  process.exit(0);
}

init();
