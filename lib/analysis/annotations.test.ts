import { describe, expect, it } from "vitest";
import type { LearningAnalysisV2 } from "./schema";
import { positionSourceAnnotations, segmentAnnotatedSource } from "./annotations";

type Annotation = LearningAnalysisV2["annotations"][number];

function annotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: "a-1",
    sourceText: "Non vedo l'ora",
    category: "core",
    chunkIndex: 0,
    titleHu: "Kulcskifejezés",
    explanationHu: "Egyben érdemes megjegyezni.",
    ...overrides,
  };
}

describe("annotated source positioning", () => {
  it("anchors NFC/apostrophe/whitespace-equivalent exact source text", () => {
    const source = "Non   vedo l’ora di partire.";
    const [positioned] = positionSourceAnnotations(source, [annotation()]);
    expect(source.slice(positioned?.start, positioned?.end)).toBe("Non   vedo l’ora");
  });

  it("rejects missing source anchors instead of rendering a paraphrase", () => {
    expect(positionSourceAnnotations("Non vedo l'ora.", [annotation({ sourceText: "Alig várom" })]))
      .toEqual([]);
  });

  it("resolves overlap deterministically in favor of core, then source order", () => {
    const source = "Non vedo l'ora e domani parto.";
    const result = positionSourceAnnotations(source, [
      annotation({ id: "useful", sourceText: "vedo l'ora", category: "useful_phrase" }),
      annotation({ id: "core", category: "core" }),
      annotation({ id: "tomorrow", sourceText: "domani", category: "tone", chunkIndex: null }),
    ]);
    expect(result.map((item) => item.id)).toEqual(["core", "tomorrow"]);
  });

  it("segments the source without rebuilding it character by character", () => {
    const source = "Non vedo l'ora di partire.";
    const segments = segmentAnnotatedSource(source, [annotation()]);
    expect(segments.map((segment) => segment.text).join("")).toBe(source);
    expect(segments).toHaveLength(2);
  });
});
