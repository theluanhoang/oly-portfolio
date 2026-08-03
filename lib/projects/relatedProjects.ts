type FindManyResult = { id: string; slug: string }[];

type FindManyFn = (args: {
  where: { id: { in: string[] } };
  select: { id: true; slug: true };
}) => Promise<FindManyResult>;

type DeleteManyFn = (args: { where: { projectId: string } }) => Promise<unknown>;

type CreateManyFn = (args: {
  data: Array<{ projectId: string; relatedProjectId: string; displayOrder: number }>;
}) => Promise<unknown>;

export interface ProjectLookupClient {
  project: { findMany: FindManyFn };
}

export interface ProjectRelationClient {
  projectRelation: {
    deleteMany: DeleteManyFn;
    createMany: CreateManyFn;
  };
}

function normalizeIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
}

export async function buildRelatedCreateData(
  lookupClient: ProjectLookupClient,
  currentProjectId: string | null,
  rawIds: unknown,
  currentProjectSlug: string,
): Promise<Array<{ relatedProjectId: string; displayOrder: number }>> {
  const ids = normalizeIds(rawIds);
  if (ids.length === 0) return [];

  const uniqueIds = Array.from(new Set(ids));
  const relatedProjects = await lookupClient.project.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, slug: true },
  });

  const allowed = new Set<string>();
  for (const project of relatedProjects) {
    if (currentProjectId && project.id === currentProjectId) continue;
    if (project.slug === currentProjectSlug) continue;
    allowed.add(project.id);
  }

  return uniqueIds
    .filter((id) => allowed.has(id))
    .map((id, index) => ({
      relatedProjectId: id,
      displayOrder: index,
    }));
}

export async function syncRelatedProjects(
  relationClient: ProjectRelationClient,
  lookupClient: ProjectLookupClient,
  projectId: string,
  rawIds: unknown,
  currentProjectSlug: string,
): Promise<void> {
  await relationClient.projectRelation.deleteMany({ where: { projectId } });

  const createData = await buildRelatedCreateData(
    lookupClient,
    projectId,
    rawIds,
    currentProjectSlug,
  );

  if (createData.length === 0) return;

  await relationClient.projectRelation.createMany({
    data: createData.map((item) => ({
      ...item,
      projectId,
    })),
  });
}