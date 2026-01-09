/**
 * API Error Class for frontend error handling
 */
export class ApiError extends Error {
  constructor(status, message, details = null, response = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.response = response;
  }

  static fromResponse(error) {
    const status = error.response?.status || 500;
    const data = error.response?.data;

    return new ApiError(
      status,
      data?.message || error.message || "An unexpected error occurred",
      data?.error?.details || null,
      error.response
    );
  }
}

/**
 * Error handling utility functions
 */
export class ErrorHandler {
  // Map API error codes to user-friendly messages
  static getErrorMessage(error) {
    if (error instanceof ApiError || error.response) {
      const status = error.status || error.response?.status;
      const data = error.response?.data;

      // Return API message if available
      if (data?.message) {
        return data.message;
      }

      // Fallback messages based on status code
      switch (status) {
        case 400:
          return "Invalid request. Please check your input and try again.";
        case 401:
          return "Please log in to continue.";
        case 403:
          return "You do not have permission to perform this action.";
        case 404:
          return "The requested resource was not found.";
        case 409:
          return "This resource already exists or conflicts with existing data.";
        case 422:
          return "The provided data is invalid. Please check your input.";
        case 429:
          return "Too many requests. Please wait a moment and try again.";
        case 500:
          return "Server error. Please try again later.";
        case 502:
        case 503:
        case 504:
          return "Service is temporarily unavailable. Please try again later.";
        default:
          return error.message || "An unexpected error occurred.";
      }
    }

    // Network or other errors
    if (
      error.code === "NETWORK_ERROR" ||
      error.message?.includes("Network Error")
    ) {
      return "Network error. Please check your internet connection.";
    }

    return error.message || "An unexpected error occurred.";
  }

  // Get validation errors for forms
  static getValidationErrors(error) {
    const data = error.response?.data;
    const details = data?.error?.details;

    if (details && Array.isArray(details)) {
      return details.reduce((acc, detail) => {
        if (detail.field) {
          acc[detail.field] = detail.message;
        }
        return acc;
      }, {});
    }

    return {};
  }

  // Check if error is due to authentication
  static isAuthError(error) {
    const status = error.status || error.response?.status;
    return status === 401;
  }

  // Check if error is due to permission
  static isPermissionError(error) {
    const status = error.status || error.response?.status;
    return status === 403;
  }

  // Check if error is a validation error
  static isValidationError(error) {
    const status = error.status || error.response?.status;
    return status === 400 || status === 422;
  }

  // Check if error is a network error
  static isNetworkError(error) {
    return (
      error.code === "NETWORK_ERROR" ||
      error.message?.includes("Network Error") ||
      !error.response
    );
  }

  // Get error severity level
  static getErrorSeverity(error) {
    const status = error.status || error.response?.status;

    if (status >= 500) return "error";
    if (status >= 400) return "warning";
    return "info";
  }

  // Log error for debugging
  static logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      status: error.status || error.response?.status,
      url: error.response?.config?.url,
      method: error.response?.config?.method?.toUpperCase(),
      data: error.response?.data,
      context,
      timestamp: new Date().toISOString(),
    };

    console.error("API Error:", errorInfo);

    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === "production") {
      // sendToErrorTrackingService(errorInfo);
    }
  }
}

/**
 * Toast notification helper for errors
 */
export class ErrorNotification {
  static show(error, toast) {
    const message = ErrorHandler.getErrorMessage(error);
    const severity = ErrorHandler.getErrorSeverity(error);

    if (toast) {
      toast.show({
        severity,
        summary: this.getErrorTitle(error),
        detail: message,
        life: severity === "error" ? 5000 : 3000,
      });
    } else {
      // Fallback to console if no toast system
      console.error(message);
    }
  }

  static getErrorTitle(error) {
    const status = error.status || error.response?.status;

    switch (status) {
      case 400:
      case 422:
        return "Validation Error";
      case 401:
        return "Authentication Required";
      case 403:
        return "Access Denied";
      case 404:
        return "Not Found";
      case 409:
        return "Conflict";
      case 429:
        return "Rate Limited";
      case 500:
        return "Server Error";
      default:
        return "Error";
    }
  }
}

/**
 * Async action wrapper with error handling
 */
export const withErrorHandling = (asyncFn, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const apiError = ApiError.fromResponse(error);

      // Log error
      ErrorHandler.logError(apiError, options.context);

      // Show notification if configured
      if (options.showNotification && options.toast) {
        ErrorNotification.show(apiError, options.toast);
      }

      // Re-throw if configured
      if (options.rethrow !== false) {
        throw apiError;
      }

      return null;
    }
  };
};

/**
 * Form submission error handler
 */
export const handleFormError = (error, setFieldErrors, toast) => {
  ErrorHandler.logError(error);

  // Handle validation errors
  if (ErrorHandler.isValidationError(error)) {
    const validationErrors = ErrorHandler.getValidationErrors(error);
    if (Object.keys(validationErrors).length > 0 && setFieldErrors) {
      setFieldErrors(validationErrors);
      return;
    }
  }

  // Show general error notification
  ErrorNotification.show(error, toast);
};
