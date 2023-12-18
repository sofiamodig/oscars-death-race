import type { AppProps } from "next/app";
import { SeenProvider } from "@/contexts/seenContext";
import { SnackbarProvider } from "@/contexts/snackbarContext";
import { SiteInfoProvider } from "@/contexts/siteInfoContext";
import { LeaderboardProvider } from "@/contexts/leaderboardContext";
import { Layout } from "@/components/layout";
import "../assets/fonts/notoSans/fonts.css";
import "@/styles/globals.css";
import "react-dropdown/style.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SnackbarProvider>
      <SiteInfoProvider>
        <SeenProvider>
          <LeaderboardProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </LeaderboardProvider>
        </SeenProvider>
      </SiteInfoProvider>
    </SnackbarProvider>
  );
}
