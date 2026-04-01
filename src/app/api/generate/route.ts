import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmap } from '@/lib/groq';
import { UserInput } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as UserInput;

    // Validate input
    if (!body.goal || !body.level || !body.hours || !body.months) {
      return NextResponse.json(
        { error: 'Missing required fields: goal, level, hours, months' },
        { status: 400 }
      );
    }

    // Generate roadmap using Groq
    const roadmap = await generateRoadmap(body);

    return NextResponse.json(roadmap, { status: 200 });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: `Failed to generate roadmap: ${errorMessage}` },
      { status: 500 }
    );
  }
}
