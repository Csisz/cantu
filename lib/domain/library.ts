export type LibrarySongRow = {
  songId: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  savedAt: string;
  stage: string | null;
  percentComplete: number | null;
  lastOpenedAt: string | null;
};

export type LibraryItem = {
  songId: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  savedAt: string;
  progress: {
    stage: string;
    percentComplete: number;
    lastOpenedAt: string | null;
  };
};

export function toLibraryItems(rows: LibrarySongRow[]): LibraryItem[] {
  return rows.map((row) => ({
    songId: row.songId,
    title: row.title,
    artist: row.artist,
    artworkUrl: row.artworkUrl,
    savedAt: row.savedAt,
    progress: {
      stage: row.stage ?? "new",
      percentComplete: Math.min(100, Math.max(0, row.percentComplete ?? 0)),
      lastOpenedAt: row.lastOpenedAt,
    },
  }));
}
