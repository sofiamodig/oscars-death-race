import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import logo from "@/assets/images/oscarslogo.svg";
import { AccountCircleIcon } from "@/assets/icons/AccountCircleIcon";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./button";
import styled from "styled-components";
import { supabase } from "@/supabase";

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
  gap: 16px;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);

  @media (min-width: 768px) {
    gap: 24px;
  }

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
  font-size: 14px;

  @media (min-width: 768px) {
    font-size: 16px;
  }

  &:hover {
    color: var(--color-primary-700);
  }
`;

const LeaderboardNavLink = styled(NavLink)`
  position: relative;
`;

const InvitationBadge = styled.span`
  position: absolute;
  top: -9px;
  right: -12px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  color: white;
  background: var(--color-ui-red, #b42318);
  font-size: 11px;
  font-weight: 700;
`;

// Navbar Component
const Navbar: React.FC = () => {
  const { isSignedIn, isAdmin } = useAuth();
  const router = useRouter();
  const [invitationCount, setInvitationCount] = useState(0);

  useEffect(() => {
    let active = true;
    const loadInvitations = async () => {
      if (!isSignedIn) {
        setInvitationCount(0);
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const response = await fetch("/api/groups", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const result = await response.json();
        if (active) setInvitationCount(result.invitations?.length ?? 0);
      } catch {
        // Keep the existing badge state if the request is temporarily unavailable.
      }
    };
    void loadInvitations();
    window.addEventListener("focus", loadInvitations);
    window.addEventListener("group-invitations-changed", loadInvitations);
    return () => {
      active = false;
      window.removeEventListener("focus", loadInvitations);
      window.removeEventListener("group-invitations-changed", loadInvitations);
    };
  }, [isSignedIn, router.asPath]);

  return (
    <NavbarContainer>
      <Logo href="/">
        <Image src={logo} alt="Oscar logo" width={38} height={40} />
        <span>OSCARS DEATH RACE</span>
      </Logo>
      <NavLinks>
        {isAdmin && <NavLink href="/admin">Admin</NavLink>}
        <NavLink href="/all-time">All time</NavLink>
        <NavLink href="/statistics">Statistics</NavLink>
        {isSignedIn && (
          <LeaderboardNavLink href="/leaderboard#invitations" aria-label={`Leaderboard${invitationCount ? `, ${invitationCount} invitations` : ""}`}>
            Leaderboard
            {invitationCount > 0 && <InvitationBadge>{invitationCount}</InvitationBadge>}
          </LeaderboardNavLink>
        )}
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
