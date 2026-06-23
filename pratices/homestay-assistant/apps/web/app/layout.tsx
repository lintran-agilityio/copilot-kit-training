import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Playfair_Display } from "next/font/google";

import { cn } from "@repo/utils";;
import { BookingProvider } from "@/features/booking/stores/booking-provider";
import CopilotKitProviders from "@/providers/copilot-provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

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
    <html
      lang="en"
      className={cn("dark font-sans", geist.variable, playfair.variable)}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#s] text-white antialiased`}
      >
        <ClerkProvider>
          <CopilotKitProviders>
            <BookingProvider>
              {children}
            </BookingProvider>
          </CopilotKitProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}
