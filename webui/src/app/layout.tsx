import type { Metadata } from "next";
import { IBM_Plex_Mono as IBMPlexMono, IBM_Plex_Sans as IBMPlexSans, IBM_Plex_Serif as IBMPlexSerif } from 'next/font/google';

import "./globals.css";

const ibmPlexMono = IBMPlexMono({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-mono',
});
const ibmPlexSans = IBMPlexSans({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
});
const ibmPlexSerif = IBMPlexSerif({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-serif',
});

export const metadata: Metadata = {
  title: "Calculator App",
  description: "A project by Dimitri Prosper",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="text-zinc-950 antialiased lg:bg-ibm-light dark:bg-zinc-900 dark:text-white dark:lg:bg-zinc-950"
    >
      <body
        className={`font-sans ${ibmPlexMono.variable} ${ibmPlexSans.variable} ${ibmPlexSerif.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
