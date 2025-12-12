import { prisma } from '@/lib/prisma';

export async function GET(): Promise<Response> {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Response.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch projects', details: errorMessage },
      { status: 500 }
    );
  }
}

