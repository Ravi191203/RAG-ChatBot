
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { generateTitle } from '@/ai/flows/title-generation';

// Helper function to get user ID from request body or query params
const getUserId = async (req: NextRequest): Promise<string | null> => {
    const { searchParams } = new URL(req.url);
    if (req.method === 'GET' || req.method === 'DELETE') {
        return searchParams.get('userId');
    }
    const body = await req.json();
    // Re-create the readable stream for subsequent calls
    (req as any).json = async () => body; 
    return body.userId;
};


export async function POST(req: NextRequest) {
  try {
    const { knowledge, type, userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }
    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge content is required' }, { status: 400 });
    }
    if (!process.env.MONGODB_URI) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    const titleResponse = await generateTitle({ content: knowledge });
    const title = titleResponse.title;

    const { db } = await connectToDatabase();
    
    const result = await db.collection('knowledge_base').insertOne({
      userId: userId,
      title: title,
      content: knowledge,
      type: type || 'knowledge',
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
        const userId = searchParams.get('userId');

        // If an ID is provided, fetch a single item.
        // It's a public share link, so we don't check for userId.
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
        
        // For all other GET requests, userId is required.
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
        }

        const lastKnowledge = await db.collection('knowledge_base').findOne(
          { userId: userId, type: 'knowledge' },
          { sort: { createdAt: -1 } }
        );

        const savedItems = await db.collection('knowledge_base').find({ userId: userId }).sort({ createdAt: -1 }).toArray();
    
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
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
        }
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
        
        // Ensure user can only delete their own items
        const result = await db.collection('knowledge_base').deleteOne({
            _id: new ObjectId(id),
            userId: userId,
        });

        if (result.deletedCount === 0) {
            // This can mean either the item doesn't exist or the user doesn't have permission
            return NextResponse.json({ error: 'Item not found or permission denied' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting knowledge:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { id, content, userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
        }
        if (!id || !content) {
            return NextResponse.json({ error: 'Item ID and content are required' }, { status: 400 });
        }
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid Item ID' }, { status: 400 });
        }
        if (!process.env.MONGODB_URI) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const titleResponse = await generateTitle({ content: content });
        const title = titleResponse.title;

        const { db } = await connectToDatabase();
        
        // Ensure user can only update their own items
        const result = await db.collection('knowledge_base').updateOne(
            { _id: new ObjectId(id), userId: userId },
            { $set: { title: title, content: content, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            // This can mean either the item doesn't exist or the user doesn't have permission
            return NextResponse.json({ error: 'Item not found or permission denied' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating knowledge:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
