
'use server';

/**
 * @fileOverview Converts text to speech.
 *
 * - generateSpeech - A function that handles the text-to-speech process.
 * - GenerateSpeechInput - The input type for the generateSpeech function.
 * - GenerateSpeechOutput - The return type for the generateSpeech function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import wav from 'wav';

const GenerateSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type GenerateSpeechInput = z.infer<typeof GenerateSpeechInputSchema>;

const GenerateSpeechOutputSchema = z.object({
  audio: z.string().describe("The generated audio as a base64-encoded WAV data URI."),
  apiKeyUsed: z.string().optional().describe('The API key that was used for the response (primary or backup).')
});
export type GenerateSpeechOutput = z.infer<typeof GenerateSpeechOutputSchema>;


export async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
  return generateSpeechFlow(input);
}


async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
        });

        let bufs = [] as any[];
        writer.on('error', reject);
        writer.on('data', function (d) {
        bufs.push(d);
        });
        writer.on('end', function () {
        resolve(Buffer.concat(bufs).toString('base64'));
        });

        writer.write(pcmData);
        writer.end();
    });
}


const makeRequest = async (apiKey: string | undefined, input: GenerateSpeechInput) => {
    const model = googleAI.model('gemini-2.5-flash-preview-tts', { apiKey });
    const { media } = await ai.generate({
      model,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: input.text,
    });
    return media;
}


const generateSpeechFlow = ai.defineFlow(
  {
    name: 'generateSpeechFlow',
    inputSchema: GenerateSpeechInputSchema,
    outputSchema: GenerateSpeechOutputSchema,
  },
  async (input) => {
     let media;
     let apiKeyUsed = 'primary';
     try {
        media = await makeRequest(process.env.GEMINI_API_KEY, input);
        if (!media) throw new Error("Primary key returned empty response.");
     } catch (primaryError: any) {
        console.warn(`Primary API key failed for TTS generation. Error: ${primaryError.message}`);
        const backupApiKey = process.env.GEMINI_BACKUP_API_KEY;
        apiKeyUsed = 'backup';
        if (backupApiKey) {
            console.log("Attempting to use backup API key for TTS generation...");
            try {
                media = await makeRequest(backupApiKey, input);
                if (!media) throw new Error("Backup key returned empty response.");
            } catch (backupError: any) {
                console.error(`Backup API key also failed for TTS generation. Error: ${backupError.message}`);
                throw new Error(`The AI model and the backup both failed to respond. Details: ${backupError.message}`);
            }
        } else {
            throw new Error(`The AI model failed to respond. Details: ${primaryError.message}`);
        }
     }

    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavData = await toWav(audioBuffer);

    return {
      audio: 'data:audio/wav;base64,' + wavData,
      apiKeyUsed
    };
  }
);
