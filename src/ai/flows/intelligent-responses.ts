
'use server';

/**
 * @fileOverview An intelligent question answering AI agent.
 *
 * - intelligentResponse - A function that handles the question answering process.
 * - IntelligentResponseInput - The input type for the intelligentResponse function.
 * - IntelligentResponseOutput - The return type for the intelligentResponse function.
 */

import {ai, googleAI, backupAi} from '@/ai/genkit';
import {z} from 'genkit';
import { getWebSearchTool } from '../tools/web-search';

const IntelligentResponseInputSchema = z.object({
  context: z.string().describe('The knowledge base and chat history.'),
  question: z.string().describe('The user question to answer.'),
  model: z.string().optional().describe('The name of the model to use.'),
  deepSearch: z.boolean().optional().default(false).describe('Whether to use a more powerful model for deeper analysis.'),
  webSearch: z.boolean().optional().default(false).describe('Whether to allow the AI to search the web.'),
  canvasMode: z.boolean().optional().default(false).describe('Whether to enable creative/visual canvas mode.'),
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

const intelligentResponsePrompt = (client: typeof ai, modelName: string, input: IntelligentResponseInput) => {
    const tools = [];
    if (input.webSearch) {
        // Define the tool for the specific client instance
        tools.push(getWebSearchTool(client));
    }

    return client.definePrompt({
      name: 'intelligentResponsePrompt',
      input: {schema: IntelligentResponseInputSchema},
      output: {schema: IntelligentResponseOutputSchema.omit({apiKeyUsed: true})},
      tools: tools,
      system: `You are a powerful, analytical AI assistant. Your goal is to provide insightful and accurate answers based on the provided context and question.

- First, check if the knowledge base or chat history provides a relevant answer. If it does, use it to form a comprehensive response.
- If the context does not contain the answer, use your own extensive general knowledge to respond. You can handle a wide range of tasks, from answering questions to generating creative content like code, scripts, or emails.
- Do not mention that you cannot access the internet unless the user explicitly asks about your capabilities. Instead, answer based on the information you were trained on or use the provided tools.
- If the question is ambiguous, ask for clarification.
${input.canvasMode ? "- You are in Canvas Mode. Be more creative, visual, and willing to brainstorm. Think of yourself as a creative partner on a whiteboard." : ""}
${input.webSearch ? "- Web search is enabled. Use the webSearch tool to find real-time information, recent events, or topics not in your training data." : ""}
Your final output should be only the answer to the user's question, without any preamble or extra formatting.`,
      prompt: `Context:
{{{context}}}

Question:
{{{question}}}
`,
      model: googleAI.model(modelName),
    });
}

const intelligentResponseFlow = ai.defineFlow(
  {
    name: 'intelligentResponseFlow',
    inputSchema: IntelligentResponseInputSchema,
    outputSchema: IntelligentResponseOutputSchema,
  },
  async (input) => {
    const modelName = input.deepSearch ? 'gemini-1.5-pro-latest' : (input.model || 'gemini-1.5-flash-latest');
    
    try {
        const prompt = intelligentResponsePrompt(ai, modelName, input);
        const response = await prompt(input);
        const answer = response.output?.answer ?? "No answer generated.";

        if (!answer) {
          throw new Error(`The selected AI model (${modelName}) failed to respond.`);
        }
        return { answer, apiKeyUsed: 'primary' };
    } catch (error: any) {
        console.warn(`Primary intelligent response failed for model ${modelName}, trying backup.`, error.message);
        try {
            const prompt = intelligentResponsePrompt(backupAi, modelName, input);
            const response = await prompt(input);
            const answer = response.output?.answer ?? "No answer generated.";
            if (!answer) {
                throw new Error(`The selected AI model (${modelName}) and the backup both failed to respond.`);
            }
            return { answer, apiKeyUsed: 'backup' };
        } catch (backupError: any) {
            console.error(`Backup intelligent response failed for model ${modelName}.`, backupError.message);
            throw new Error(`The AI model and the backup both failed to respond. Details: ${backupError.message}`);
        }
    }
  }
);
