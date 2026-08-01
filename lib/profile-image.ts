export const PROFILE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const PROFILE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

export function validateProfileImage(file: { type: string; size: number }) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Choose a JPG, JPEG, PNG, or WebP image.";
  }
  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return "Choose an image smaller than 10 MB.";
  }
  return "";
}
