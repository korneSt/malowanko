import type { User } from "@supabase/supabase-js";
import type { ReactNode, ComponentType } from "react";

/** Props dla MainLayout */
export interface MainLayoutProps {
  children: ReactNode;
  /** Zalogowany użytkownik lub null */
  user: User | null;
  /** Maksymalna szerokość karty treści */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

/** Props dla Header */
export interface HeaderProps {
  /** Użytkownik z Supabase Auth lub null dla niezalogowanych */
  user: User | null;
}

/** Props dla BottomNav */
export interface BottomNavProps {
  /** Aktualna ścieżka URL do podświetlenia aktywnego linku */
  activeRoute: string;
}

/** Props dla ProfileDropdown */
export interface ProfileDropdownProps {
  /** Zalogowany użytkownik */
  user: User;
}

/** Props dla NavLink */
export interface NavLinkProps {
  /** Docelowa ścieżka */
  href: string;
  /** Treść linku (tekst lub elementy) */
  children: ReactNode;
  /** Opcjonalna ikona (dla BottomNav) */
  icon?: ReactNode;
  /** Czy link jest aktywny */
  isActive?: boolean;
  /** Dodatkowe klasy CSS */
  className?: string;
}

/** Konfiguracja elementu nawigacji */
export interface NavItem {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  /** Czy wymaga zalogowania */
  requiresAuth?: boolean;
  /** Czy widoczne tylko dla niezalogowanych */
  guestOnly?: boolean;
}

