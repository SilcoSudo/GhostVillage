/**
 * useFeedback Hook
 * Manages feedback state and interactions for posts
 */

import { useState, useCallback } from 'react';
import feedbackAPI from '../api/feedbackAPI';

export const useFeedback = (postId, initialFeedback = null) => {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Record feedback on post
   */
  const recordFeedback = useCallback(
    async (action, reason = '') => {
      try {
        setLoading(true);
        setError(null);

        const response = await feedbackAPI.recordFeedback(postId, action, reason);

        setFeedback(response.data);
        return response.data;
      } catch (err) {
        setError(err.message || 'Failed to record feedback');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [postId]
  );

  /**
   * Get feedback for post
   */
  const getFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await feedbackAPI.getFeedback(postId);

      setFeedback(response.data);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch feedback');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [postId]);

  /**
   * Remove feedback for post
   */
  const removeFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await feedbackAPI.removeFeedback(postId);

      setFeedback(null);
      return null;
    } catch (err) {
      setError(err.message || 'Failed to remove feedback');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [postId]);

  return {
    feedback,
    loading,
    error,
    recordFeedback,
    getFeedback,
    removeFeedback,
  };
};

export default useFeedback;
