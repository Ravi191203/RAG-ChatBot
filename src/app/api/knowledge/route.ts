
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const { knowledge } = await req.json();
    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge content is required' }, { status: 400 });
    }

    if (!process.env.MONGODB_URI) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { db } = await connectToDatabase();
    
    const result = await db.collection('knowledge_base').insertOne({
      content: knowledge,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, insertedId: result.insertedId }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving knowledge:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    try {
        if (!process.env.MONGODB_URI) {
            return NextResponse.json({ knowledge: "" });
        }
    
        const { db } = await connectToDatabase();
        
        const lastKnowledge = await db.collection('knowledge_base').findOne(
          {},
          { sort: { createdAt: -1 } }
        );
    
        return NextResponse.json({ knowledge: lastKnowledge?.content || "" });
      } catch (error: any) {
        console.error('Error fetching knowledge:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
      }
}

