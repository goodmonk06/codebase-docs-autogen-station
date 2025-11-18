import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  },

  workspace: {
    dir: process.env.WORKSPACE_DIR || path.join(process.cwd(), '../workspace'),
  },
} as const;

// Ensure workspace directory exists
if (!fs.existsSync(config.workspace.dir)) {
  fs.mkdirSync(config.workspace.dir, { recursive: true });
}
