"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavLinkProps } from "./types";

export function NavLink({
  href,
  children,
  icon,
  isActive,
  className,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        className
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

