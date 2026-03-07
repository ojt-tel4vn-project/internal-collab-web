import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"),
  applicationName: "CollabHub",
  title: {
    default: "CollabHub",
    template: "%s | CollabHub",
  },
  description:
    "Internal collaboration portal for employees, managers, and HR to manage leave, documents, notifications, and profile workflows.",
  keywords: ["internal collaboration", "employee portal", "leave management", "HR", "manager dashboard"],
  icons: {
    icon: "/Logo.webp",
    shortcut: "/Logo.webp",
    apple: "/Logo.webp",
  },
  openGraph: {
    type: "website",
    siteName: "CollabHub",
    title: "CollabHub",
    description:
      "Internal collaboration portal for employees, managers, and HR to manage leave, documents, notifications, and profile workflows.",
    images: ["/Logo.webp"],
  },
  twitter: {
    card: "summary",
    title: "CollabHub",
    description:
      "Internal collaboration portal for employees, managers, and HR to manage leave, documents, notifications, and profile workflows.",
    images: ["/Logo.webp"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
