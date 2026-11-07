declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type AnalyticsParams = Record<string, string | number | boolean>;

export const trackAnalyticsEvent = (eventName: string, params: AnalyticsParams = {}) => {
  if (typeof window === "undefined") return;
  window.gtag?.("event", eventName, params);
};
