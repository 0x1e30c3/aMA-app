import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Web3Provider } from "@/providers/web3-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "aMA",
  description:
    "Yield-bearing operating budget for AI agents, powered by stETH",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Web3Provider>
          {children}
          <Toaster position="bottom-right" />
        </Web3Provider>
      </body>
    </html>
  );
}
