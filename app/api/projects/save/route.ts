import { prisma } from '@/lib/prisma';
import { projectSchema } from '@/lib/validations/projectSchema';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const projectData = await request.json();
    
    if (!projectData.slug || !projectData.title) {
      return Response.json(
        { error: 'Missing required fields: slug, title' },
        { status: 400 }
      );
    }

    const validationResult = projectSchema.safeParse(projectData);
    if (!validationResult.success) {
      return Response.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const existingProject = await prisma.project.findUnique({
      where: { slug: projectData.slug },
    });

    if (existingProject) {
      return Response.json(
        { error: `Project with slug "${projectData.slug}" already exists` },
        { status: 409 }
      );
    }

    const project = await prisma.project.create({
      data: {
        slug: projectData.slug,
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
    
    return Response.json({ 
      success: true, 
      message: 'Project saved successfully',
      project 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error saving project:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return Response.json(
        { error: 'Project with this slug already exists' },
        { status: 409 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to save project', details: errorMessage },
      { status: 500 }
    );
  }
}
