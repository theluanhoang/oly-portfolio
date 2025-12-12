// This file fetches projects from the database using Prisma

import prisma from '@/lib/prisma';

// For server components
export async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return projects;
  } catch (error) {
    console.error('Error fetching projects from database:', error);
    return [];
  }
}

// Utility functions
export async function getProjectBySlug(slug: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { slug },
    });
    return project;
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
export async function getProjectsAsImages() {
  const projects = await getProjects();
  return projects.map((project) => ({
    src: project.heroImage,
    alt: project.title,
    slug: project.slug,
  }));
}

// Nhóm projects thành các section (mỗi section 4 projects)
export async function groupProjectsIntoSections(itemsPerSection = 4) {
  const images = await getProjectsAsImages();
  const sections = [];
  for (let i = 0; i < images.length; i += itemsPerSection) {
    sections.push(images.slice(i, i + itemsPerSection));
  }
  return sections;
}

