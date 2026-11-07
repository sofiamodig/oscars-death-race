import { useEffect } from "react";
import { useRouter } from "next/router";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GA_ID;

export const GoogleAnalytics = () => {
  const router = useRouter();

  useEffect(() => {
    if (!measurementId) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));

    const trackPageView = (url: string) => {
      window.gtag?.("event", "page_view", {
        page_path: url,
        page_location: window.location.origin + url,
        page_title: document.title,
      });
    };

    const scriptId = "google-analytics-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);

      window.gtag?.("js", new Date());
      window.gtag?.("config", measurementId, { send_page_view: false });
    }

    trackPageView(router.asPath);
    router.events.on("routeChangeComplete", trackPageView);
    return () => router.events.off("routeChangeComplete", trackPageView);
  }, [router.events]);

  return null;
};
