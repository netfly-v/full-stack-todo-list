const uploadsBaseUrl = (import.meta.env.VITE_UPLOADS_BASE_URL ?? '').replace(/\/+$/, '');

export const getAssetUrl = (assetPath?: string | null) => {
  if (!assetPath) {
    return null;
  }

  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }

  return `${uploadsBaseUrl}${assetPath}`;
};
