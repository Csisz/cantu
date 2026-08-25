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
      default: "Cantu — Tanulj olaszul dalokból",
      template: "%s — Cantu",
    },
    description:
      "Hallgass vagy tölts fel egy olasz dalt, erősítsd meg a találatot, és készülj a zenés nyelvtanulásra.",
    applicationName: "Cantu",
    openGraph: {
      title: "Cantu — Tanulj olaszul a kedvenc dalaidból",
      description: "Hallgasd. Ismerd fel. Értsd meg. Tanuld meg.",
      type: "website",
      locale: "hu_HU",
      siteName: "Cantu",
      images: [{ url: `${origin}/og.png`, width: 1731, height: 909, alt: "Cantu — zenés olasztanulás" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Cantu — Tanulj olaszul dalokból",
      description: "Hallgasd. Ismerd fel. Értsd meg. Tanuld meg.",
      images: [`${origin}/og.png`],
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
