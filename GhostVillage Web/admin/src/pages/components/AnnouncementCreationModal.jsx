import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { useCreateAnnouncement } from '../../shared/hooks/useAnnouncements';
import { generateSlug } from '../../shared/services/announcementService';
import { uploadImage, validateImageFile, createImagePreview, revokeImagePreview } from '../../shared/services/uploadService';
import { toast } from 'react-hot-toast';
import '../assets/styles/AnnouncementModal.css';

const AnnouncementCreationModal = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const createMutation = useCreateAnnouncement();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    coverImage: '',
    isPinned: false,
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Create preview
    const preview = createImagePreview(file);
    setImagePreview(preview);
    setImageFile(file);
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      revokeImagePreview(imagePreview);
    }
    setImagePreview(null);
    setImageFile(null);
    setFormData(prev => ({ ...prev, coverImage: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = t('announcements.modal.errors.titleRequired');
    if (!formData.content.trim()) newErrors.content = t('announcements.modal.errors.contentRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        let coverImageUrl = formData.coverImage;

        // Upload image if selected
        if (imageFile) {
          setIsUploading(true);
          try {
            const uploadResult = await uploadImage(imageFile, 'announcement');
            // Backend returns user profile with avatar URL
            coverImageUrl = uploadResult.data?.avatar || uploadResult.avatar;
            if (!coverImageUrl) {
              console.error('Upload result:', uploadResult);
              throw new Error('No avatar URL in response');
            }
          } catch (uploadError) {
            console.error('Upload error:', uploadError);
            toast.error(t('announcements.modal.errors.uploadImageFailed'));
            setIsUploading(false);
            return;
          }
          setIsUploading(false);
        }

        const slug = generateSlug(formData.title);
        const announcementData = {
          ...formData,
          slug,
          coverImage: coverImageUrl,
          excerpt: formData.excerpt || formData.content.substring(0, 200),
        };
        
        await createMutation.mutateAsync(announcementData);
        onSubmit?.(); // Call parent callback if provided
        handleClose();
      } catch (error) {
        // Error handled by mutation hook
      }
    }
  };

  const handleClose = () => {
    // Clean up
    if (imagePreview) {
      revokeImagePreview(imagePreview);
    }
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      coverImage: '',
      isPinned: false,
      isActive: true,
    });
    setErrors({});
    setImagePreview(null);
    setImageFile(null);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content announcement-creation-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <Plus size={20} className="header-icon" />
            <h2>{t('announcements.createNew')}</h2>
          </div>
          <button className="close-btn" onClick={handleClose} disabled={createMutation.isLoading}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                {t('announcements.modal.titleLabel')} <span className="required">*</span>
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('announcements.modal.titlePlaceholder')}
                className={`form-input ${errors.title ? 'input-error' : ''}`}
                maxLength={200}
                disabled={createMutation.isLoading}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
              <span className="char-count">{formData.title.length}/200</span>
            </div>

            {/* Content (Rich Text Editor placeholder) */}
            <div className="form-group">
              <label htmlFor="content" className="form-label">
                {t('announcements.content')} <span className="required">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder={t('announcements.modal.contentPlaceholder')}
                className={`form-textarea ${errors.content ? 'input-error' : ''}`}
                rows={8}
                disabled={createMutation.isLoading}
              />
              {errors.content && <span className="error-message">{errors.content}</span>}
              <small className="form-hint">{t('announcements.modal.richTextHint')}</small>
            </div>

            {/* Excerpt */}
            <div className="form-group">
              <label htmlFor="excerpt" className="form-label">
                {t('announcements.excerpt')} <span className="optional">({t('announcements.modal.optional')})</span>
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder={t('announcements.modal.excerptPlaceholder')}
                className="form-textarea"
                rows={3}
                maxLength={300}
                disabled={createMutation.isLoading}
              />
              <span className="char-count">{formData.excerpt.length}/300</span>
            </div>

            {/* Cover Image URL */}
            <div className="form-group">
              <label className="form-label">
                {t('announcements.coverImage')} <span className="optional">({t('announcements.modal.optional')})</span>
              </label>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="image-preview-container">
                  <img 
                    src={imagePreview} 
                    alt={t('announcements.modal.previewAlt')}
                  />
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={handleRemoveImage}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* File Upload Button */}
              {!imagePreview && (
                <div 
                  className="upload-area"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={48} />
                  <p>{t('announcements.modal.uploadCover')}</p>
                  <p>{t('announcements.modal.uploadFormats')}</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                disabled={createMutation.isLoading || isUploading}
                style={{ display: 'none' }}
              />
            </div>

            {/* Options */}
            <div className="form-group-row">
              <div className="form-checkbox">
                <input
                  id="isPinned"
                  type="checkbox"
                  name="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                  disabled={createMutation.isLoading}
                />
                <label htmlFor="isPinned">{t('announcements.modal.pinAnnouncement')}</label>
              </div>

              <div className="form-checkbox">
                <input
                  id="isActive"
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  disabled={createMutation.isLoading}
                />
                <label htmlFor="isActive">{t('announcements.modal.setActive')}</label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleClose}
              disabled={createMutation.isLoading}
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={createMutation.isLoading || isUploading}
            >
              {createMutation.isLoading || isUploading ? (
                <>
                  <Loader2 size={16} className="spinner" style={{ marginRight: '8px' }} />
                  {isUploading ? t('announcements.modal.uploading') : t('announcements.modal.creating')}
                </>
              ) : (
                t('announcements.modal.createButton')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementCreationModal;
