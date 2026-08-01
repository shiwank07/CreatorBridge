import { expect, test } from "@playwright/test";

import { PROFILE_IMAGE_MAX_BYTES, validateProfileImage } from "../../lib/profile-image";

test.describe("profile image validation", () => {
  test("accepts the supported creator and brand image formats", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validateProfileImage({ type, size: 1024 })).toBe("");
    }
  });

  test("rejects SVG and executable or unknown file types", () => {
    expect(validateProfileImage({ type: "image/svg+xml", size: 1024 })).toContain("JPG");
    expect(validateProfileImage({ type: "application/x-msdownload", size: 1024 })).toContain("JPG");
  });

  test("rejects images over Clerk's client-side limit", () => {
    expect(validateProfileImage({ type: "image/png", size: PROFILE_IMAGE_MAX_BYTES + 1 })).toBe(
      "Choose an image smaller than 10 MB.",
    );
  });

  test("accepts an image exactly at the size limit", () => {
    expect(validateProfileImage({ type: "image/webp", size: PROFILE_IMAGE_MAX_BYTES })).toBe("");
  });
});
