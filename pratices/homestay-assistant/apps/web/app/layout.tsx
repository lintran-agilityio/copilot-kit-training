import type { Metadata } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

import { cn } from "@repo/utils";
import { AppErrorBoundary } from "@/providers/app-error-boundary";
import CopilotKitProviders from "@/providers/copilot-provider";

const geistSans = localFont({
  src: "../public/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "../public/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

// Elegant serif for headings and the SPACES wordmark.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
          cormorant.variable,
        )}
        suppressHydrationWarning
      >
        <AppErrorBoundary>
          <ClerkProvider
            appearance={{
              options: {
                unsafe_disableDevelopmentModeWarnings: true,
              },
              elements: {
                // Hides "Secured by Clerk" branding in the UserButton popover
                // (dev workaround; production removal requires a paid Clerk
                // plan via Dashboard → Branding).
                userButtonPopoverFooter: {
                  display: "none",
                },
              },
            }}
          >
            <CopilotKitProviders>{children}</CopilotKitProviders>
          </ClerkProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
