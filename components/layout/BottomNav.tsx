"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Palette, ImageIcon, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: BottomNavItem[] = [
  {
    href: "/generator",
    label: "Generator",
    icon: Palette,
  },
  {
    href: "/biblioteka",
    label: "Biblioteka",
    icon: BookOpen,
  },
  {
    href: "/galeria",
    label: "Galeria",
    icon: ImageIcon,
  },
  {
    href: "/profil",
    label: "Profil",
    icon: User,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden"
      role="navigation"
      aria-label="Nawigacja mobilna"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

