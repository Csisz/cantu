import type { Metadata } from "next";
import { AppShell } from "@/components/cantu-app/AppShell";
import type { EntryMode } from "@/lib/recognition/types";

export const metadata: Metadata = {
  title: "Dal felismerése",
  description: "Hozz be egy olasz dalt hallgatással vagy helyi hangfájllal.",
};

type AppPageProps = {
  searchParams: Promise<{ mode?: string | string[] }>;
};

export default async function AppPage({ searchParams }: AppPageProps) {
  const params = await searchParams;
  const requestedMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const initialMode: EntryMode = requestedMode === "upload" ? "upload" : "listen";

  return <AppShell initialMode={initialMode} />;
}
