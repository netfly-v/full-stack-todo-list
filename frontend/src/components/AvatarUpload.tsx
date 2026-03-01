import { useRef, useState } from 'react';
import './AvatarUpload.css';
import { getAssetUrl } from '../utils/assetUrl';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onUpload: (file: File) => void;
  onDelete: () => void;
  isUploading: boolean;
}

export function AvatarUpload({ currentAvatarUrl, onUpload, onDelete, isUploading }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG and WebP are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    onUpload(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete your avatar?')) {
      setPreviewUrl(null);
      onDelete();
    }
  };

  const displayUrl = previewUrl || getAssetUrl(currentAvatarUrl);

  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        {displayUrl ? (
          <img src={displayUrl} alt="Avatar" className="avatar-image" />
        ) : (
          <div className="avatar-placeholder">
            <span>No avatar</span>
          </div>
        )}
      </div>

      <div className="avatar-actions">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          onClick={handleButtonClick}
          disabled={isUploading}
          className="btn-primary"
        >
          {isUploading ? 'Uploading...' : currentAvatarUrl ? 'Change Photo' : 'Upload Photo'}
        </button>

        {currentAvatarUrl && !isUploading && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn-danger"
          >
            Delete
          </button>
        )}
      </div>

      <p className="avatar-hint">
        JPEG, PNG or WebP. Max 5MB. Image will be resized to 300x300.
      </p>
    </div>
  );
}
