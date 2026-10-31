import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import logo from "@/assets/images/oscarslogo.svg";
import { AccountCircleIcon } from "@/assets/icons/AccountCircleIcon";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./button";
import { supabase } from "@/supabase";

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
    <nav className="site-navbar mb-4 flex items-center justify-between bg-white py-1 pl-2 pr-4 dark:bg-neutral-800 md:mb-8">
      <Link className="flex items-center text-2xl text-[#b39930] no-underline hover:text-[#897b2c] dark:text-neutral-200 dark:hover:text-neutral-200 [-webkit-tap-highlight-color:rgba(255,255,255,0)] [&_img]:h-12 [&_img]:w-12 md:[&_img]:h-16 md:[&_img]:w-16 [&_span]:mt-[3px] [&_span]:tracking-[0.5px]" href="/">
        <Image src={logo} alt="Oscar logo" width={38} height={40} />
        <span className="hidden md:inline">OSCARS DEATH RACE</span>
      </Link>
      <div className="flex items-center gap-4 [-webkit-tap-highlight-color:rgba(255,255,255,0)] md:gap-6 [&_svg]:mt-[3px] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:fill-[#b39930] [&_svg]:transition-colors [&_svg]:duration-200 hover:[&_svg]:fill-[#897b2c] dark:[&_svg]:fill-white dark:hover:[&_svg]:fill-neutral-300">
        {isAdmin && <Link className="text-sm text-[#b39930] transition-colors hover:text-[#897b2c] dark:text-neutral-200 dark:hover:text-neutral-300 md:text-base" href="/admin">Admin</Link>}
        <Link className="text-sm text-[#b39930] transition-colors hover:text-[#897b2c] dark:text-neutral-200 dark:hover:text-neutral-300 md:text-base" href="/all-time">All time</Link>
        <Link className="text-sm text-[#b39930] transition-colors hover:text-[#897b2c] dark:text-neutral-200 dark:hover:text-neutral-300 md:text-base" href="/statistics">Statistics</Link>
        {isSignedIn && (
          <Link className="relative text-sm text-[#b39930] transition-colors hover:text-[#897b2c] dark:text-neutral-200 dark:hover:text-neutral-300 md:text-base" href="/leaderboard#invitations" aria-label={`Leaderboard${invitationCount ? `, ${invitationCount} invitations` : ""}`}>
            Leaderboard
            {invitationCount > 0 && <span className="absolute right-[-12px] top-[-9px] inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-[5px] text-[11px] font-bold text-white">{invitationCount}</span>}
          </Link>
        )}
        {!isSignedIn && (
          <Link className="text-sm text-[#b39930] transition-colors hover:text-[#897b2c] dark:text-neutral-200 dark:hover:text-neutral-300 md:text-base" href="/login">
            Log in
          </Link>
        )}
        {!isSignedIn && (
          <Button size="sm" type="link" to="/signup" label="Sign up" />
        )}
        {isSignedIn && (
          <Link href="/settings" aria-label="Go to user settings">
            <AccountCircleIcon />
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
