const PUNCT = /[^\p{L}\p{N}\s]/gu

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(PUNCT, " ")
    .split(/\s+/)
    .filter(Boolean)
}

export type IndexedDoc = {
  id: string
  tokens: string[]
}

export function buildIndex(
  docs: Array<{ id: string; question: string; answer: string; keywords?: string[] }>
) {
  const indexed: IndexedDoc[] = docs.map((d) => ({
    id: d.id,
    tokens: [
      ...tokenize(d.question),
      ...tokenize(d.answer),
      ...(d.keywords?.flatMap((k) => tokenize(k)) ?? []),
    ],
  }))

  // IDF
  const df = new Map<string, number>()
  indexed.forEach((doc) => {
    new Set(doc.tokens).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1))
  })
  const N = indexed.length
  const idf = new Map<string, number>()
  df.forEach((count, term) => {
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1)
  })

  return { indexed, idf }
}

export function scoreQuery(
  query: string,
  index: ReturnType<typeof buildIndex>
) {
  const qTokens = tokenize(query)
  const qSet = new Set(qTokens)
  const { indexed, idf } = index

  return indexed
    .map((doc) => {
      // simple overlap with IDF weighting
      let score = 0
      const dSet = new Set(doc.tokens)
      qSet.forEach((t) => {
        if (dSet.has(t)) score += idf.get(t) ?? 0
      })
      // small boost for exact phrase matches in doc tokens joined
      const joined = doc.tokens.join(" ")
      if (query.trim().length > 0 && joined.includes(query.toLowerCase().trim())) {
        score *= 1.15
      }
      return { id: doc.id, score }
    })
    .sort((a, b) => b.score - a.score)
}

export function topMatches(
  query: string,
  index: ReturnType<typeof buildIndex>,
  k = 3,
  minScore = 1
) {
  const ranked = scoreQuery(query, index)
  const top = ranked.filter((r) => r.score >= minScore).slice(0, k)
  return top
}
