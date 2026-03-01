import { useState, useEffect, useMemo } from 'react';
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar } from '../hooks/useProfile';
import { AvatarUpload } from './AvatarUpload';
import './ProfilePage.css';

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export function ProfilePage() {
  const { data: user, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
    }
  }, [user]);

  // Track if form has changes
  const hasChanges = useMemo(() => {
    if (!user) return false;
    const nameChanged = name !== (user.name || '');
    const bioChanged = bio !== (user.bio || '');
    return nameChanged || bioChanged;
  }, [name, bio, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile.mutateAsync({
        name: name.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      alert('Profile updated successfully!');
    } catch (error) {
      const apiError = error as ApiError;
      alert(apiError.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      await uploadAvatar.mutateAsync(file);
    } catch (error) {
      const apiError = error as ApiError;
      alert(apiError.response?.data?.error || 'Failed to upload avatar');
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await deleteAvatar.mutateAsync();
    } catch (error) {
      const apiError = error as ApiError;
      alert(apiError.response?.data?.error || 'Failed to delete avatar');
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p className="error">Failed to load profile. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Profile Settings</h1>

        <div className="profile-section">
          <h2>Avatar</h2>
          <AvatarUpload
            currentAvatarUrl={user.avatar_url}
            onUpload={handleAvatarUpload}
            onDelete={handleAvatarDelete}
            isUploading={uploadAvatar.isPending || deleteAvatar.isPending}
          />
        </div>

        <div className="profile-section">
          <h2>Personal Information</h2>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={user.email} disabled className="form-input" />
              <small className="form-hint">Email cannot be changed</small>
            </div>

            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={100}
                className="form-input"
              />
              <small className="form-hint">{name.length}/100 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                maxLength={500}
                rows={4}
                className="form-textarea"
              />
              <small className="form-hint">{bio.length}/500 characters</small>
            </div>

            <button type="submit" disabled={!hasChanges || updateProfile.isPending} className="btn-save">
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </button>

            {updateProfile.isSuccess && !hasChanges && <p className="success-message">Profile saved!</p>}

            {updateProfile.isError && (
              <p className="error-message">
                {(updateProfile.error as ApiError)?.response?.data?.error || 'Failed to save profile'}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
