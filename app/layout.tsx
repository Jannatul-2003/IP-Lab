import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "CSEDU Students' Club Portal",
  description:
    "Official portal of the CSEDU Students' Club, Department of Computer Science and Engineering, University of Dhaka.",
  keywords: ["CSEDU", "CSE", "University of Dhaka", "Students Club", "CSEDUSC"],
  authors: [{ name: "Team Innova-DU" }],
  openGraph: {
    title: "CSEDU Students' Club Portal",
    description: "Official portal of the CSEDU Students' Club, University of Dhaka.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased font-body" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
