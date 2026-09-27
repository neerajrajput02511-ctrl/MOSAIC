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
  title: "MOSAIC | Hybrid AI–NWP Forecast Blending System",
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
      <body className="min-h-full flex flex-col bg-[#07111F] text-[#F4F8FC]">
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="w-full border-t border-[#1E293B] bg-[#070D18] px-6 py-4 text-xs text-[#9DAFC4] flex flex-col md:flex-row items-center justify-between gap-3 select-none">
          <div className="text-left space-y-0.5">
            <div className="font-bold text-white tracking-wide text-xs font-mono">
              MOSAIC / WEATHERFUSION AI
            </div>
            <div className="text-[11px] text-[#667B94]">
              Hybrid AI–NWP Forecast Blending System · SIH26081 Meteorological Intelligence Platform
            </div>
          </div>
          <div className="text-right text-[11px] text-[#9DAFC4] space-y-0.5">
            <div>
              Data sources: <span className="text-[#00B8E6] font-medium font-mono">ECMWF IFS/AIFS, NOAA GFS, IMD/NCMRWF Guidance</span>
            </div>
            <div className="text-amber-400 font-medium">
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
