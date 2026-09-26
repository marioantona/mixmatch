import type { Metadata, Viewport } from "next";
import { Anybody, Figtree } from "next/font/google";
import { ProfileProvider } from "@/hooks/useProfile";
import { ProfileGate } from "@/components/ui/ProfileGate";
import { BottomNav } from "@/components/ui/BottomNav";
import "./globals.css";

const anybody = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-anybody" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata: Metadata = {
  title: "MixMatch",
  description: "Decide where to go out tonight, together.",
  // Opens full screen from the iOS home screen; "black" keeps content below the status bar.
  appleWebApp: { capable: true, title: "MixMatch", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16142E",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${anybody.variable} ${figtree.variable} antialiased`}>
      <body className="min-h-dvh bg-night text-foam">
        <ProfileProvider>
          <ProfileGate>
            {/* Bottom padding clears the fixed nav (4rem) + iOS home indicator. */}
            <main className="mx-auto min-h-dvh max-w-md pb-[calc(4rem+env(safe-area-inset-bottom))]">{children}</main>
            <BottomNav />
          </ProfileGate>
        </ProfileProvider>
      </body>
    </html>
  );
}
