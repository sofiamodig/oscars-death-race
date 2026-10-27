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
    <nav className="mb-sm flex items-center justify-between bg-neutral-0 py-1 pl-2 pr-4 md:mb-lg">
      <Link className="flex items-center text-2xl text-primary-500 no-underline hover:text-primary-500 [-webkit-tap-highlight-color:rgba(255,255,255,0)] [&_img]:h-12 [&_img]:w-12 md:[&_img]:h-16 md:[&_img]:w-16 [&_span]:mt-[3px] [&_span]:tracking-[0.5px]" href="/">
        <Image src={logo} alt="Oscar logo" width={38} height={40} />
        <span className="hidden md:inline">OSCARS DEATH RACE</span>
      </Link>
      <div className="flex items-center gap-sm [-webkit-tap-highlight-color:rgba(255,255,255,0)] md:gap-md [&_svg]:mt-[3px] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:fill-primary-500 [&_svg]:transition-colors [&_svg]:duration-200 hover:[&_svg]:fill-primary-700">
        {isAdmin && <Link className="text-sm text-primary-500 transition-colors hover:text-primary-700 md:text-base" href="/admin">Admin</Link>}
        <Link className="text-sm text-primary-500 transition-colors hover:text-primary-700 md:text-base" href="/all-time">All time</Link>
        <Link className="text-sm text-primary-500 transition-colors hover:text-primary-700 md:text-base" href="/statistics">Statistics</Link>
        {isSignedIn && (
          <Link className="relative text-sm text-primary-500 transition-colors hover:text-primary-700 md:text-base" href="/leaderboard#invitations" aria-label={`Leaderboard${invitationCount ? `, ${invitationCount} invitations` : ""}`}>
            Leaderboard
            {invitationCount > 0 && <span className="absolute right-[-12px] top-[-9px] inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ui-red px-[5px] text-[11px] font-bold text-white">{invitationCount}</span>}
          </Link>
        )}
        {!isSignedIn && (
          <Link className="text-sm text-primary-500 transition-colors hover:text-primary-700 md:text-base" href="/login">
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
