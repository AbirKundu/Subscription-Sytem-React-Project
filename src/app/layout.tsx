import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Subscription Package",
  description: "Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["Subscription", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Full Stack", "React"],
  authors: [{ name: "Abir Kundu" }],
  openGraph: {
    title: "Subscription Package",
    description: "Modern React stack",
    url: "https://github.com/AbirKundu",
    
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Subscription Package",
    description: "Modern React stack",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
