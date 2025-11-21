import imageCompression from 'browser-image-compression'

/**
 * Compress image to stay within free tier limits (~200KB max)
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.2, // 200KB
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('Error compressing image:', error)
    throw new Error('Failed to compress image')
  }
}

/**
 * Upload image to Supabase storage
 */
export async function uploadImage(
  supabase: any,
  userId: string,
  entryId: string,
  file: File
): Promise<{ path: string; url: string }> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `${userId}/${entryId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('diary-images')
    .upload(filePath, file)

  if (uploadError) {
    throw uploadError
  }

  const { data: { publicUrl } } = supabase.storage
    .from('diary-images')
    .getPublicUrl(filePath)

  return { path: filePath, url: publicUrl }
}

/**
 * Delete image from Supabase storage
 */
export async function deleteImage(
  supabase: any,
  path: string
): Promise<void> {
  const { error } = await supabase.storage
    .from('diary-images')
    .remove([path])

  if (error) {
    throw error
  }
}

/**
 * Get signed URL for private image (valid for 1 hour)
 */
export async function getSignedImageUrl(
  supabase: any,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('diary-images')
    .createSignedUrl(path, 3600) // 1 hour

  if (error) {
    throw error
  }

  return data.signedUrl
}
