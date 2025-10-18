import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from '../config/env';
import { CLOUDINARY } from '../utils/constants';

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

class CloudinaryService {
  /**
   * Upload car image to Cloudinary
   */
  async uploadCarImage(
    file: Express.Multer.File,
    carId: string
  ): Promise<string> {
    try {
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `${CLOUDINARY.FOLDER}/${carId}`,
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as UploadApiResponse);
          }
        );

        uploadStream.end(file.buffer);
      });

      console.log(`Image uploaded to Cloudinary: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Upload multiple car images
   */
  async uploadMultipleCarImages(
    files: Express.Multer.File[],
    carId: string
  ): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadCarImage(file, carId)
    );

    try {
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw new Error('Failed to upload images');
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteCarImage(imageUrl: string): Promise<void> {
    try {
      // Extract public ID from URL
      const publicId = this.extractPublicId(imageUrl);

      if (!publicId) {
        throw new Error('Invalid image URL');
      }

      await cloudinary.uploader.destroy(publicId);
      console.log(`Image deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Delete multiple images
   */
  async deleteMultipleCarImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map((url) => this.deleteCarImage(url));

    try {
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting multiple images:', error);
      throw new Error('Failed to delete images');
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  private extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/([^/]+)\.[^.]+$/);
      if (!matches) return null;

      // Get the path after 'upload/' and before the file extension
      const parts = url.split('/upload/');
      if (parts.length < 2) return null;

      const pathParts = parts[1].split('/');
      // Remove version (e.g., v1234567890) if present
      const pathWithoutVersion = pathParts.filter(
        (part) => !part.startsWith('v')
      );

      // Join the path and remove the file extension
      const publicId = pathWithoutVersion.join('/').replace(/\.[^.]+$/, '');
      return publicId;
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > CLOUDINARY.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds ${CLOUDINARY.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      };
    }

    // Check file format
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension || !CLOUDINARY.ALLOWED_FORMATS.includes(fileExtension as any)) {
      return {
        valid: false,
        error: `File format not allowed. Allowed formats: ${CLOUDINARY.ALLOWED_FORMATS.join(', ')}`,
      };
    }

    return { valid: true };
  }
}

export default new CloudinaryService();

