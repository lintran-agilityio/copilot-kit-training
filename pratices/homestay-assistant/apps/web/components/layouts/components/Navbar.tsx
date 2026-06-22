"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

import { cn } from "@/utils";

import { Logo } from "../../common/Logo";

type NavbarProps = {
  activeTab?: "book" | "bookings";
  className?: string;
};

export function Navbar({ activeTab = "book", className }: NavbarProps) {
  const { user } = useUser();
  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : (user?.firstName?.[0] ?? "AL");

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
            activeTab === "book"
              ? "text-white"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          Book a Room
        </Link>
        <Link
          href="#"
          className={cn(
            "text-sm transition-colors",
            activeTab === "bookings"
              ? "text-white"
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
