export type ActionResult<T = any> =
  | { success: true; data?: T; customCode?: string }
  | { success: false; error: string; customCode?: string };

export const actionResponse = {
  success: <T>(data?: T, customCode?: string): ActionResult<T> => {
    return { success: true, data, customCode };
  },
  error: <T>(message: string, customCode?: string): ActionResult<T> => {
    return { success: false, error: message, customCode };
  },

  unauthorized: <T>(message = "User not authenticated.", customCode?: string): ActionResult<T> => {
    return actionResponse.error(message, customCode);
  },
  badRequest: <T>(message = "Bad Request", customCode?: string): ActionResult<T> => {
    return actionResponse.error(message, customCode);
  },
  forbidden: <T>(message = "Forbidden", customCode?: string): ActionResult<T> => {
    return actionResponse.error(message, customCode);
  },
  notFound: <T>(message = "Not Found", customCode?: string): ActionResult<T> => {
    return actionResponse.error(message, customCode);
  },
  conflict: <T>(message = "Conflict", customCode?: string): ActionResult<T> => {
    return actionResponse.error(message, customCode);
  },
};
