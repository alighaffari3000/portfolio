import type { APIRoute } from 'astro';
import { db } from '../../../../../../lib/db';

export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Project ID is required' }), { status: 400 });
  }

  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : body.items;

    if (!Array.isArray(items)) {
      return new Response(JSON.stringify({ error: 'Expected an array of gallery items with updated order' }), { status: 400 });
    }

    const updates = items.map((item: { id: string; order: number }) =>
      db.galleryImage.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    );

    await db.$transaction(updates);

    return new Response(JSON.stringify({ success: true, message: 'Gallery reordered successfully' }), { status: 200 });
  } catch (err: any) {
    console.error('Reorder gallery error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to reorder gallery' }), { status: 500 });
  }
};
