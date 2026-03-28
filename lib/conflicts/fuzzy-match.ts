import Fuse from "fuse.js";

export const normalizePartyName = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export interface FuzzyCandidate<T = unknown> {
  id?: string;
  name: string;
  aliases?: string[];
  payload: T;
}

interface FuseDocument<T> {
  value: string;
  aliases: string[];
  candidate: FuzzyCandidate<T>;
}

export interface FuzzyMatchResult<T = unknown> {
  candidate: FuzzyCandidate<T>;
  score: number;
  confidence: number;
}

const defaultOptions: Fuse.IFuseOptions<FuseDocument<any>> = {
  includeScore: true,
  threshold: 0.35,
  distance: 120,
  keys: ["value", "aliases"],
  ignoreLocation: true,
};

export const createFuzzyMatcher = <T>(candidates: FuzzyCandidate<T>[], options?: Partial<Fuse.IFuseOptions<FuseDocument<T>>>) => {
  const documents: FuseDocument<T>[] = candidates.map((candidate) => ({
    value: normalizePartyName(candidate.name),
    aliases: (candidate.aliases ?? []).map(normalizePartyName).filter(Boolean),
    candidate,
  }));

  const fuse = new Fuse(documents, { ...defaultOptions, ...options });

  const search = (needle: string, opts?: { limit?: number; minConfidence?: number }) => {
    const term = normalizePartyName(needle);
    if (!term) {
      return [] as FuzzyMatchResult<T>[];
    }
    const limit = opts?.limit ?? 10;
    const minConfidence = opts?.minConfidence ?? 0.55;

    return fuse
      .search(term, { limit })
      .map((result) => ({
        candidate: result.item.candidate,
        score: result.score ?? 0,
        confidence: 1 - Math.min(result.score ?? 1, 1),
      }))
      .filter((match) => match.confidence >= minConfidence);
  };

  return { search };
};
