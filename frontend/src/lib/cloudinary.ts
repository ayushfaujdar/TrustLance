export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'trustlance_uploads',
};

export const getCloudinaryUrl = (publicId: string, transformations?: string): string => {
  const base = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}`;
  if (transformations) {
    return `${base}/${transformations}/${publicId}`;
  }
  return `${base}/image/upload/${publicId}`;
};
