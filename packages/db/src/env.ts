import dotenv from 'dotenv';
import path from 'node:path';

const envCandidates = [
  process.env.DOTENV_PATH,
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'apps/backend/.env'),
  path.resolve(process.cwd(), 'packages/db/.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../../apps/backend/.env'),
  path.resolve(__dirname, '../.env'),
].filter(Boolean) as string[];

const loadedEnvFiles: string[] = [];

for (const envPath of envCandidates) {
  const result = dotenv.config({
    path: envPath,
    override: false,
  });

  if (!result.error) {
    loadedEnvFiles.push(envPath);
  }
}

export { envCandidates, loadedEnvFiles };
