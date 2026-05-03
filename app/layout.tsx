import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "EcoOracle — Autonomous Carbon Integrity Network",
  description:
    "Dynamic NFT carbon credits, continuously verified by AI satellite analysis and on-chain oracles. Real forests. Real time. Real proof.",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-white antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-x-0 -top-32 h-[420px] bg-radial-eco" />
          <div className="absolute inset-0 bg-grid-eco opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)]" />
          <div className="absolute inset-0 bg-noise" />
        </div>
        <NavBar />
        <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
