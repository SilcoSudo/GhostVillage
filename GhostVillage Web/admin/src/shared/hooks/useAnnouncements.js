import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import * as announcementService from '../services/announcementService';

// Query keys
export const ANNOUNCEMENT_KEYS = {
  all: ['announcements'],
  lists: () => [...ANNOUNCEMENT_KEYS.all, 'list'],
  list: (filters) => [...ANNOUNCEMENT_KEYS.lists(), filters],
  pinned: () => [...ANNOUNCEMENT_KEYS.all, 'pinned'],
  detail: (slug) => [...ANNOUNCEMENT_KEYS.all, 'detail', slug],
};

/**
 * Hook: Fetch announcements list with pagination
 */
export const useAnnouncementList = ({ page = 1, limit = 10, includeInactive = true } = {}) => {
  return useQuery({
    queryKey: ANNOUNCEMENT_KEYS.list({ page, limit, includeInactive }),
    queryFn: () => announcementService.getAnnouncements({ page, limit, includeInactive }),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook: Fetch pinned announcements
 */
export const usePinnedAnnouncements = (limit = 5) => {
  return useQuery({
    queryKey: ANNOUNCEMENT_KEYS.pinned(),
    queryFn: () => announcementService.getPinnedAnnouncements(limit),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook: Fetch single announcement by slug
 */
export const useAnnouncementDetail = (slug) => {
  return useQuery({
    queryKey: ANNOUNCEMENT_KEYS.detail(slug),
    queryFn: () => announcementService.getAnnouncementBySlug(slug),
    enabled: !!slug,
  });
};

/**
 * Hook: Create new announcement
 */
export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: announcementService.createAnnouncement,
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries(ANNOUNCEMENT_KEYS.lists());
      toast.success('Announcement created successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create announcement';
      toast.error(message);
    },
  });
};

/**
 * Hook: Update announcement
 */
export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => announcementService.updateAnnouncement(id, data),
    onSuccess: (data, variables) => {
      // Invalidate lists and specific detail
      queryClient.invalidateQueries(ANNOUNCEMENT_KEYS.lists());
      queryClient.invalidateQueries(ANNOUNCEMENT_KEYS.detail(variables.slug));
      toast.success('Announcement updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update announcement';
      toast.error(message);
    },
  });
};

/**
 * Hook: Delete announcement
 */
export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: announcementService.deleteAnnouncement,
    onSuccess: () => {
      // Invalidate lists
      queryClient.invalidateQueries(ANNOUNCEMENT_KEYS.lists());
      toast.success('Announcement deleted successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete announcement';
      toast.error(message);
    },
  });
};

/**
 * Hook: Toggle pin status
 */
export const useTogglePin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: announcementService.togglePin,
    onSuccess: (data) => {
      queryClient.invalidateQueries(ANNOUNCEMENT_KEYS.lists());
      queryClient.invalidateQueries(ANNOUNCEMENT_KEYS.pinned());
      const status = data.data?.isPinned ? 'pinned' : 'unpinned';
      toast.success(`Announcement ${status} successfully!`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to toggle pin';
      toast.error(message);
    },
  });
};

/**
 * Hook: Toggle active status
 */
export const useToggleActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: announcementService.toggleActive,
    onSuccess: (data) => {
      queryClient.invalidateQueries(ANNOUNCEMENT_KEYS.lists());
      const status = data.data?.isActive ? 'activated' : 'deactivated';
      toast.success(`Announcement ${status} successfully!`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to toggle active status';
      toast.error(message);
    },
  });
};
