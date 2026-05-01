export const getAppBaseUrl = () => (import.meta.env.VITE_APP_BASE_URL || window.location.origin).replace(/\/$/, "");
