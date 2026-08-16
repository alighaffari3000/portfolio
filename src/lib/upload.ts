import fs from 'fs/promises';
import path from 'path';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_GALLERY_IMAGES = 30;

function getUploadsDir(): string {
  const dir = process.env.UPLOADS_DIR || './uploads';
  return path.resolve(dir);
}

/**
 * Maps MIME type or filename to a clean extension (.jpg, .jpeg, .png, .webp).
 */
function getExtension(file: File): string | null {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  if (mimeMap[file.type]) {
    return mimeMap[file.type];
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && ALLOWED_EXTENSIONS.has(ext)) {
    return ext === 'jpeg' ? 'jpg' : ext;
  }

  return null;
}

/**
 * Validates uploaded image file against size, MIME, and extension rules.
 * Explicitly rejects SVG and GIF.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string; ext?: string } {
  if (!file || file.size === 0) {
    return { valid: false, error: 'Empty file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.svg') || lowerName.endsWith('.gif') || file.type.includes('svg') || file.type.includes('gif')) {
    return { valid: false, error: 'SVG and GIF files are strictly rejected' };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: 'Invalid file format. Only JPEG, PNG, and WebP are allowed.' };
  }

  const ext = getExtension(file);
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: 'Invalid file extension. Only jpg, png, and webp are allowed.' };
  }

  return { valid: true, ext };
}

/**
 * Prevents path traversal by ensuring resolved path stays within UPLOADS_DIR.
 */
function ensureSafePath(targetPath: string): string {
  const uploadsDir = getUploadsDir();
  const resolved = path.resolve(targetPath);
  if (resolved !== uploadsDir && !resolved.startsWith(uploadsDir + path.sep)) {
    throw new Error('Path traversal attack detected');
  }
  return resolved;
}

/**
 * Saves Hero Image. Removes any existing hero.* file in the project folder first.
 */
export async function saveHero(projectId: string, file: File): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid || !validation.ext) {
    throw new Error(validation.error || 'Invalid file');
  }

  const projectDir = path.join(getUploadsDir(), 'projects', projectId);
  const safeProjectDir = ensureSafePath(projectDir);

  await fs.mkdir(safeProjectDir, { recursive: true });

  // Clean up any existing hero.* files in the directory regardless of extension
  try {
    const existingFiles = await fs.readdir(safeProjectDir);
    for (const f of existingFiles) {
      if (f.startsWith('hero.')) {
        await fs.unlink(path.join(safeProjectDir, f));
      }
    }
  } catch (err) {
    console.warn(`Warning reading directory during hero cleanup for project ${projectId}:`, err);
  }

  const filename = `hero.${validation.ext}`;
  const targetFilePath = path.join(safeProjectDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(targetFilePath, Buffer.from(arrayBuffer));

  return `/uploads/projects/${projectId}/${filename}`;
}

/**
 * Saves a Gallery Image under UPLOADS_DIR/projects/<projectId>/gallery/
 */
export async function saveGalleryImage(projectId: string, file: File): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid || !validation.ext) {
    throw new Error(validation.error || 'Invalid file');
  }

  const galleryDir = path.join(getUploadsDir(), 'projects', projectId, 'gallery');
  const safeGalleryDir = ensureSafePath(galleryDir);

  await fs.mkdir(safeGalleryDir, { recursive: true });

  const randomName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${validation.ext}`;
  const targetFilePath = path.join(safeGalleryDir, randomName);

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(targetFilePath, Buffer.from(arrayBuffer));

  return `/uploads/projects/${projectId}/gallery/${randomName}`;
}

/**
 * Deletes a physical file given its public URL (e.g. /uploads/projects/id/hero.jpg).
 */
export async function deleteFileByUrl(publicUrl: string): Promise<void> {
  if (!publicUrl || !publicUrl.startsWith('/uploads/')) {
    return;
  }

  const relativePath = publicUrl.replace(/^\/uploads\//, '');
  const physicalPath = path.join(getUploadsDir(), relativePath);

  try {
    const safePath = ensureSafePath(physicalPath);
    await fs.unlink(safePath);
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error(`Error deleting physical file ${publicUrl}:`, err);
    }
  }
}

/**
 * Deletes the entire project uploads directory (/var/lib/portfolio/uploads/projects/<projectId>).
 */
export async function deleteProjectDir(projectId: string): Promise<void> {
  if (!projectId) return;

  const projectDir = path.join(getUploadsDir(), 'projects', projectId);
  try {
    const safePath = ensureSafePath(projectDir);
    await fs.rm(safePath, { recursive: true, force: true });
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error(`Error deleting project directory for ${projectId}:`, err);
    }
  }
}
