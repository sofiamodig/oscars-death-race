import { SeenProvider } from "@/contexts/seenContext";
import { SnackbarProvider } from "@/contexts/snackbarContext";
import type { AppProps } from "next/app";
import { SiteInfoProvider } from "@/contexts/siteInfoContext";
import { Layout } from "@/components/layout";
import "../assets/fonts/notoSans/fonts.css";
import "@/styles/globals.css";
import "react-dropdown/style.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SnackbarProvider>
      <SiteInfoProvider>
        <SeenProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </SeenProvider>
      </SiteInfoProvider>
    </SnackbarProvider>
  );
}
