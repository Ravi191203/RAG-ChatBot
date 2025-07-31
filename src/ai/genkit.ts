
import { config } from 'dotenv';
config();

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({
    apiKey: process.env.GEMINI_API_KEY,
  })],
});

export const backupAi = genkit({
    plugins: [googleAI({
      apiKey: process.env.GEMINI_BACKUP_API_KEY,
    })],
});
