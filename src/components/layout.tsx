import { FC, ReactNode, useContext, useEffect } from "react";
import { SiteInfoContext } from "@/contexts/siteInfoContext";
import { useAuth } from "@/hooks/useAuth";
import Footer from "./footer";
import Navbar from "./navbar";
import { UnderConstruction } from "./underConstruction";

interface Props {
  children: ReactNode;
}

export const Layout: FC<Props> = ({ children }) => {
  const { isAdmin } = useAuth();
  const { construction } = useContext(SiteInfoContext);

  useEffect(() => {
    window.onload = () => {
      document.body.style.visibility = "visible";
    };

    return () => {
      document.body.style.visibility = "visible";
    };
  }, []);

  if (construction == undefined) return <></>;

  if (construction && !isAdmin) return <UnderConstruction />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-[calc(100%_-_32px)] max-w-[1400px]">{children}</main>
      <Footer />
    </div>
  );
};
