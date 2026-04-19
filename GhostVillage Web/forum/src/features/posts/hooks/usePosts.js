import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import * as postService from "../services/postService";

// Query keys
export const QUERY_KEYS = {
  POSTS: "posts",
  POST: "post",
  USER_POSTS: "userPosts",
};

const updatePostCollection = (oldData, updatedPost) => {
  if (
    !oldData?.data?.posts ||
    !Array.isArray(oldData.data.posts) ||
    !updatedPost?._id
  ) {
    return oldData;
  }

  const nextPosts = oldData.data.posts.map((post) =>
    String(post._id) === String(updatedPost._id)
      ? { ...post, ...updatedPost }
      : post,
  );

  return {
    ...oldData,
    data: {
      ...oldData.data,
      posts: nextPosts,
    },
  };
};

// Get all posts
export const usePosts = (params = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.POSTS, params],
    queryFn: () => postService.getPosts(params),
    staleTime: 30000, // 30 seconds
  });
};

// Get single post
export const usePost = (postId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.POST, postId],
    queryFn: () => postService.getPost(postId),
    enabled: !!postId,
  });
};

// Get user posts
export const useUserPosts = (userId, params = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.USER_POSTS, userId, params],
    queryFn: () => postService.getUserPosts(userId, params),
    enabled: !!userId,
  });
};

// Create post
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_POSTS] });
    },
  });
};

// Update post
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, postData }) =>
      postService.updatePost(postId, postData),
    onSuccess: (data, variables) => {
      const updatedPost = data?.data;

      if (updatedPost?._id) {
        queryClient.setQueriesData(
          { queryKey: [QUERY_KEYS.POSTS] },
          (oldData) => updatePostCollection(oldData, updatedPost),
        );
        queryClient.setQueriesData(
          { queryKey: [QUERY_KEYS.USER_POSTS] },
          (oldData) => updatePostCollection(oldData, updatedPost),
        );
        queryClient.setQueryData(
          [QUERY_KEYS.POST, variables.postId],
          (oldData) => {
            if (!oldData?.data) return oldData;
            return {
              ...oldData,
              data: {
                ...oldData.data,
                ...updatedPost,
              },
            };
          },
        );
      }

      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_POSTS] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.POST, variables.postId],
      });
    },
  });
};

// Delete post
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postService.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_POSTS] });
    },
  });
};

// Toggle like
export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postService.toggleLike,
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POST, postId] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to like post");
    },
  });
};

// Toggle bookmark
export const useToggleBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postService.toggleBookmark,
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POST, postId] });

      // Trigger refetch user to update bookmarks array
      // This will be caught by components using useAuth
      window.dispatchEvent(new CustomEvent("refetch-user"));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to bookmark post");
    },
  });
};

// Report post
export const useReportPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postService.reportPost,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.POST, variables.postId],
      });
      toast.success(data?.message || "Report submitted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to report post");
    },
  });
};
