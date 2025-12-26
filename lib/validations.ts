export const FULL_NAME_MAX_LENGTH = 16;

export const isValidFullName = (name: string) => {
  if (!name || typeof name !== "string") return false;
  if (name.length > FULL_NAME_MAX_LENGTH) return false;

  // use Unicode property escapes to match all language text characters
  // \p{L} - match any language letter
  // \p{N} - match any number
  // \p{M} - match mark symbols (e.g. diacritics)
  // \s - match space
  // [\._-] - allow dots, underscores, and hyphens
  const regex = /^[\p{L}\p{N}\p{M}\s\._-]+$/u;

  const trimmedName = name.trim();
  if (trimmedName.length === 0) return false;

  return regex.test(trimmedName);
};

export const AVATAR_MAX_FILE_SIZE = 1024 * 1024; // 1MB
export const AVATAR_FILE_CONFIG = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
};
export const AVATAR_ALLOWED_FILE_TYPES = Object.values(AVATAR_FILE_CONFIG);
export const AVATAR_ALLOWED_EXTENSIONS = Object.keys(AVATAR_FILE_CONFIG);
export const AVATAR_ACCEPT_ATTRIBUTE = AVATAR_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(", ");
