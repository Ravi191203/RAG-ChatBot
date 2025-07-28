
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const { knowledge, type } = await req.json();
    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge content is required' }, { status: 400 });
    }

    if (!process.env.MONGODB_URI) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { db } = await connectToDatabase();
    
    const result = await db.collection('knowledge_base').insertOne({
      content: knowledge,
      type: type || 'knowledge', // Default to 'knowledge' for backward compatibility
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
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }
    
        const { db } = await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        // If an ID is provided, fetch a single item
        if (id) {
            if (!ObjectId.isValid(id)) {
                return NextResponse.json({ error: 'Invalid Item ID' }, { status: 400 });
            }
            const item = await db.collection('knowledge_base').findOne({ _id: new ObjectId(id) });
            if (!item) {
                return NextResponse.json({ error: 'Item not found' }, { status: 404 });
            }
            return NextResponse.json({ savedItem: item });
        }
        
        // Fetch the most recent knowledge entry
        const lastKnowledge = await db.collection('knowledge_base').findOne(
          { type: 'knowledge' },
          { sort: { createdAt: -1 } }
        );

        // Fetch all saved items
        const savedItems = await db.collection('knowledge_base').find({}).sort({ createdAt: -1 }).toArray();
    
        return NextResponse.json({ 
            knowledge: lastKnowledge?.content || "",
            savedItems: savedItems 
        });
      } catch (error: any) {
        console.error('Error fetching knowledge:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
      }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
        }
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid Item ID' }, { status: 400 });
        }

        if (!process.env.MONGODB_URI) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const { db } = await connectToDatabase();
        
        const result = await db.collection('knowledge_base').deleteOne({
            _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting knowledge:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { id, content } = await req.json();

        if (!id || !content) {
            return NextResponse.json({ error: 'Item ID and content are required' }, { status: 400 });
        }
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid Item ID' }, { status: 400 });
        }

        if (!process.env.MONGODB_URI) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const { db } = await connectToDatabase();
        
        const result = await db.collection('knowledge_base').updateOne(
            { _id: new ObjectId(id) },
            { $set: { content: content, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating knowledge:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
