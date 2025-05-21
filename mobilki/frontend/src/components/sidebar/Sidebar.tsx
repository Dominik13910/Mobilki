"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Strona główna" },
    { href: "/budget", label: "Budżet" },
    { href: "/transactions", label: "Transakcje" },
    { href: "/statistics", label: "Statystyka" },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white dark:bg-gray-800 p-2 rounded shadow"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={clsx(
          "fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 transition-transform z-40",
          "transform md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="flex flex-col gap-4">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
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
    </>
  );
}
