import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import commentService from "../services/commentService";
import { toast } from "react-hot-toast";

export const COMMENT_QUERY_KEYS = {
  COMMENTS: "comments",
};

const updateCommentCollection = (oldData, updatedComment) => {
  if (!oldData?.data || !Array.isArray(oldData.data) || !updatedComment?._id) {
    return oldData;
  }

  const nextComments = oldData.data.map((comment) =>
    String(comment._id) === String(updatedComment._id)
      ? { ...comment, ...updatedComment }
      : comment,
  );

  return {
    ...oldData,
    data: nextComments,
  };
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
      queryClient.invalidateQueries({
        queryKey: [COMMENT_QUERY_KEYS.COMMENTS, postId],
      });
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
    onSuccess: (data) => {
      const updatedComment = data?.data;

      if (updatedComment?._id) {
        queryClient.setQueriesData(
          { queryKey: [COMMENT_QUERY_KEYS.COMMENTS, postId] },
          (oldData) => updateCommentCollection(oldData, updatedComment),
        );
      }

      queryClient.invalidateQueries({
        queryKey: [COMMENT_QUERY_KEYS.COMMENTS, postId],
      });
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
      queryClient.invalidateQueries({
        queryKey: [COMMENT_QUERY_KEYS.COMMENTS, postId],
      });
      toast.success("Comment deleted!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete comment");
    },
  });
};

export const useReportComment = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, reportData }) =>
      commentService.reportComment(postId, commentId, reportData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [COMMENT_QUERY_KEYS.COMMENTS, postId],
      });
      toast.success(data?.message || "Comment report submitted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to report comment");
    },
  });
};
