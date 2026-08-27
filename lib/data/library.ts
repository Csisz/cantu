import "server-only";

import type { AuthContext } from "@/lib/auth/types";
import { isE2EAuthMockEnabled } from "@/lib/env/server";
import { toLibraryItems, type LibraryItem, type LibrarySongRow } from "@/lib/domain/library";
import { createClient } from "@/lib/supabase/server";

export type LibrarySnapshot =
  | { status: "unavailable"; items: [] }
  | { status: "ready"; items: LibraryItem[] }
  | { status: "error"; items: []; message: string };

export async function getLibrarySnapshot(auth: AuthContext): Promise<LibrarySnapshot> {
  if (auth.status !== "authenticated") return { status: "unavailable", items: [] };
  if (isE2EAuthMockEnabled()) return { status: "ready", items: [] };

  const supabase = await createClient();
  const [libraryResult, progressResult] = await Promise.all([
    supabase
      .from("user_songs")
      .select("song_id, saved_at, songs (title, artist, artwork_url)")
      .order("saved_at", { ascending: false }),
    supabase
      .from("user_song_progress")
      .select("song_id, stage, percent_complete, last_opened_at"),
  ]);

  if (libraryResult.error || progressResult.error) {
    const error = libraryResult.error ?? progressResult.error;
    console.error("Cantu library query failed", { code: error?.code });
    return {
      status: "error",
      items: [],
      message: "A saját tanulások most nem tölthetők be. Próbáld meg később.",
    };
  }

  const progressBySong = new Map(
    (progressResult.data ?? []).map((row) => [row.song_id, row]),
  );

  const rows: LibrarySongRow[] = (libraryResult.data ?? []).flatMap((row) => {
    const song = row.songs;
    if (!song) return [];
    const progress = progressBySong.get(row.song_id);
    return [
      {
        songId: row.song_id,
        title: song.title,
        artist: song.artist,
        artworkUrl: song.artwork_url,
        savedAt: row.saved_at,
        stage: progress?.stage ?? null,
        percentComplete: progress?.percent_complete ?? null,
        lastOpenedAt: progress?.last_opened_at ?? null,
      },
    ];
  });

  return { status: "ready", items: toLibraryItems(rows) };
}
