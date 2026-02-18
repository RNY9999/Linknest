let csrfToken: string | null = null;

export const setCsrfToken = (token: string | null) => {
  csrfToken = token;
};

export const getCsrfToken = () => {
  return csrfToken;
};

export const clearCsrfToken = () => {
  csrfToken = null;
};
