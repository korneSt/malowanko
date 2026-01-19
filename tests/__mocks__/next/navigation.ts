/**
 * Mock for Next.js navigation
 * Used in unit tests to mock useRouter, usePathname, etc.
 */
import { vi } from 'vitest';

export const useRouter = () => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
});

export const usePathname = () => '/';

export const useSearchParams = () => new URLSearchParams();
