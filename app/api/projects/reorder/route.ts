import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';

interface ReorderRequest {
  updates: Array<{
    slug: string;
    displayOrder: number;
  }>;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body: ReorderRequest = await request.json();
    
    if (!body.updates || !Array.isArray(body.updates) || body.updates.length === 0) {
      return Response.json(
        { error: 'Invalid request. Updates array is required and must not be empty.' },
        { status: 400 }
      );
    }

    const slugs = body.updates.map(u => u.slug);
    const existingProjects = await prisma.project.findMany({
      where: {
        slug: {
          in: slugs,
        },
      },
      select: {
        slug: true,
      },
    });

    const existingSlugs = new Set(existingProjects.map(p => p.slug));
    const missingSlugs = slugs.filter(slug => !existingSlugs.has(slug));

    if (missingSlugs.length > 0) {
      return Response.json(
        { error: `Projects not found: ${missingSlugs.join(', ')}` },
        { status: 404 }
      );
    }

    const updatePromises = body.updates.map(update =>
      prisma.project.update({
        where: { slug: update.slug },
        data: { displayOrder: Number(update.displayOrder) },
      })
    );

    const updated = await prisma.$transaction(updatePromises);


    return Response.json({
      success: true,
      updated: updated.length,
      projects: updated,
    });
  } catch (error) {
    console.error('Error reordering projects:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to reorder projects', details: errorMessage },
      { status: 500 }
    );
  }
}

