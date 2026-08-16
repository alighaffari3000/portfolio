import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      slug,
      title,
      summary,
      description,
      problem,
      solution,
      features,
      techStack,
      architecture,
      challenges,
      results,
      githubUrl,
      demoUrl,
      published,
      order,
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanSlug = (slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')).trim();

    if (!SLUG_REGEX.test(cleanSlug)) {
      return new Response(
        JSON.stringify({ error: 'Invalid slug format. Use lowercase alphanumeric characters and hyphens only.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check slug uniqueness
    const existing = await db.project.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return new Response(
        JSON.stringify({ error: 'A project with this slug already exists.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const asJson = (value: unknown) =>
      Array.isArray(value) ? JSON.stringify(value) : typeof value === 'string' ? value : null;

    const text = (field: string) => {
      const value = body[field];
      return typeof value === 'string' && value.trim() ? value.trim() : null;
    };

    const newProject = await db.project.create({
      data: {
        slug: cleanSlug,
        title: title.trim(),
        // Persian counterparts fall back to the English text at render time,
        // so leaving them empty is fine — see resolveProject() in lib/i18n.ts.
        titleFa: text('titleFa'),
        summary: summary?.trim() || null,
        summaryFa: text('summaryFa'),
        description: description?.trim() || null,
        descriptionFa: text('descriptionFa'),
        problem: problem?.trim() || null,
        problemFa: text('problemFa'),
        solution: solution?.trim() || null,
        solutionFa: text('solutionFa'),
        features: asJson(features),
        featuresFa: asJson(body.featuresFa),
        techStack: asJson(techStack),
        architecture: architecture?.trim() || null,
        architectureFa: text('architectureFa'),
        challenges: challenges?.trim() || null,
        challengesFa: text('challengesFa'),
        results: results?.trim() || null,
        resultsFa: text('resultsFa'),
        githubUrl: githubUrl?.trim() || null,
        demoUrl: demoUrl?.trim() || null,
        published: published !== undefined ? Boolean(published) : true,
        order: typeof order === 'number' ? order : 0,
      },
    });

    return new Response(
      JSON.stringify({ success: true, project: newProject }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Create project error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to create project' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
