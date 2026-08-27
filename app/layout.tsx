import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Cantu — Értsd meg az olaszt, amivel találkozol",
      template: "%s — Cantu",
    },
    description:
      "Hozz egy rövid olasz hangrészletet vagy szöveget, ellenőrizd a forrást, majd alakítsd tanulási pillanattá.",
    applicationName: "Cantu",
    openGraph: {
      title: "Cantu — Értsd meg az olaszt, amivel találkozol",
      description: "Hallgasd. Olvasd. Értsd meg. Mondd ki.",
      type: "website",
      locale: "hu_HU",
      siteName: "Cantu",
      images: [{ url: `${origin}/og-byoc.png`, width: 1731, height: 909, alt: "Cantu — valódi olasz, érthetően" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Cantu — Értsd meg az olaszt, amivel találkozol",
      description: "Hallgasd. Olvasd. Értsd meg. Mondd ki.",
      images: [`${origin}/og-byoc.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hu" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>{children}</body>
    </html>
  );
}
