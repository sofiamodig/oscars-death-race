import type { AppProps } from "next/app";
import { SeenProvider } from "@/contexts/seenContext";
import { SnackbarProvider } from "@/contexts/snackbarContext";
import { SiteInfoProvider } from "@/contexts/siteInfoContext";
import { Layout } from "@/components/layout";
import "../assets/fonts/notoSans/fonts.css";
import "@/styles/globals.css";
import "react-dropdown/style.css";
import { CommentsProvider } from "@/contexts/commentsContext";
import { AuthProvider } from "@/contexts/authContext";
import { ThemeProvider } from "@/contexts/themeContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <SnackbarProvider>
        <AuthProvider>
          <SiteInfoProvider>
            <SeenProvider>
              <CommentsProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </CommentsProvider>
            </SeenProvider>
          </SiteInfoProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
