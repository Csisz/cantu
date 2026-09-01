"use client";

import type { ReviewSubmission, ReviewSubmissionResponse } from "./types";

export async function persistReviewSubmission(input: ReviewSubmission): Promise<ReviewSubmissionResponse> {
  try {
    const response = await fetch("/api/learning/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return await response.json() as ReviewSubmissionResponse;
  } catch {
    return { status: "error", message: "Az ismétlést most nem sikerült menteni. Próbáld újra." };
  }
}

export async function deleteSavedPhrase(phraseId: string) {
  try {
    const response = await fetch("/api/learning/phrase", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phraseId }),
    });
    return await response.json() as { status: "success" | "error" | "unauthenticated"; message: string };
  } catch {
    return { status: "error" as const, message: "A kifejezést most nem sikerült törölni." };
  }
}
