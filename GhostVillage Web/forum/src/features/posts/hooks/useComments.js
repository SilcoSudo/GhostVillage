import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import commentService from "../services/commentService";
import { toast } from "react-hot-toast";

export const COMMENT_QUERY_KEYS = {
  COMMENTS: "comments",
};

// Get comments for a post
export const useComments = (postId, options = {}) => {
  return useQuery({
    queryKey: [COMMENT_QUERY_KEYS.COMMENTS, postId, options],
    queryFn: () => commentService.getComments(postId, options),
    enabled: !!postId,
  });
};

// Create a comment
export const useCreateComment = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentData) =>
      commentService.createComment(postId, commentData),
    onSuccess: () => {
      queryClient.invalidateQueries([COMMENT_QUERY_KEYS.COMMENTS, postId]);
      toast.success("Comment posted!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to post comment");
    },
  });
};

// Update a comment
export const useUpdateComment = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, commentData }) =>
      commentService.updateComment(postId, commentId, commentData),
    onSuccess: () => {
      queryClient.invalidateQueries([COMMENT_QUERY_KEYS.COMMENTS, postId]);
      toast.success("Comment updated!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update comment");
    },
  });
};

// Delete a comment
export const useDeleteComment = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId) => commentService.deleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries([COMMENT_QUERY_KEYS.COMMENTS, postId]);
      toast.success("Comment deleted!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete comment");
    },
  });
};
