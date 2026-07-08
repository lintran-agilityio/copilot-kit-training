import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

import { cn } from "@repo/utils";
import { AppErrorBoundary } from "@/providers/app-error-boundary";
import CopilotKitProviders from "@/providers/copilot-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "HOMESTAY — Room Booking",
  description: "Find and book workspace rooms with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          "font-sans antialiased",
          // geistSans.variable,
          // geistMono.variable,
          geistSans.variable,
          geistMono.variable,
        )}
        suppressHydrationWarning
      >
        <AppErrorBoundary>
          <ClerkProvider>
            <CopilotKitProviders>{children}</CopilotKitProviders>
          </ClerkProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
