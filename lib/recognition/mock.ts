import type { RecognitionCandidate } from "./types";

export const MOCK_RECOGNITION_DELAY_MS = 850;

export const mockRecognitionCandidate: RecognitionCandidate = {
  title: "Sotto le stelle",
  artist: "Giulia Bianchi",
  album: "Luci d’estate",
  artworkUrl: "/assets/bg_italy.png",
};

export function createManualCandidate(title: string, artist: string): RecognitionCandidate {
  return {
    title: title.trim(),
    artist: artist.trim(),
    album: "Kézzel megadott találat",
    artworkUrl: "/assets/bg_italy.png",
  };
}
