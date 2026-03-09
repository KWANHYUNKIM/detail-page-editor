import { createClient } from './client';

const BUCKET = 'project-images';

/**
 * Upload an image file to Supabase Storage.
 * Returns the public URL of the uploaded image.
 *
 * Path: project-images/{userId}/{uuid}.{ext}
 */
export async function uploadImage(file: File): Promise<string> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop() ?? 'png';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${user.id}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Delete an image from Supabase Storage by its public URL.
 */
export async function deleteImage(publicUrl: string): Promise<void> {
  const supabase = createClient();

  const bucketPrefix = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(bucketPrefix);
  if (idx === -1) return; // Not a Supabase storage URL

  const path = publicUrl.slice(idx + bucketPrefix.length);

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) {
    console.warn('[storage] Failed to delete image:', error);
  }
}
