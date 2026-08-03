// This file fetches projects from the database using Prisma

import prisma from '@/lib/prisma';

// For server components
export async function getProjects(locale: string = 'vi') {
  try {
    const projects = await prisma.project.findMany({
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          },
        },
        subCategory: {
          include: {
            translations: true,
          },
        },
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

      const categoryTranslation = project.category?.translations.find(t => t.locale === locale)
        || project.category?.translations.find(t => t.locale === 'vi')
        || project.category?.translations.find(t => t.locale === 'en')
        || project.category?.translations[0];

      const subCategoryTranslation = project.subCategory?.translations.find(t => t.locale === locale)
        || project.subCategory?.translations.find(t => t.locale === 'vi')
        || project.subCategory?.translations.find(t => t.locale === 'en')
        || project.subCategory?.translations[0];

      return {
        ...project,
        title: translation?.title || '',
        category: categoryTranslation?.name || '',
        type: subCategoryTranslation?.name || '',
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
        category: {
          include: {
            translations: true,
          },
        },
        subCategory: {
          include: {
            translations: true,
          },
        },
        relatedFrom: {
          include: {
            relatedProject: {
              include: {
                translations: true,
                category: {
                  include: {
                    translations: true,
                  },
                },
                subCategory: {
                  include: {
                    translations: true,
                  },
                },
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    
    if (!project) {
      return null;
    }

    const translation = project.translations.find(t => t.locale === locale) 
      || project.translations.find(t => t.locale === 'vi')
      || project.translations.find(t => t.locale === 'en')
      || project.translations[0];

    const categoryTranslation = project.category?.translations.find(t => t.locale === locale)
      || project.category?.translations.find(t => t.locale === 'vi')
      || project.category?.translations.find(t => t.locale === 'en')
      || project.category?.translations[0];

    const subCategoryTranslation = project.subCategory?.translations.find(t => t.locale === locale)
      || project.subCategory?.translations.find(t => t.locale === 'vi')
      || project.subCategory?.translations.find(t => t.locale === 'en')
      || project.subCategory?.translations[0];

    return {
      ...project,
      title: translation?.title || '',
      category: categoryTranslation?.name || '',
      type: subCategoryTranslation?.name || '',
      location: translation?.location || '',
      area: translation?.area || '',
      year: translation?.year || '',
      content: translation?.content || '',
      relatedProjects: project.relatedFrom.map((rel) => {
        const relProject = rel.relatedProject;
        const relTranslation = relProject.translations.find(t => t.locale === locale)
          || relProject.translations.find(t => t.locale === 'vi')
          || relProject.translations.find(t => t.locale === 'en')
          || relProject.translations[0];
        const relCatTrans = relProject.category?.translations.find(t => t.locale === locale)
          || relProject.category?.translations.find(t => t.locale === 'vi')
          || relProject.category?.translations[0];
        return {
          slug: relProject.slug,
          title: relTranslation?.title || '',
          heroImage: relProject.heroImage,
          category: relCatTrans?.name || '',
          location: relTranslation?.location || '',
          year: relTranslation?.year || '',
        };
      }),
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

