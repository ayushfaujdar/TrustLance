import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import GoogleAuthProviderWrapper from "@/components/GoogleAuthProviderWrapper";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "TrustLance — Secure Freelance Escrow Platform",
  description:
    "The escrow platform freelancers and clients can actually trust. Watermarked previews, secure payments, and fair dispute resolution.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body bg-paper text-ink antialiased">
        <GoogleAuthProviderWrapper>
          {children}
          <Toaster
            position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0D0D0D",
              color: "#FAFAF7",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "var(--font-body)",
            },
          }}
        />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        </GoogleAuthProviderWrapper>
      </body>
    </html>
  );
}
