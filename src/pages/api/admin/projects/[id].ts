import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { deleteProjectDir } from '../../../../lib/upload';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Project ID is required' }), { status: 400 });
  }

  try {
    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 });
    }

    const body = await request.json();
    const { slug, title, published, order } = body;

    let updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (published !== undefined) updateData.published = Boolean(published);
    if (order !== undefined) updateData.order = Number(order);

    // Every translatable text field, English and Persian side by side.
    const TEXT_FIELDS = [
      'titleFa',
      'summary', 'summaryFa',
      'description', 'descriptionFa',
      'problem', 'problemFa',
      'solution', 'solutionFa',
      'architecture', 'architectureFa',
      'challenges', 'challengesFa',
      'results', 'resultsFa',
      'githubUrl', 'demoUrl',
    ] as const;

    for (const field of TEXT_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]?.trim() || null;
      }
    }

    // Stored as JSON strings; techStack is shared between locales.
    const LIST_FIELDS = ['features', 'featuresFa', 'techStack'] as const;
    for (const field of LIST_FIELDS) {
      const value = body[field];
      if (value === undefined) continue;
      updateData[field] = Array.isArray(value)
        ? JSON.stringify(value)
        : typeof value === 'string'
          ? value
          : null;
    }

    if (slug !== undefined) {
      const cleanSlug = slug.trim();
      if (!SLUG_REGEX.test(cleanSlug)) {
        return new Response(
          JSON.stringify({ error: 'Invalid slug format. Use lowercase alphanumeric characters and hyphens only.' }),
          { status: 400 }
        );
      }

      if (cleanSlug !== existing.slug) {
        const slugExists = await db.project.findUnique({ where: { slug: cleanSlug } });
        if (slugExists) {
          return new Response(JSON.stringify({ error: 'Slug is already in use by another project.' }), { status: 400 });
        }
        updateData.slug = cleanSlug;
      }
    }

    const updated = await db.project.update({
      where: { id },
      data: updateData,
    });

    return new Response(JSON.stringify({ success: true, project: updated }), { status: 200 });
  } catch (err: any) {
    console.error('Update project error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to update project' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Project ID is required' }), { status: 400 });
  }

  try {
    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 });
    }

    // Delete DB record (gallery records deleted automatically via onDelete: Cascade)
    await db.project.delete({ where: { id } });

    // Delete physical uploads directory for this project
    await deleteProjectDir(id);

    return new Response(JSON.stringify({ success: true, message: 'Project and all associated uploads deleted successfully' }), { status: 200 });
  } catch (err: any) {
    console.error('Delete project error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to delete project' }), { status: 500 });
  }
};
