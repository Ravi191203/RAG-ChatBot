
import {NextRequest, NextResponse} from 'next/server';
import {intelligentResponse} from '@/ai/flows/intelligent-responses';
import { connectToDatabase } from '@/lib/mongodb';


export type ChatMessage = {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export async function POST(req: NextRequest) {
  try {
    const { knowledge, sessionId, history, question } = await req.json();

    if (!history || !question || !sessionId) {
      return NextResponse.json(
        {error: 'Missing history, question, or sessionId'},
        {status: 400}
      );
    }

    let dbKnowledge = "";
    if (process.env.MONGODB_URI) {
        try {
            const { db } = await connectToDatabase();
            const lastKnowledge = await db.collection('knowledge_base').findOne(
                {},
                { sort: { createdAt: -1 } }
            );
            if (lastKnowledge) {
                dbKnowledge = lastKnowledge.content;
            }
        } catch (dbError) {
            console.warn("Database connection failed, continuing without DB knowledge.", dbError);
        }
    }
    
    // Combine session knowledge with DB knowledge
    const combinedKnowledge = [knowledge, dbKnowledge].filter(Boolean).join('\n\n---\n\n');

    // Construct the context from the knowledge base and all messages EXCEPT the last one (the question)
    const context =
      (combinedKnowledge ? `--- Knowledge Base ---\n${combinedKnowledge}\n\n` : '') +
      '--- Chat History ---\n' +
      history.slice(0, -1).map((h: {role: string; content: string;}) => `${h.role}: ${h.content}`).join('\n');

    const result = await intelligentResponse({
      context: context,
      question: question,
    });

    return NextResponse.json({answer: result.answer});
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      {error: 'Internal ServerError', details: error.message},
      {status: 500}
    );
  }
}
