import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Slotora — Schedule real-world groups effortlessly",
  description: "Meet real people. Plan real moments. Polls, sign-ups, and reminders — all in one link. Built for sports clubs, schools, PTAs and community organisers.",
  icons: {
    icon: "/ora-superhero.png",
  },
  openGraph: {
    title: "Slotora — Schedule real-world groups effortlessly",
    description: "Meet real people. Plan real moments.",
    url: "https://slotora.vercel.app",
    siteName: "Slotora",
    images: [
      {
        url: "https://slotora.vercel.app/ora-superhero.png",
        width: 1200,
        height: 630,
        alt: "Ora — Slotora mascot",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Slotora — Schedule real-world groups effortlessly",
    description: "Meet real people. Plan real moments.",
    images: ["https://slotora.vercel.app/ora-superhero.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}