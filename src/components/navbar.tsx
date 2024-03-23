import React from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/images/oscarslogo.svg";
import { AccountCircleIcon } from "@/assets/icons/AccountCircleIcon";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./button";
import styled from "styled-components";

// Styled components
const NavbarContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px 4px 8px;
  background-color: var(--color-neutral-0);
  margin-bottom: 16px;

  @media (min-width: 768px) {
    margin-bottom: 32px;
  }
`;

const Logo = styled(Link)`
  font-size: 24px;
  text-decoration: none;
  color: var(--color-primary-500);
  display: flex;
  align-items: center;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);

  &:hover {
    color: var(--color-primary-500);
  }

  span {
    @media (max-width: 768px) {
      display: none;
    }

    margin-top: 3px;
    letter-spacing: 0.5px;
  }

  img {
    height: 48px;
    width: 48px;

    @media (min-width: 768px) {
      height: 64px;
      width: 64px;
    }
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);

  svg {
    margin-top: 3px;
    height: 32px;
    width: 32px;
    fill: var(--color-primary-500);
    transition: fill 0.2s ease-in-out;
    -webkit-tap-highlight-color: rgba(255, 255, 255, 0);

    &:hover {
      fill: var(--color-primary-700);
    }
  }
`;

const NavLink = styled(Link)`
  color: var(--color-primary-500);
  transition: color 0.2s ease-in-out;

  &:hover {
    color: var(--color-primary-700);
  }
`;

// Navbar Component
const Navbar: React.FC = () => {
  const { isSignedIn, isAdmin } = useAuth();

  return (
    <NavbarContainer>
      <Logo href="/">
        <Image src={logo} alt="Oscar logo" width={38} height={40} />
        <span>OSCARS DEATH RACE</span>
      </Logo>
      <NavLinks>
        {isAdmin && <NavLink href="/admin">Admin</NavLink>}
        {<NavLink href="/statistics">Statistics</NavLink>}
        {isSignedIn && <NavLink href="/leaderboard">Leaderboard</NavLink>}
        {!isSignedIn && (
          <NavLink type="link" href="/login">
            Log in
          </NavLink>
        )}
        {!isSignedIn && (
          <Button size="sm" type="link" to="/signup" label="Sign up" />
        )}
        {isSignedIn && (
          <Link href="/settings" aria-label="Go to user settings">
            <AccountCircleIcon />
          </Link>
        )}
      </NavLinks>
    </NavbarContainer>
  );
};

export default Navbar;
