"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

import { cn } from "@repo/utils";
import { NavbarTab } from "@repo/types";
import { ROUTES } from "@/constants";
import { Logo } from "../common";
import { Loading } from "@repo/components";

type NavbarProps = {
  activeTab?: NavbarTab.HOME | NavbarTab.MY_BOOKINGS;
  className?: string;
};

export const Navbar = ({ activeTab = NavbarTab.HOME, className }: NavbarProps) => {
  const { isLoaded, user } = useUser();
  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : (user?.firstName?.[0] ?? "AL");

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <header
      className={cn(
        "flex items-center justify-between border-b border-white/10 p-4",
        className,
      )}
    >
      <Logo />

      <nav className="flex items-center gap-8">
        <Link
          href="/"
          className={cn(
            "text-sm transition-colors",
              activeTab === NavbarTab.HOME
              ? "text-white bg-emerald-500 rounded-md px-4 py-2"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          HomeStay
        </Link>
        <Link
          href={ROUTES.BOOKINGS}
          className={cn(
            "text-sm transition-colors",
            activeTab === NavbarTab.MY_BOOKINGS
              ? "text-white bg-emerald-500 rounded-md px-4 py-2"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          My Bookings
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-white lg:hidden">
            {initials.toUpperCase()}
          </div>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-9",
              },
            }}
          />
        </div>
      </nav>
    </header>
  );
}
