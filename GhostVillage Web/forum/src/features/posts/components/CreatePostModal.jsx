import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useCreatePost, useUpdatePost } from '../hooks/usePosts';
import { toast } from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './CreatePostModal.css';

const CreatePostModal = ({ show, onHide, post = null, mode = 'create' }) => {
  const { t } = useTranslation();
  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();
  const isEditMode = mode === 'edit' && post;
  const quillRef = useRef(null);
  // custom video modal refs/state
  const videoHandlerRef = useRef(null);
  const videoQuillRef = useRef(null);
  const videoRangeRef = useRef(null);
  // Replace nested modal with an inline popover to avoid backdrop/overlay issues
  const [showVideoPopover, setShowVideoPopover] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});
  const popoverRef = useRef(null);
  const [popoverPortalTarget, setPopoverPortalTarget] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');

  // (No custom cleanup here; rely on React-Bootstrap modal lifecycle)

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: 'General',
  });

  const categories = ['General', 'Discussion', 'Trading', 'Team Up', 'Bug Report'];

  const [errors, setErrors] = useState({});

  // Load post data when editing
  useEffect(() => {
    if (isEditMode && post) {
      setFormData({
        title: post.title || '',
        body: post.body || '',
        category: post.category || 'General',
      });
    } else if (!show) {
      // Reset form when modal closes
      setFormData({ title: '', body: '', category: 'General' });
      setErrors({});
    }
  }, [show, isEditMode, post]);

  // Quill editor modules configuration - Thêm lại nút link
  // (Removed custom Quill video icon override) — use default Quill icon for video button

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote'],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        // open custom modal to accept only YouTube links
        video: function () {
          const quill = this.quill;
          // store quill and range so we can insert from popover
          videoQuillRef.current = quill;
          videoRangeRef.current = quill.getSelection(true);
          // clear input and open popover anchored to toolbar button
          setVideoUrl('');
          setTimeout(() => openVideoPopoverAtButton(quill), 0);
        }
      }
    }
  }), []);

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'blockquote',
    'link', 'image', 'video'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBodyChange = (content) => {
    setFormData((prev) => ({ ...prev, body: content }));
    
    // Clear error when user starts typing
    if (errors.body) {
      setErrors((prev) => ({ ...prev, body: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('post.create.validation.titleRequired');
    } else if (formData.title.trim().length < 5) {
      newErrors.title = t('post.create.validation.titleMinLength');
    }

    if (!formData.body.trim()) {
      newErrors.body = t('post.create.validation.bodyRequired');
    } else if (formData.body.trim().length < 10) {
      newErrors.body = t('post.create.validation.bodyMinLength');
    }
    // Removed max length validation for body to support images/videos

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const postData = {
      title: formData.title.trim(),
      body: formData.body.trim(),
      category: formData.category,
    };

    try {
      if (isEditMode) {
        await updatePostMutation.mutateAsync({ postId: post._id, postData });
        toast.success('Post updated successfully!');
      } else {
        await createPostMutation.mutateAsync(postData);
        toast.success('Post created successfully!');
      }
      
      // Reset form
      setFormData({ title: '', body: '', category: 'General' });
      setErrors({});
      onHide();
    } catch (error) {
      console.error('❌ Failed to save post:', error);
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} post`);
    }
  };

  // Open the popover anchored to the toolbar's video button
  const openVideoPopoverAtButton = (quill) => {
    if (!quill) return;
    try {
      const toolbar = quill.container && quill.container.parentNode && quill.container.parentNode.querySelector && quill.container.parentNode.querySelector('.ql-toolbar');
      const btn = toolbar && toolbar.querySelector && toolbar.querySelector('button.ql-video');
      if (!btn) {
        setPopoverStyle({});
        setPopoverPortalTarget(null);
        setShowVideoPopover(true);
        return;
      }
      const rect = btn.getBoundingClientRect();
      const modalContent = document.querySelector('.create-post-modal .modal-content');
      if (modalContent) {
        setPopoverPortalTarget(modalContent);
        const modalRect = modalContent.getBoundingClientRect();
        const left = rect.left + rect.width / 2 - modalRect.left;
        const top = rect.bottom - modalRect.top + 6;
        setPopoverStyle({ position: 'absolute', left: left + 'px', top: top + 'px', transform: 'translateX(-50%)', zIndex: 2000 });
      } else {
        setPopoverPortalTarget(null);
        setPopoverStyle({ position: 'fixed', left: rect.left + rect.width / 2 + 'px', top: rect.bottom + 6 + 'px', transform: 'translateX(-50%)', zIndex: 2000 });
      }
    } catch (e) {
      setPopoverStyle({});
      setPopoverPortalTarget(null);
    }
    setShowVideoPopover(true);
  };

  const insertVideoFromPopover = () => {
    const url = videoUrl && videoUrl.trim();
    if (!url) { toast.error('Please enter a YouTube URL'); return; }
    const ytMatch = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/))([A-Za-z0-9_-]{11})/);
    const id = ytMatch ? ytMatch[1] : null;
    if (!id) { toast.error('Invalid YouTube URL'); return; }
    const embedUrl = `https://www.youtube.com/embed/${id}`;
    const quill = videoQuillRef.current || (quillRef.current && quillRef.current.getEditor && quillRef.current.getEditor());
    const range = videoRangeRef.current || (quill && quill.getSelection && quill.getSelection(true));
    if (quill && range) {
      quill.insertEmbed(range.index, 'video', embedUrl, 'user');
      try {
        const Q = ReactQuill.Quill;
        quill.setSelection(range.index + 1, Q && Q.sources ? Q.sources.SILENT : null);
      } catch (e) {
        quill.setSelection(range.index + 1);
      }
    }
    setShowVideoPopover(false);
    setVideoUrl('');
  };

  // Close popover when clicking outside; reposition on resize/scroll
  useEffect(() => {
    if (!showVideoPopover) return;
    const onDocMouse = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowVideoPopover(false);
      }
    };
    const onResizeOrScroll = () => {
      // attempt to reposition relative to current quill instance
      const quill = videoQuillRef.current || (quillRef.current && quillRef.current.getEditor && quillRef.current.getEditor());
      if (quill) {
        openVideoPopoverAtButton(quill);
      }
    };
    document.addEventListener('mousedown', onDocMouse);
    window.addEventListener('resize', onResizeOrScroll);
    window.addEventListener('scroll', onResizeOrScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDocMouse);
      window.removeEventListener('resize', onResizeOrScroll);
      window.removeEventListener('scroll', onResizeOrScroll, true);
    };
  }, [showVideoPopover]);

  const handleClose = () => {
    // Reset form data
    setFormData({ title: '', body: '', category: 'General' });
    setErrors({});

    // Call parent onHide - let React Bootstrap handle the rest
    onHide();
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      size="lg"
      centered
      className="create-post-modal"
      backdrop={true}
      keyboard={true}
      animation={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode ? t('post.edit.title') : t('post.create.title')}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Title */}
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('post.create.titlePlaceholder')}
              isInvalid={!!errors.title}
              maxLength={200}
              className="title-input"
            />
            <Form.Control.Feedback type="invalid">
              {errors.title}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Category Selection */}
          <Form.Group className="mb-3">
            <Form.Label>{t('post.create.category') || 'Category'}</Form.Label>
            <Form.Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="category-select"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Body with Rich Text Editor */}
          <Form.Group className="mb-3">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={formData.body}
              onChange={handleBodyChange}
              modules={modules}
              formats={formats}
              placeholder={t('post.create.contentPlaceholder')}
              className={`quill-editor ${errors.body ? 'is-invalid' : ''}`}
            />
            {errors.body && (
              <div className="invalid-feedback d-block">
                {errors.body}
              </div>
            )}
            <Form.Text className="text-muted">
              {formData.body.replace(/<[^>]*>/g, '').length} {t('post.create.contentCounter')}
            </Form.Text>
          </Form.Group>

          {/* Video URL modal (replaces prompt) */}
          {showVideoPopover && (() => {
            // compute portal target to render inside modal-content if possible
            const modalContainer = document.querySelector('.create-post-modal .modal-content');
            const portalTarget = modalContainer || document.body;
            return ReactDOM.createPortal(
              <div
                ref={popoverRef}
                className="video-popover"
                onMouseDown={(e) => e.stopPropagation()}
                style={{ ...popoverStyle, minWidth: '320px' }}
              >
                <Form.Group className="mb-2">
                  <Form.Label className="mb-1">YouTube URL</Form.Label>
                  <Form.Control
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    autoFocus
                  />
                </Form.Group>
                <div className="d-flex justify-content-end mt-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowVideoPopover(false)} className="me-2">Cancel</Button>
                  <Button variant="primary" size="sm" onClick={() => insertVideoFromPopover()}>Insert</Button>
                </div>
              </div>,
              portalTarget
            );
          })()}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <div className="modal-footer-left">
          <span className="save-count">
            Save <span className="count">0</span>
          </span>
        </div>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={createPostMutation.isLoading || updatePostMutation.isLoading}
          className="add-btn"
        >
          {(createPostMutation.isLoading || updatePostMutation.isLoading) ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {isEditMode ? t('post.edit.savingButton') : t('post.create.creatingButton')}
            </>
          ) : (
            isEditMode ? t('post.edit.saveButton') : 'Add'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePostModal;
