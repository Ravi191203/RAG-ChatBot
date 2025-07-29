
'use server';
/**
 * @fileOverview Generates a video from a text prompt using Veo.
 *
 * - generateVideo - A function that handles the video generation process.
 * - checkVideoStatus - A function to check the status of a video generation operation.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import { ai, backupAi } from '@/ai/genkit';
import { z } from 'genkit';
import { logger } from 'genkit/logging';
import { startGenerate } from 'genkit/model';


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
  apiKeyUsed: z.enum(['primary', 'backup']).optional().describe('The API key that was used for the response.'),
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

const generateVideoFlow = ai.defineFlow(
    {
        name: 'generateVideoFlow',
        inputSchema: GenerateVideoInputSchema,
        outputSchema: GenerateVideoOutputSchema,
    },
    async (input) => {
        logger.info("Starting video generation flow for prompt:", input.prompt);
        
        const makeRequest = async (client: typeof ai) => {
            const { operation } = await startGenerate({
                model: 'veo-2.0-generate-001',
                prompt: input.prompt,
                config: {
                    durationSeconds: Math.max(5, Math.min(8, input.duration || 5)),
                    aspectRatio: '16:9',
                },
                client,
            });
            
            if (!operation?.name) {
                throw new Error("Failed to start video generation operation.");
            }
            return { operationName: operation.name, done: false };
        };
        
        try {
            const result = await makeRequest(ai);
            return { ...result, apiKeyUsed: 'primary' };
        } catch (error: any) {
            console.warn("Primary API key for video generation failed. Trying backup.", error.message);
            if (process.env.GEMINI_BACKUP_API_KEY) {
                try {
                    const result = await makeRequest(backupAi);
                    return { ...result, apiKeyUsed: 'backup' };
                } catch (backupError: any) {
                    return { done: true, error: `Video generation failed to start on both keys. Details: ${backupError.message}` };
                }
            }
            return { done: true, error: `Video generation failed to start. Details: ${error.message}` };
        }
    }
);


const checkVideoStatusFlow = ai.defineFlow(
    {
        name: 'checkVideoStatusFlow',
        inputSchema: CheckVideoStatusInputSchema,
        outputSchema: GenerateVideoOutputSchema,
    },
    async (input) => {
        logger.info("Checking status for operation:", input.operationName);
        
        const makeRequest = async (client: typeof ai, apiKey: string) => {
            let operation = await client.checkOperation({ name: input.operationName });

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
                
                const fetch = (await import('node-fetch')).default;
                let videoResponse;
               
                videoResponse = await fetch(`${video.media.url}&key=${apiKey}`);
                
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
        };

        try {
            const result = await makeRequest(ai, process.env.GEMINI_API_KEY!);
            return { ...result, apiKeyUsed: 'primary' };
        } catch (error: any) {
            logger.error("Error checking video status with primary key:", error);
            if (process.env.GEMINI_BACKUP_API_KEY) {
                try {
                    const result = await makeRequest(backupAi, process.env.GEMINI_BACKUP_API_KEY);
                    return { ...result, apiKeyUsed: 'backup' };
                } catch (backupError: any) {
                    return {
                        done: true,
                        error: `Failed to check video status with both keys. Details: ${backupError.message}`
                    };
                }
            }
            return {
                done: true,
                error: `Failed to check video status. Details: ${error.message}`
            };
        }
    }
);
