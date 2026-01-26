"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Palette, ImageIcon, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";
import { ProfileDropdown } from "./ProfileDropdown";
import type { HeaderProps, NavItem } from "./types";

const navItems: NavItem[] = [
  {
    href: "/generator",
    label: "Generator",
    icon: Palette,
    requiresAuth: true,
  },
  {
    href: "/biblioteka",
    label: "Moja biblioteka",
    icon: BookOpen,
    requiresAuth: true,
  },
  {
    href: "/galeria",
    label: "Galeria",
    icon: ImageIcon,
  },
];

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  const visibleNavItems = navItems.filter((item) => {
    if (item.requiresAuth && !user) return false;
    if (item.guestOnly && user) return false;
    return true;
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-1 md:flex"
          role="navigation"
          aria-label="Główna nawigacja"
        >
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              isActive={
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-2">
          {user ? (
            <ProfileDropdown user={user} />
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" >
                <Link href="/auth?mode=signin">Zaloguj się</Link>
              </Button>
              <Button >
                <Link href="/auth?mode=signup">Zarejestruj się</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
