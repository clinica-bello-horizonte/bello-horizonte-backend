import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Sube una imagen a Cloudinary.
   * @param transformation Transformación de Cloudinary. Por defecto recorta a
   * 400x400 (avatares). Para imágenes que deben conservar su proporción
   * (ej. campañas) pasar un 'limit' que solo reduce el tamaño máximo.
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
    transformation: Record<string, unknown>[] = [
      { width: 400, height: 400, crop: 'fill' },
    ],
  ): Promise<string> {
    if (!file) throw new BadRequestException('No se proporcionó ningún archivo');

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes JPG, PNG o WebP');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('La imagen no puede superar 5MB');
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', transformation },
        (error, result) => {
          if (error) reject(new BadRequestException('Error al subir la imagen'));
          else resolve(result!.secure_url);
        },
      ).end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId).catch(() => {});
  }
}
