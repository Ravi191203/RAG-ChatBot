
'use server';
/**
 * @fileOverview Generates a video from a text prompt using Veo.
 *
 * - generateVideo - A function that handles the video generation process.
 * - checkVideoStatus - A function to check the status of a video generation operation.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { logger } from 'genkit/logging';
import { startGenerate, checkOperation } from 'genkit/model';


const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate a video from.'),
  duration: z.number().optional().default(5).describe('The duration of the video in seconds (5-8).'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;


const GenerateVideoOutputSchema = z.object({
  operationName: z.string().optional().describe('The name of the long-running operation.'),
  done: z.boolean().describe('Whether the operation is complete.'),
  videoUrl: z.string().optional().describe("The generated video as a base64-encoded data URI."),
  error: z.string().optional().describe("Any error message if the operation failed."),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;


const CheckVideoStatusInputSchema = z.object({
    operationName: z.string().describe('The name of the long-running operation to check.'),
});
export type CheckVideoStatusInput = z.infer<typeof CheckVideoStatusInputSchema>;


export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
    return generateVideoFlow(input);
}

export async function checkVideoStatus(input: CheckVideoStatusInput): Promise<GenerateVideoOutput> {
    return checkVideoStatusFlow(input);
}

const startVideoGenerationRequest = async (apiKey: string | undefined, input: GenerateVideoInput) => {
    const model = googleAI.model('veo-2.0-generate-001', { apiKey });
    const { operation } = await startGenerate({
        model,
        prompt: input.prompt,
        config: {
            durationSeconds: Math.max(5, Math.min(8, input.duration || 5)),
            aspectRatio: '16:9',
        },
    });
    return operation;
}


const generateVideoFlow = ai.defineFlow(
    {
        name: 'generateVideoFlow',
        inputSchema: GenerateVideoInputSchema,
        outputSchema: GenerateVideoOutputSchema,
    },
    async (input) => {
        logger.info("Starting video generation flow for prompt:", input.prompt);
        let operation;
        try {
            operation = await startVideoGenerationRequest(process.env.GEMINI_API_KEY, input);
            if (!operation?.name) throw new Error("Primary key failed to start operation.");
        } catch (primaryError: any) {
            logger.warn(`Primary API key failed for video generation. Error: ${primaryError.message}`);
            const backupApiKey = process.env.GEMINI_BACKUP_API_KEY;
            if (backupApiKey) {
                logger.log("Attempting to use backup API key for video generation...");
                try {
                    operation = await startVideoGenerationRequest(backupApiKey, input);
                    if (!operation?.name) throw new Error("Backup key failed to start operation.");
                } catch (backupError: any) {
                    logger.error(`Backup API key also failed for video generation. Error: ${backupError.message}`);
                    return { done: true, error: `The AI model and the backup both failed to respond. Details: ${backupError.message}` };
                }
            } else {
                return { done: true, error: `The AI model failed to respond. Details: ${primaryError.message}` };
            }
        }

        if (!operation?.name) {
            return { done: true, error: "Failed to start video generation operation." };
        }

        logger.info("Video generation operation started:", operation.name);
        return { operationName: operation.name, done: false };
    }
);


const checkVideoStatusRequest = async (apiKey: string | undefined, input: CheckVideoStatusInput) => {
    // Note: checkOperation doesn't directly support passing an API key.
    // The key from the environment should be picked up by the genkit instance.
    // This logic relies on the genkit instance being configured with the key.
    // If we need to explicitly pass a key, we might need a custom implementation.
    // For now, we assume the environment is set correctly for the check.
    const operation = await checkOperation({ name: input.operationName });
    return operation;
}


const checkVideoStatusFlow = ai.defineFlow(
    {
        name: 'checkVideoStatusFlow',
        inputSchema: CheckVideoStatusInputSchema,
        outputSchema: GenerateVideoOutputSchema,
    },
    async (input) => {
        logger.info("Checking status for operation:", input.operationName);
        try {
            // checkOperation doesn't accept an API key directly, it relies on the plugin's configuration.
            // We will rely on the globally configured API key for this.
            // Fallback logic here is tricky without direct key support in checkOperation.
            // Assuming the operation check uses the same project, the original key's permissions should suffice.
            let operation = await ai.checkOperation({ name: input.operationName });

            if (!operation) {
                 throw new Error("Operation not found.");
            }

            if (operation.error) {
                logger.error("Operation failed:", operation.error);
                return {
                    done: true,
                    error: operation.error.message || 'Video generation failed.',
                };
            }

            if (operation.done) {
                const video = operation.output?.message?.content.find((p) => !!p.media);
                if (!video?.media?.url) {
                    throw new Error("Operation finished but no video was found.");
                }

                logger.info("Video generation complete, URL found.");
                
                // The download URL requires an API key, we can try both here.
                const fetch = (await import('node-fetch')).default;
                let videoResponse;
                try {
                    videoResponse = await fetch(`${video.media.url}&key=${process.env.GEMINI_API_KEY}`);
                    if (!videoResponse.ok) throw new Error('Primary key failed to download video.');
                } catch (primaryError) {
                     logger.warn(`Primary key failed to download video. Trying backup. Error: ${primaryError}`);
                     const backupApiKey = process.env.GEMINI_BACKUP_API_KEY;
                     if (backupApiKey) {
                        videoResponse = await fetch(`${video.media.url}&key=${backupApiKey}`);
                        if (!videoResponse.ok) throw new Error(`Backup key also failed to download video: ${videoResponse.statusText}`);
                     } else {
                         throw primaryError;
                     }
                }

                if (!videoResponse.ok) {
                    throw new Error(`Failed to download video: ${videoResponse.statusText}`);
                }

                const videoBuffer = await videoResponse.arrayBuffer();
                const base64Video = Buffer.from(videoBuffer).toString('base64');
                const contentType = videoResponse.headers.get('content-type') || 'video/mp4';

                return {
                    done: true,
                    videoUrl: `data:${contentType};base64,${base64Video}`,
                };
            }
            
            // Operation is still in progress
            return {
                operationName: operation.name,
                done: false,
            };

        } catch (error: any) {
             logger.error("Error in checkVideoStatusFlow:", error);
             return {
                done: true,
                error: error.message || "An unknown error occurred while checking status.",
            };
        }
    }
);
