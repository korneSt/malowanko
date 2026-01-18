import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-0.5 text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
    >
      <span className="text-primary">Malo</span>
      <span className="text-secondary">wanko</span>
    </Link>
  );
}

