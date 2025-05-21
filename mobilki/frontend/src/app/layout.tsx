import "./globals.css";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/components/layout/Layout";
import ServiceWorkerRegistration from "@/components/service-worker-registration/ServiceWorkerRegistration";

export const metadata = {
  title: "Budżetify",
  manifest: "/manifest.json",
  description: "Aplikacja do zarządzania budżetem",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ServiceWorkerRegistration />
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  );
}
