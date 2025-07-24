import {NextRequest, NextResponse} from 'next/server';
import {intelligentResponse} from '@/ai/flows/intelligent-responses';
import clientPromise from '@/lib/mongodb';
import {ObjectId} from 'mongodb';

export type ChatMessage = {
  _id?: string | ObjectId;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

async function getChatHistory(
  sessionId: string,
  limit = 20
): Promise<ChatMessage[]> {
  const client = await clientPromise;
  const db = client.db();
  const history = await db
    .collection<ChatMessage>('chat_history')
    .find({sessionId})
    .sort({timestamp: -1})
    .limit(limit)
    .toArray();
  return history.reverse();
}

async function saveChatMessage(message: Omit<ChatMessage, 'timestamp' | '_id'>) {
  const client = await clientPromise;
  const db = client.db();
  const timestamp = new Date();
  await db
    .collection<ChatMessage>('chat_history')
    .insertOne({...message, timestamp});
}

export async function POST(req: NextRequest) {
  try {
    const {question, knowledge, sessionId} = await req.json();

    if (!question || !knowledge || !sessionId) {
      return NextResponse.json(
        {error: 'Missing required fields'},
        {status: 400}
      );
    }

    const history = await getChatHistory(sessionId);
    const contextWithHistory =
      knowledge +
      '\n\n--- Chat History ---\n' +
      history.map(h => `${h.role}: ${h.content}`).join('\n');

    await saveChatMessage({
      sessionId,
      role: 'user',
      content: question,
    });

    const result = await intelligentResponse({
      question,
      context: contextWithHistory,
    });

    await saveChatMessage({
      sessionId,
      role: 'assistant',
      content: result.answer,
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
  const {searchParams} = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      {error: 'Session ID is required'},
      {status: 400}
    );
  }

  try {
    const history = await getChatHistory(sessionId);
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      {error: 'Internal Server Error', details: error.message},
      {status: 500}
    );
  }
}
