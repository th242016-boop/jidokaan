import { useEffect, useState, type ReactNode } from "react";

/** Avoid SSR for WebGL / R3F trees. */
export function ClientOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
