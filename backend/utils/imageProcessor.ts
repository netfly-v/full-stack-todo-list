import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

/**
 * Process uploaded avatar image:
 * - Resize to 300x300 (cover crop)
 * - Convert to JPEG
 * - Optimize quality (85%)
 * - Delete original file
 * 
 * @param inputPath - Path to the uploaded image
 * @returns Path to the processed image
 */
export async function processAvatar(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.(jpg|jpeg|png|webp)$/i, '-processed.jpg');

  await sharp(inputPath)
    .resize(300, 300, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85 })
    .toFile(outputPath);

  // Delete original file
  await fs.unlink(inputPath);

  return outputPath;
}

/**
 * Delete avatar file from disk
 * 
 * @param avatarUrl - Avatar URL from database (e.g., /uploads/avatars/user-1-123456.jpg)
 */
export async function deleteAvatar(avatarUrl: string | null | undefined): Promise<void> {
  if (!avatarUrl) return;

  const filePath = path.join(process.cwd(), avatarUrl.replace(/^\//, ''));

  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, log but don't throw
    console.error('Failed to delete avatar:', error);
  }
}
