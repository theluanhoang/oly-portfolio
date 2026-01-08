// This file fetches projects from the database using Prisma

import prisma from '@/lib/prisma';

// For server components
export async function getProjects(locale: string = 'vi') {
  try {
    const projects = await prisma.project.findMany({
      include: {
        translations: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });
    
    return projects.map((project) => {
      const translation = project.translations.find(t => t.locale === locale) 
        || project.translations.find(t => t.locale === 'vi')
        || project.translations.find(t => t.locale === 'en')
        || project.translations[0];

      return {
        ...project,
        title: translation?.title || '',
        category: translation?.category || '',
        type: translation?.type || '',
        location: translation?.location || '',
        area: translation?.area || '',
        year: translation?.year || '',
        content: translation?.content || '',
      };
    });
  } catch (error) {
    console.error('Error fetching projects from database:', error);
    return [];
  }
}

// Utility functions
export async function getProjectBySlug(slug: string, locale: string = 'vi') {
  try {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        translations: true,
      },
    });
    
    if (!project) {
      return null;
    }

    const translation = project.translations.find(t => t.locale === locale) 
      || project.translations.find(t => t.locale === 'vi')
      || project.translations.find(t => t.locale === 'en')
      || project.translations[0];

    return {
      ...project,
      title: translation?.title || '',
      category: translation?.category || '',
      type: translation?.type || '',
      location: translation?.location || '',
      area: translation?.area || '',
      year: translation?.year || '',
      content: translation?.content || '',
    };
  } catch (error) {
    console.error('Error fetching project by slug:', error);
    return null;
  }
}

export async function getAllProjectSlugs(): Promise<string[]> {
  try {
    const projects = await prisma.project.findMany({
      select: { slug: true },
    });
    return projects.map((project) => project.slug);
  } catch (error) {
    console.error('Error fetching project slugs:', error);
    return [];
  }
}

// Chuyển đổi projects thành format images để hiển thị trên trang projects
export async function getProjectsAsImages(locale: string = 'vi') {
  const projects = await getProjects(locale);
  return projects.map((project) => ({
    src: project.heroImage,
    alt: project.title,
    slug: project.slug,
  }));
}

// Nhóm projects thành các section (mỗi section 4 projects)
export async function groupProjectsIntoSections(itemsPerSection = 4, locale: string = 'vi') {
  const images = await getProjectsAsImages(locale);
  const sections = [];
  for (let i = 0; i < images.length; i += itemsPerSection) {
    sections.push(images.slice(i, i + itemsPerSection));
  }
  return sections;
}

