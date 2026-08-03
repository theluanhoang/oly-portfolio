export interface ProjectTranslation {
  id?: string;
  locale: string;
  title: string;
  category: string;
  type?: string;
  location: string;
  area: string;
  year: string;
  content?: string;
}

export interface Project {
  id: string;
  slug: string;
  heroImage: string;
  gallery: string[];
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  translations?: ProjectTranslation[];
  relatedProjects?: RelatedProjectItem[];
  // Legacy fields for backward compatibility (sẽ được populate từ translations)
  title?: string;
  category?: string;
  type?: string;
  location?: string;
  area?: string;
  year?: string;
  content?: string;
}

export interface RelatedProjectItem {
  slug: string;
  title: string;
  heroImage: string | null;
  category: string | null;
  location: string | null;
  year: string | null;
}

// Type cho project với translation của một locale cụ thể
export interface ProjectWithLocale extends Omit<Project, 'translations'> {
  title: string;
  category: string;
  type?: string;
  location: string;
  area: string;
  year: string;
  content?: string;
  locale: string;
}

