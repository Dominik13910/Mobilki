// components/layout/Layout.tsx
"use client";

import { Navbar } from "@/components/navbar/Navbar";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
