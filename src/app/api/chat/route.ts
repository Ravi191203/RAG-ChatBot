
import {NextRequest, NextResponse} from 'next/server';
import {intelligentResponse} from '@/ai/flows/intelligent-responses';

export type ChatMessage = {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export async function POST(req: NextRequest) {
  try {
    const {question, knowledge, sessionId, history: clientHistory} = await req.json();

    if (!question || !sessionId) {
      return NextResponse.json(
        {error: 'Missing question or sessionId'},
        {status: 400}
      );
    }
    
    // Construct history from client-side history + new question
    const history: Omit<ChatMessage, 'timestamp'>[] = [...(clientHistory || []), { role: 'user', content: question, sessionId }];
    
    const contextWithHistory =
      (knowledge || '') +
      '\n\n--- Chat History ---\n' +
      history.map(h => `${h.role}: ${h.content}`).join('\n');


    const result = await intelligentResponse({
      question,
      context: contextWithHistory,
    });


    return NextResponse.json({answer: result.answer});
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      {error: 'Internal Server Error', details: error.message},
      {status: 500}
    );
  }
}

export async function GET(req: NextRequest) {
    // This endpoint is no longer used for fetching history.
    // Returning an empty array for compatibility.
    return NextResponse.json([]);
}
