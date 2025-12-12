import { prisma } from '@/lib/prisma';

export async function GET(): Promise<Response> {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return Response.json(
      { status: 'healthy', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { status: 'unhealthy', error: errorMessage },
      { status: 503 }
    );
  }
}

