import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Flat Finder | Your next flat in Berlin",
  description: "Visual filters and instant Telegram alerts for Berlin real estate.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 antialiased`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
