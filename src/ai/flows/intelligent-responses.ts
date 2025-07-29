
'use server';

/**
 * @fileOverview An intelligent question answering AI agent.
 *
 * - intelligentResponse - A function that handles the question answering process.
 * - IntelligentResponseInput - The input type for the intelligentResponse function.
 * - IntelligentResponseOutput - The return type for the intelligentResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { configureGenkit } from 'genkit';

const IntelligentResponseInputSchema = z.object({
  context: z.string().describe('The knowledge base and chat history.'),
  question: z.string().describe('The user question to answer.'),
  model: z.string().optional().describe('The name of the model to use.'),
});
export type IntelligentResponseInput = z.infer<
  typeof IntelligentResponseInputSchema
>;

const IntelligentResponseOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type IntelligentResponseOutput = z.infer<
  typeof IntelligentResponseOutputSchema
>;

export async function intelligentResponse(
  input: IntelligentResponseInput
): Promise<IntelligentResponseOutput> {
  return intelligentResponseFlow(input);
}

const intelligentResponseFlow = ai.defineFlow(
  {
    name: 'intelligentResponseFlow',
    inputSchema: IntelligentResponseInputSchema,
    outputSchema: IntelligentResponseOutputSchema,
  },
  async (input) => {
    const modelName = input.model || 'gemini-1.5-flash-latest';

    const makeRequest = async (apiKey?: string) => {
        if (apiKey) {
            // Re-configure Genkit with the specified API key for this request
            configureGenkit({
                plugins: [googleAI({ apiKey })],
            });
        }
        const model = googleAI.model(modelName);

        const intelligentResponsePrompt = ai.definePrompt({
          name: 'intelligentResponsePrompt',
          input: {schema: IntelligentResponseInputSchema},
          output: {schema: IntelligentResponseOutputSchema},
          prompt: `You are a powerful, analytical AI assistant. Your goal is to provide insightful and accurate answers based on the provided context and question.

- First, check if the knowledge base or chat history provides a relevant answer. If it does, use it to form a comprehensive response.
- If the context does not contain the answer, use your own extensive general knowledge to respond. You can handle a wide range of tasks, from answering questions to generating creative content like code, scripts, or emails.
- Do not mention that you cannot access the internet. Instead, answer based on the information you were trained on.
- If the question is ambiguous, ask for clarification.

Your final output should be only the answer to the user's question, without any preamble or extra formatting.

Context:
{{{context}}}

Question:
{{{question}}}
`,
          model
        });

        const { output } = await intelligentResponsePrompt(input);
        if (!output) {
          throw new Error(`The selected AI model (${modelName}) failed to respond.`);
        }
        return output;
    };

    try {
        // First, try with the primary API key
        return await makeRequest(process.env.GEMINI_API_KEY);
    } catch (error: any) {
        console.warn("Primary API key failed. Trying backup key.", error.message);
        // If the primary key fails, try the backup key
        if (process.env.GEMINI_BACKUP_API_KEY) {
            try {
                return await makeRequest(process.env.GEMINI_BACKUP_API_KEY);
            } catch (backupError: any) {
                 throw new Error(`The selected AI model (${modelName}) and the backup both failed to respond. Details: ${backupError.message}`);
            }
        }
        // If there's no backup key or it also fails, throw the original error
        throw new Error(`The selected AI model (${modelName}) failed to respond. Details: ${error.message}`);
    }
  }
);
