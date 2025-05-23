"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode, useState, useEffect } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {mounted ? children : null}
    </NextThemesProvider>
  );
}
