import type { APIRoute } from 'astro';
import { db } from '../../../../../lib/db';
import { saveHero, saveGalleryImage, deleteFileByUrl, MAX_GALLERY_IMAGES, validateImageFile } from '../../../../../lib/upload';

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Project ID is required' }), { status: 400 });
  }

  try {
    const project = await db.project.findUnique({
      where: { id },
      include: { gallery: true },
    });

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 });
    }

    const formData = await request.formData();
    const type = formData.get('type') as string; // 'hero' | 'gallery'
    const file = formData.get('file') as File | null;
    const caption = (formData.get('caption') as string) || null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
    }

    if (type === 'hero') {
      // Save hero image (saveHero cleans up any existing hero.* file in disk)
      const publicUrl = await saveHero(id, file);

      // If project had an existing heroImage URL in DB that was deleted, updated in DB
      const updatedProject = await db.project.update({
        where: { id },
        data: { heroImage: publicUrl },
      });

      return new Response(
        JSON.stringify({ success: true, heroImage: publicUrl, project: updatedProject }),
        { status: 200 }
      );
    } else if (type === 'gallery') {
      // Check max gallery limit
      if (project.gallery.length >= MAX_GALLERY_IMAGES) {
        return new Response(
          JSON.stringify({ error: `Gallery limit reached. Maximum ${MAX_GALLERY_IMAGES} images allowed per project.` }),
          { status: 400 }
        );
      }

      const publicUrl = await saveGalleryImage(id, file);
      const nextOrder = project.gallery.length > 0 ? Math.max(...project.gallery.map((g) => g.order)) + 1 : 0;

      const galleryImage = await db.galleryImage.create({
        data: {
          projectId: id,
          url: publicUrl,
          caption: caption?.trim() || null,
          order: nextOrder,
        },
      });

      return new Response(
        JSON.stringify({ success: true, image: galleryImage }),
        { status: 201 }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid upload type. Must be "hero" or "gallery".' }),
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error('Upload error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'File upload failed' }),
      { status: 500 }
    );
  }
};
