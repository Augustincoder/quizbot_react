import type { GameMode, Question } from '@/types/game'

// Simple LRU cache for normalized questions
const questionCache = new Map<string, Question>()
const MAX_CACHE_SIZE = 50

type UnknownRecord = Record<string, any>

function isRecord(value: unknown): value is UnknownRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function firstString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v
  }
  return null
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const strings = value.filter((v) => typeof v === 'string') as string[]
  return strings.length ? strings : undefined
}

// Generate cache key from payload
function getCacheKey(rawPayload: unknown, mode: GameMode | null): string {
  if (isRecord(rawPayload) && typeof rawPayload.id === 'string') {
    return `${rawPayload.id}:${mode || 'unknown'}`
  }
  // Fallback to JSON stringify for complex payloads (limited to prevent huge keys)
  try {
    const str = JSON.stringify(rawPayload)
    return `${str.slice(0, 200)}:${mode || 'unknown'}`
  } catch {
    return `fallback:${Date.now()}`
  }
}

export function normalizeQuestion(
  rawPayload: unknown,
  mode: GameMode | null,
  ctx?: { questionNumber?: number }
): Question {
  // Check cache first
  const cacheKey = getCacheKey(rawPayload, mode)
  const cached = questionCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const result = normalizeQuestionImpl(rawPayload, mode, ctx)
  
  // Store in cache with LRU eviction
  if (questionCache.size >= MAX_CACHE_SIZE) {
    const firstKey = questionCache.keys().next().value
    if (firstKey !== undefined) {
      questionCache.delete(firstKey)
    }
  }
  questionCache.set(cacheKey, result)
  
  return result
}

function normalizeQuestionImpl(
  rawPayload: unknown,
  mode: GameMode | null,
  ctx?: { questionNumber?: number }
): Question {
  // Already-normalized payload (modern backend `game:question`)
  if (isRecord(rawPayload) && typeof rawPayload.text === 'string' && typeof rawPayload.id === 'string') {
    const q = rawPayload as UnknownRecord
    const options = asStringArray(q.options)
    if (mode === 'kahoot' && !options) {
      console.warn('[normalizeQuestion] Kahoot fast-path missing options — falling through to deep extraction')
      // Do NOT return here. Let it fall through to the deep extraction switch-case below.
    } else {
      return {
        id: q.id,
        text: q.text,
        category: firstString(q.category) ?? 'General',
        difficulty: (q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard')
          ? q.difficulty
          : 'medium',
        correctAnswer: firstString(q.correctAnswer, q.answer) ?? '',
        options,
        timeLimit: typeof q.timeLimit === 'number' ? q.timeLimit : (mode === 'zakovat' ? 60 : mode === 'kahoot' ? 20 : 15),
        points: typeof q.points === 'number' ? q.points : (typeof q.pointValue === 'number' ? q.pointValue : 1),
      }
    }
  }

  const root = isRecord(rawPayload) ? rawPayload : {}
  const qObj = isRecord(root.question) ? (root.question as UnknownRecord) : undefined

  // Mode-specific deep extraction for legacy/raw Supabase shapes.
  const extractedText =
    // Brain-Ring & Zakovat: flat object, data inside `question.question`
    firstString(
      (qObj && qObj.question),
      (qObj && isRecord(qObj.question) ? qObj.question.question : undefined),
      (root as any).question,
    ) ??
    // Kahoot: JSONB array, data inside `question.questions[0].question`
    firstString(
      qObj && Array.isArray(qObj.questions) ? qObj.questions?.[0]?.question : undefined,
      Array.isArray((root as any).questions) ? (root as any).questions?.[0]?.question : undefined,
    ) ??
    // Erudit: JSONB object, data inside `question.questions["10"].q`
    firstString(
      qObj && isRecord(qObj.questions) ? qObj.questions?.['10']?.q : undefined,
      isRecord((root as any).questions) ? (root as any).questions?.['10']?.q : undefined,
    ) ??
    // Fallbacks
    firstString((root as any).text, qObj?.text) ??
    ''

  const extractedCorrectAnswer =
    firstString(
      (root as any).correctAnswer,
      (root as any).answer,
      qObj?.correctAnswer,
      qObj?.answer,
      // legacy erudit nested answer
      qObj && isRecord(qObj.questions) ? qObj.questions?.['10']?.a : undefined
    ) ?? ''

  const extractedOptions =
    asStringArray((root as any).options) ??
    asStringArray(qObj?.options) ??
    asStringArray((root as any).answers) ??
    asStringArray(qObj?.answers)

  const questionNumber = ctx?.questionNumber ?? (typeof (root as any).questionNumber === 'number' ? (root as any).questionNumber : undefined)
  const fallbackId = typeof (root as any).id === 'string'
    ? (root as any).id
    : typeof qObj?.id === 'string'
      ? qObj.id
      : `q_${Math.max(0, (questionNumber ?? 1) - 1)}`

  const fallbackTimeLimit =
    typeof (root as any).timeLimit === 'number'
      ? (root as any).timeLimit
      : typeof qObj?.timeLimit === 'number'
        ? qObj.timeLimit
        : (mode === 'zakovat' ? 60 : mode === 'kahoot' ? 20 : 15)

  const fallbackPoints =
    typeof (root as any).points === 'number'
      ? (root as any).points
      : typeof qObj?.points === 'number'
        ? qObj.points
        : typeof (root as any).pointValue === 'number'
          ? (root as any).pointValue
          : 1

  return {
    id: fallbackId,
    text: extractedText,
    category: firstString((root as any).category, qObj?.category) ?? 'General',
    difficulty: 'medium',
    correctAnswer: extractedCorrectAnswer,
    options: mode === 'kahoot' ? extractedOptions : extractedOptions,
    timeLimit: fallbackTimeLimit,
    points: fallbackPoints,
  }
}

