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
      <body className="min-h-full flex flex-col bg-[#060a12] text-slate-100">
        <div className="flex-1">{children}</div>
        <footer className="w-full border-t border-[#1e2c47] bg-[#070c18] px-6 py-4 text-xs text-slate-400 font-mono flex flex-col md:flex-row items-center justify-between gap-3 shadow-inner">
          <div className="text-left space-y-0.5">
            <div className="font-bold text-slate-200 tracking-wide text-xs">
              MOSAIC / WEATHERFUSION AI
            </div>
            <div className="text-[11px] text-slate-400">
              Hybrid AI–NWP Forecast Blending System · Developed for SIH26081
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-400 space-y-0.5">
            <div>
              Data sources: <span className="text-slate-300">ECMWF, NOAA, IMD, ISRO/MOSDAC where applicable</span>
            </div>
            <div className="text-amber-400/90 font-medium">
              Forecasts are model guidance and should not replace official warnings.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
