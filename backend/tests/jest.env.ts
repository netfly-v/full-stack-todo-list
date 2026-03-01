import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(__dirname, '..', '.env.test');

process.env.NODE_ENV = 'test';
process.env.DOTENV_CONFIG_PATH = envPath;

dotenv.config({ path: envPath });
