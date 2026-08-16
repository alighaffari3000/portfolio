import type { APIRoute } from 'astro';
import { db } from '../../../../../../lib/db';
import { deleteFileByUrl } from '../../../../../../lib/upload';


export const DELETE: APIRoute = async ({ params }) => {
  const { id, imageId } = params;
  if (!id || !imageId) {
    return new Response(JSON.stringify({ error: 'Project ID and Image ID are required' }), { status: 400 });
  }

  try {
    const galleryImage = await db.galleryImage.findUnique({
      where: { id: imageId },
    });

    if (!galleryImage || galleryImage.projectId !== id) {
      return new Response(JSON.stringify({ error: 'Gallery image not found' }), { status: 404 });
    }

    // Delete DB record
    await db.galleryImage.delete({ where: { id: imageId } });

    // Delete physical file on disk
    await deleteFileByUrl(galleryImage.url);

    return new Response(
      JSON.stringify({ success: true, message: 'Gallery image deleted successfully' }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Delete gallery image error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to delete gallery image' }),
      { status: 500 }
    );
  }
};
