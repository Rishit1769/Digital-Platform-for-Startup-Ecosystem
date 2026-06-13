import dotenv from 'dotenv';
import path from 'node:path';

const envPath = process.env.DOTENV_PATH || path.resolve(__dirname, '../../../.env');

dotenv.config({ path: envPath });

export { envPath };
