import { prisma } from '@/lib/prisma';
import { projectSchema, type ProjectTranslationSchema } from '@/lib/validations/projectSchema';
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
    
    if (!projectData.slug) {
      return Response.json(
        { error: 'Missing required field: slug' },
        { status: 400 }
      );
    }

    if (!projectData.translations || Object.keys(projectData.translations).length === 0) {
      return Response.json(
        { error: 'Missing required field: translations (at least one locale required)' },
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
        heroImage: projectData.heroImage || '',
        gallery: projectData.gallery || [],
        categoryId: projectData.categoryId || null,
        subCategoryId: projectData.subCategoryId || null,
        translations: {
          create: Object
            .entries(projectData.translations as Record<string, ProjectTranslationSchema>)
            .map(([locale, translationData]) => ({
              locale,
              title: translationData.title || '',
              location: translationData.location || '',
              area: translationData.area || '',
              year: translationData.year || '',
              content: translationData.content || '',
            })),
        },
      },
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          }
        },
        subCategory: {
          include: {
            translations: true,
          }
        }
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
