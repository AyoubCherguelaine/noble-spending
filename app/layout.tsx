import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const space = Space_Grotesk({ variable: "--font-space", subsets: ["latin"], weight: ["400","500","600","700"] });
const ibm = IBM_Plex_Mono({ variable: "--font-ibm", subsets: ["latin"], weight: ["400","500","600"] });
const news = Newsreader({ variable: "--font-news", subsets: ["latin"], weight: ["400","600"] });

export const metadata: Metadata = {
  title: "Moneyflow",
  description: "Personal money flow dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${space.variable} ${ibm.variable} ${news.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
