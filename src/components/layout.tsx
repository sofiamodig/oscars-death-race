import { FC, ReactNode, useContext, useEffect } from "react";
import styled from "styled-components";
import { SiteInfoContext } from "@/contexts/siteInfoContext";
import { useAuth } from "@/hooks/useAuth";
import Footer from "./footer";
import Navbar from "./navbar";
import { UnderConstruction } from "./underConstruction";

const OuterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Main = styled.main`
  width: calc(100% - 32px);
  max-width: 1400px;
  margin: 0 auto;
`;

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
    <OuterWrapper>
      <Navbar />
      <Main>{children}</Main>
      <Footer />
    </OuterWrapper>
  );
};
