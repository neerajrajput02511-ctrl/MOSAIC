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
  title: "WEATHERFUSION AI | Hybrid AI–NWP Forecast Blending Platform",
  description: "Operational meteorological decision-support system dynamically combining NOAA GFS, ECMWF IFS, and ECMWF AIFS with quantified uncertainty (SIH26081).",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F7FA] text-[#0F172A]">
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="w-full border-t border-[#D9E0E7] bg-[#FFFFFF] px-6 py-4 text-xs text-[#64748B] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-left space-y-0.5">
            <div className="font-semibold text-[#0B1F33] tracking-wide text-xs">
              MOSAIC / WEATHERFUSION AI
            </div>
            <div className="text-[11px] text-[#64748B]">
              Hybrid AI–NWP Forecast Blending System · SIH26081 Meteorological Intelligence Platform
            </div>
          </div>
          <div className="text-right text-[11px] text-[#64748B] space-y-0.5">
            <div>
              Data sources: <span className="text-[#0F172A] font-medium">ECMWF IFS/AIFS, NOAA GFS, IMD/NCMRWF Guidance</span>
            </div>
            <div className="text-[#D97706] font-medium">
              Forecasts are multi-model guidance and should not replace official meteorological agency warnings.
            </div>
          </div>
        </footer>
        {/* Dedicated Top-Level Portal Root for Copilot and Application Modals */}
        <div id="copilot-modal-root" />
      </body>
    </html>
  );
}
