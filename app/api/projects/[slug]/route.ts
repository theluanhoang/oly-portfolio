import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';
import type { ProjectTranslationSchema } from '@/lib/validations/projectSchema';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale')?.trim();
    
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        translations: true,
      },
    });

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    if (locale) {
      const translation = project.translations.find(t => t.locale === locale);
      if (translation) {
        return Response.json({
          ...project,
          title: translation.title,
          category: translation.category,
          type: translation.type,
          location: translation.location,
          area: translation.area,
          year: translation.year,
          content: translation.content,
        });
      }
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
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { slug } = await params;
    const projectData = await request.json();
    
    const existingProject = await prisma.project.findUnique({
      where: { slug },
      include: { translations: true },
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

    // Update project base fields
    const updated = await prisma.project.update({
      where: { slug },
      data: {
        slug: projectData.slug || slug,
        heroImage: projectData.heroImage || '',
        gallery: projectData.gallery || [],
        displayOrder: projectData.displayOrder !== undefined ? Number(projectData.displayOrder) : existingProject.displayOrder,
      },
    });

    if (projectData.translations && typeof projectData.translations === 'object') {
      const translations = projectData.translations as Record<string, ProjectTranslationSchema>;
      
      await prisma.projectTranslation.deleteMany({
        where: { projectId: updated.id },
      });

      for (const [locale, translationData] of Object.entries(translations)) {
        if (translationData && typeof translationData === 'object') {
          const translation = translationData as ProjectTranslationSchema;
          await prisma.projectTranslation.create({
            data: {
              projectId: updated.id,
              locale,
              title: translation.title || '',
              category: translation.category || '',
              type: translation.type && translation.type.trim() ? translation.type.trim() : '',
              location: translation.location || '',
              area: translation.area || '',
              year: translation.year || '',
              content: translation.content || '',
            },
          });
        }
      }
    }

    const updatedWithTranslations = await prisma.project.findUnique({
      where: { id: updated.id },
      include: { translations: true },
    });

    return Response.json(updatedWithTranslations);
  } catch (error) {
    console.error('Error updating project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to update project', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { slug } = await params;
    const updateData = await request.json();
    
    const existingProject = await prisma.project.findUnique({
      where: { slug },
    });

    if (!existingProject) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (updateData.displayOrder === undefined) {
      return Response.json(
        { error: 'Invalid update data. displayOrder is required for PATCH.' },
        { status: 400 }
      );
    }
    
    const updated = await prisma.project.update({
      where: { slug },
      data: {
        displayOrder: Number(updateData.displayOrder),
      },
    });
    
    console.log('[API PATCH] Updated project', {
      slug: updated.slug,
      displayOrder: updated.displayOrder,
    });
    
    return Response.json(updated);
  } catch (error) {
    console.error('Error updating project order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to update project order', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

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

