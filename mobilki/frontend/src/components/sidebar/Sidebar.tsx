"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Strona główna" },
    { href: "/budget", label: "Budżet" },
    { href: "/transactions", label: "Transakcje" },
    { href: "/statistics", label: "Statystyka" },
  ];

  return (
    <aside className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6">
      <nav className="flex flex-col gap-4">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "rounded px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
