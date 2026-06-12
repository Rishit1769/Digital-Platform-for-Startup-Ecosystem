import type { Metadata } from "next";
import { Playfair_Display, Space_Grotesk, Source_Serif_4, Bebas_Neue } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair-import",
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-import",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif-import",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-import",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ECOSYSTEM — Digital Platform for Startup Ecosystem",
  description: "The definitive platform for founders, mentors, and the next generation of startups. Pitch with precision. Track with discipline. Build with intent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${spaceGrotesk.variable} ${sourceSerif.variable} ${bebasNeue.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#FFFFFF] text-[#1C1C1C]">
        {children}
      </body>
    </html>
  );
}
