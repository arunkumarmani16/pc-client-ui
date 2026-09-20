import "server-only"

import type { Language } from "@/lib/translation/languages"

/**
 * Machine translation through AI4Bharat's IndicTrans2, as Bhashini hosts it.
 *
 * <p>Bhashini is a two-step API. A pipeline-config call, made with the ULCA
 * user id and key, answers with the inference endpoint, the key to call it
 * with, and the `serviceId` of the model that serves the language pair. Every
 * translation then goes to that endpoint. The first answer is kept per
 * language pair and only asked for again when the inference key is refused.
 *
 * <p>Server-only: the credentials never reach the browser, and neither does
 * the endpoint.
 */

const PIPELINE_CONFIG_URL =
  "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"

/** MeitY's pipeline, which serves AI4Bharat's models. */
const DEFAULT_PIPELINE_ID = "64392f96daac500b55c543cd"

/** Sentences per inference call. Small enough that one slow call is not a whole month. */
const BATCH_SIZE = 25

const TIMEOUT_MS = 20_000

type Endpoint = {
  callbackUrl: string
  authName: string
  authValue: string
  serviceId: string
}

type PipelineConfigResponse = {
  pipelineResponseConfig?: {
    taskType: string
    config?: { serviceId: string; language?: { sourceLanguage?: string; targetLanguage?: string } }[]
  }[]
  pipelineInferenceAPIEndPoint?: {
    callbackUrl: string
    inferenceApiKey: { name: string; value: string }
  }
}

type ComputeResponse = {
  pipelineResponse?: { taskType: string; output?: { source: string; target: string }[] }[]
}

export class TranslationError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message)
    this.name = "TranslationError"
  }
}

/**
 * Whether translation can be attempted at all. Off unless both Bhashini
 * credentials are set, so a fresh checkout reads guidance in English instead
 * of failing on every page.
 */
export function isTranslationConfigured(): boolean {
  return (
    process.env.TRANSLATION_ENABLED !== "false" &&
    Boolean(process.env.BHASHINI_USER_ID) &&
    Boolean(process.env.BHASHINI_ULCA_API_KEY)
  )
}

const endpoints = new Map<string, Promise<Endpoint>>()

function endpointFor(source: Language, target: Language): Promise<Endpoint> {
  const key = `${source}-${target}`
  let endpoint = endpoints.get(key)
  if (!endpoint) {
    endpoint = fetchEndpoint(source, target)
    // A failed lookup is not remembered, so the next page tries again.
    endpoint.catch(() => endpoints.delete(key))
    endpoints.set(key, endpoint)
  }
  return endpoint
}

async function fetchEndpoint(source: Language, target: Language): Promise<Endpoint> {
  const response = await fetch(PIPELINE_CONFIG_URL, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      userID: process.env.BHASHINI_USER_ID ?? "",
      ulcaApiKey: process.env.BHASHINI_ULCA_API_KEY ?? "",
    },
    body: JSON.stringify({
      pipelineTasks: [
        {
          taskType: "translation",
          config: { language: { sourceLanguage: source, targetLanguage: target } },
        },
      ],
      pipelineRequestConfig: {
        pipelineId: process.env.BHASHINI_PIPELINE_ID || DEFAULT_PIPELINE_ID,
      },
    }),
  })

  if (!response.ok) {
    throw new TranslationError(`Bhashini pipeline config failed with ${response.status}`, response.status)
  }

  const data = (await response.json()) as PipelineConfigResponse
  const inference = data.pipelineInferenceAPIEndPoint
  const models = data.pipelineResponseConfig?.find((task) => task.taskType === "translation")?.config ?? []

  // Prefer IndicTrans2 by name when the pipeline offers more than one model
  // for the pair; otherwise take what it lists first.
  const model = models.find((entry) => entry.serviceId.includes("indictrans-v2")) ?? models[0]

  if (!inference?.callbackUrl || !inference.inferenceApiKey?.value || !model) {
    throw new TranslationError(`Bhashini offers no translation model for ${source} → ${target}`)
  }

  return {
    callbackUrl: inference.callbackUrl,
    authName: inference.inferenceApiKey.name || "Authorization",
    authValue: inference.inferenceApiKey.value,
    serviceId: model.serviceId,
  }
}

async function compute(
  endpoint: Endpoint,
  sentences: string[],
  source: Language,
  target: Language
): Promise<string[]> {
  const response = await fetch(endpoint.callbackUrl, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      [endpoint.authName]: endpoint.authValue,
    },
    body: JSON.stringify({
      pipelineTasks: [
        {
          taskType: "translation",
          config: {
            language: { sourceLanguage: source, targetLanguage: target },
            serviceId: endpoint.serviceId,
          },
        },
      ],
      inputData: { input: sentences.map((sentence) => ({ source: sentence })) },
    }),
  })

  if (!response.ok) {
    throw new TranslationError(`Bhashini translation failed with ${response.status}`, response.status)
  }

  const data = (await response.json()) as ComputeResponse
  const output = data.pipelineResponse?.find((task) => task.taskType === "translation")?.output ?? []

  // Matched by position, so a short answer would pair sentences with the
  // wrong translations. Refused rather than guessed at.
  if (output.length !== sentences.length) {
    throw new TranslationError(
      `Bhashini returned ${output.length} translations for ${sentences.length} sentences`
    )
  }
  return output.map((entry) => entry.target)
}

async function computeWithRetry(
  sentences: string[],
  source: Language,
  target: Language
): Promise<string[]> {
  const endpoint = await endpointFor(source, target)
  try {
    return await compute(endpoint, sentences, source, target)
  } catch (error) {
    // The inference key Bhashini handed out has been rotated: ask for a new
    // one once, then give up.
    if (error instanceof TranslationError && (error.status === 401 || error.status === 403)) {
      endpoints.delete(`${source}-${target}`)
      return compute(await endpointFor(source, target), sentences, source, target)
    }
    throw error
  }
}

/**
 * Translates plain-text sentences, answering in the same order. Throws
 * `TranslationError` if any batch fails, so a caller never shows a mix it
 * cannot account for.
 */
export async function translateSentences(
  sentences: string[],
  source: Language,
  target: Language
): Promise<string[]> {
  const batches: string[][] = []
  for (let start = 0; start < sentences.length; start += BATCH_SIZE) {
    batches.push(sentences.slice(start, start + BATCH_SIZE))
  }

  const results = await Promise.all(
    batches.map((batch) => computeWithRetry(batch, source, target))
  )
  return results.flat()
}
