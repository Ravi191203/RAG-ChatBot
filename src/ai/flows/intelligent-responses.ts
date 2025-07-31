'use server';

/**
 * @fileOverview An intelligent question answering AI agent.
 *
 * - intelligentResponse - A function that handles the question answering process.
 * - IntelligentResponseInput - The input type for the intelligentResponse function.
 * - IntelligentResponseOutput - The return type for the intelligentResponse function.
 */

import {ai, backupAi, googleAI} from '@/ai/genkit';
import {z} from 'genkit';

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
  apiKeyUsed: z.enum(['primary', 'backup']).optional(),
});
export type IntelligentResponseOutput = z.infer<
  typeof IntelligentResponseOutputSchema
>;

export async function intelligentResponse(
  input: IntelligentResponseInput
): Promise<IntelligentResponseOutput> {
  return intelligentResponseFlow(input);
}

const runIntelligentResponse = async (client: typeof ai, input: IntelligentResponseInput) => {
    const modelName = input.model || 'gemini-1.5-flash-latest';
    
    const systemPrompt = `You are a powerful, analytical AI assistant.

Your goal is to provide insightful and accurate answers based on the provided context and question.

- First, check if the knowledge base or chat history provides a relevant answer. If it does, use it to form a comprehensive response.
- If the context does not contain the answer, use your own extensive general knowledge to respond. You can handle a wide range of tasks, from answering questions to generating creative content like code, scripts, or emails.
- If the question is ambiguous, ask for clarification.
- Your final output must be ONLY the answer to the user's question. Do not include any preamble, titles, or extra formatting.`;
    
    const response = await client.generate({
        model: googleAI.model(modelName),
        system: systemPrompt,
        prompt: `Context:\n${input.context}\n\nQuestion:\n${input.question}`,
    });
    
    const answer = response.text;
    
    if (!answer) {
      throw new Error(`The selected AI model (${modelName}) failed to respond.`);
    }

    return { answer };
}

const intelligentResponseFlow = ai.defineFlow(
  {
    name: 'intelligentResponseFlow',
    inputSchema: IntelligentResponseInputSchema,
    outputSchema: IntelligentResponseOutputSchema,
  },
  async (input) => {
    const modelName = input.model || 'gemini-1.5-flash-latest';
    
    try {
        const result = await runIntelligentResponse(ai, input);
        return { ...result, apiKeyUsed: 'primary' };
    } catch (error: any) {
        console.warn(`Primary intelligent response failed for model ${modelName}, trying backup.`, error.message);
        try {
            const result = await runIntelligentResponse(backupAi, input);
            return { ...result, apiKeyUsed: 'backup' };
        } catch (backupError: any) {
            console.error(`Backup intelligent response failed for model ${modelName}.`, backupError.message);
            throw new Error(`The AI model and the backup both failed to respond. Details: ${backupError.message}`);
        }
    }
  }
);
