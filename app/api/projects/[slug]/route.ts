import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const { slug } = await params;
    const project = await prisma.project.findUnique({
      where: { slug },
    });

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    return Response.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch project', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const { slug } = await params;
    const projectData = await request.json();
    
    const existingProject = await prisma.project.findUnique({
      where: { slug },
    });

    if (!existingProject) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (projectData.slug && projectData.slug !== slug) {
      const slugExists = await prisma.project.findUnique({
        where: { slug: projectData.slug },
      });
      if (slugExists) {
        return Response.json(
          { error: `Project with slug "${projectData.slug}" already exists` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.project.update({
      where: { slug },
      data: {
        slug: projectData.slug || slug,
        title: projectData.title,
        category: projectData.category,
        type: projectData.type && projectData.type.trim() ? projectData.type.trim() : '',
        location: projectData.location || '',
        area: projectData.area || '',
        year: projectData.year || '',
        heroImage: projectData.heroImage || '',
        content: projectData.content || '',
        gallery: projectData.gallery || [],
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error('Error updating project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to update project', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const { slug } = await params;
    const deleted = await prisma.project.delete({
      where: { slug },
    });

    return Response.json(deleted);
  } catch (error) {
    console.error('Error deleting project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to delete project', details: errorMessage },
      { status: 500 }
    );
  }
}

