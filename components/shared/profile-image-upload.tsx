"use client";

import { useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { PROFILE_IMAGE_ACCEPT, validateProfileImage } from "@/lib/profile-image";

type ProfileImageUploadProps = {
  accountType: "creator" | "brand";
  name: string;
  initialImageUrl?: string;
  onImageChange: (imageUrl: string) => void;
};

export function ProfileImageUpload({
  accountType,
  name,
  initialImageUrl = "",
  onImageChange,
}: ProfileImageUploadProps) {
  const { user, isLoaded } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const label = accountType === "creator" ? "Profile picture or creator channel logo" : "Brand logo";
  const helper =
    accountType === "creator"
      ? "Upload a photo or the logo you use on YouTube, Instagram, Twitch, or another creator platform."
      : "Upload your company or brand logo.";

  async function upload(file?: File) {
    setError("");
    setMessage("");
    if (!file) return;
    const validationError = validateProfileImage(file);
    if (validationError) {
      setError(validationError);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (!user) {
      setError("Sign in again before changing your image.");
      return;
    }

    setIsUploading(true);
    try {
      await user.setProfileImage({ file });
      await user.reload();
      const nextUrl = user.imageUrl;
      setImageUrl(nextUrl);
      onImageChange(nextUrl);
      setMessage(accountType === "creator" ? "Profile picture updated." : "Brand logo updated.");
    } catch {
      setError("We could not upload that image. Check the file and try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setError("");
    setMessage("");
    if (!user) {
      setError("Sign in again before changing your image.");
      return;
    }
    setIsUploading(true);
    try {
      await user.setProfileImage({ file: null });
      setImageUrl("");
      onImageChange("");
      setMessage(accountType === "creator" ? "Profile picture removed." : "Brand logo removed.");
    } catch {
      setError("We could not remove the image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="lg:col-span-2" aria-labelledby={`${accountType}-image-label`}>
      <span id={`${accountType}-image-label`} className="bridge-label">{label}</span>
      <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{helper}</p>
      <div className="mt-4 flex min-w-0 flex-col gap-4 rounded-[8px] border border-[var(--border)] bg-[#0d0d14] p-4 sm:flex-row sm:items-center">
        <InitialsAvatar
          name={name}
          imageUrl={imageUrl}
          alt={accountType === "creator" ? `${name} profile picture` : `${name} logo`}
          sizes="96px"
          className="h-24 w-24 rounded-[18px]"
          textClassName="text-xl"
        />
        <div className="flex min-w-0 flex-1 flex-wrap gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={PROFILE_IMAGE_ACCEPT}
            className="sr-only"
            id={`${accountType}-profile-image`}
            disabled={!isLoaded || isUploading}
            onChange={(event) => void upload(event.target.files?.[0])}
          />
          <label
            htmlFor={`${accountType}-profile-image`}
            className="bridge-button-secondary focus-ring cursor-pointer"
            aria-disabled={!isLoaded || isUploading}
          >
            {isUploading ? <Loader2 size={17} className="animate-spin" /> : <ImagePlus size={17} />}
            {isUploading ? "Uploading…" : imageUrl ? "Replace image" : "Upload image"}
          </label>
          {imageUrl ? (
            <button type="button" onClick={() => void remove()} disabled={isUploading} className="bridge-button-secondary focus-ring">
              <Trash2 size={17} />
              Remove
            </button>
          ) : null}
          <p className="w-full text-xs text-[var(--text-secondary)]">JPG, JPEG, PNG, or WebP. Maximum 10 MB.</p>
          {message ? <p role="status" className="w-full text-sm text-emerald-300">{message}</p> : null}
          {error ? <p role="alert" className="w-full text-sm text-red-300">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
