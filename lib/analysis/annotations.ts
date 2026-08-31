import type { LearningAnalysisV2 } from "./schema";

export type SourceAnnotation = LearningAnalysisV2["annotations"][number];

export type PositionedSourceAnnotation = SourceAnnotation & {
  start: number;
  end: number;
};

export type AnnotatedSourceSegment =
  | { kind: "text"; text: string }
  | { kind: "annotation"; text: string; annotation: PositionedSourceAnnotation };

const categoryPriority: Record<SourceAnnotation["category"], number> = {
  core: 0,
  useful_phrase: 1,
  grammar: 2,
  pronunciation: 3,
  tone: 4,
};

function canonicalText(value: string) {
  return value
    .normalize("NFC")
    .replace(/[\u2018\u2019`\u00b4]/gu, "'")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("it-IT");
}

function canonicalSourceWithMap(source: string) {
  const segmenter = new Intl.Segmenter("it", { granularity: "grapheme" });
  let canonical = "";
  const starts: number[] = [];
  const ends: number[] = [];

  for (const part of segmenter.segment(source)) {
    const raw = part.segment;
    const start = part.index;
    const end = start + raw.length;
    if (/^\s+$/u.test(raw)) {
      if (canonical.endsWith(" ")) {
        ends[ends.length - 1] = end;
      } else {
        canonical += " ";
        starts.push(start);
        ends.push(end);
      }
      continue;
    }
    const normalized = raw
      .normalize("NFC")
      .replace(/[\u2018\u2019`\u00b4]/gu, "'")
      .toLocaleLowerCase("it-IT");
    canonical += normalized;
    for (let index = 0; index < normalized.length; index += 1) {
      starts.push(start);
      ends.push(end);
    }
  }
  return { canonical, starts, ends };
}

function candidateRanges(source: string, sourceText: string) {
  const mapped = canonicalSourceWithMap(source);
  const needle = canonicalText(sourceText);
  if (!needle) return [];
  const ranges: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  while (cursor <= mapped.canonical.length - needle.length) {
    const index = mapped.canonical.indexOf(needle, cursor);
    if (index < 0) break;
    const start = mapped.starts[index];
    const end = mapped.ends[index + needle.length - 1];
    if (start !== undefined && end !== undefined) ranges.push({ start, end });
    cursor = index + Math.max(1, needle.length);
  }
  return ranges;
}

function overlaps(range: { start: number; end: number }, accepted: PositionedSourceAnnotation[]) {
  return accepted.some((item) => range.start < item.end && range.end > item.start);
}

export function positionSourceAnnotations(
  source: string,
  annotations: readonly SourceAnnotation[],
): PositionedSourceAnnotation[] {
  const accepted: PositionedSourceAnnotation[] = [];
  const ordered = [...annotations].sort((left, right) =>
    categoryPriority[left.category] - categoryPriority[right.category]
    || right.sourceText.length - left.sourceText.length
    || left.id.localeCompare(right.id),
  );

  for (const annotation of ordered) {
    const range = candidateRanges(source, annotation.sourceText)
      .find((candidate) => !overlaps(candidate, accepted));
    if (range) accepted.push({ ...annotation, ...range });
  }

  return accepted.sort((left, right) => left.start - right.start || left.end - right.end);
}

export function segmentAnnotatedSource(
  source: string,
  annotations: readonly SourceAnnotation[],
): AnnotatedSourceSegment[] {
  const positioned = positionSourceAnnotations(source, annotations);
  const segments: AnnotatedSourceSegment[] = [];
  let cursor = 0;
  for (const annotation of positioned) {
    if (annotation.start > cursor) segments.push({ kind: "text", text: source.slice(cursor, annotation.start) });
    segments.push({
      kind: "annotation",
      text: source.slice(annotation.start, annotation.end),
      annotation,
    });
    cursor = annotation.end;
  }
  if (cursor < source.length) segments.push({ kind: "text", text: source.slice(cursor) });
  return segments;
}
