import fs from "fs"
import path from "path"
import { createOpenAI } from "@ai-sdk/openai"

export const DEFAULT_FREE_MODEL = "nvidia/nemotron-3.5-lightning:free"

export const DEFAULT_PRIORITY_FREE_MODELS = [
  DEFAULT_FREE_MODEL,
  "openrouter/free",
  "dots-studio/dots-3-note-preview:free",
  "recursive/flint-v1.0:free",
  "stealth/crouton-alpha"
]

const CACHE_FILE_PATH = path.join(process.cwd(), ".openrouter-model-cache.json")

interface ModelCache {
  currentModel: string
  lastSuccessAt: string
  recentFailures: Record<string, string> // model -> timestamp
}

// In-memory sticky cache to avoid disk reads on every single request
let inMemoryModel: string = DEFAULT_FREE_MODEL
let lastDiscoveredModels: string[] = []
let lastDiscoveryTime = 0

function readCache(): ModelCache {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, "utf-8"))
      if (data && typeof data.currentModel === "string") {
        return data
      }
    }
  } catch (err) {
    console.warn("Could not read openrouter model cache file:", err)
  }

  return {
    currentModel: DEFAULT_FREE_MODEL,
    lastSuccessAt: new Date().toISOString(),
    recentFailures: {}
  }
}

function writeCache(cache: ModelCache) {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2), "utf-8")
  } catch (err) {
    console.warn("Could not persist openrouter model cache file:", err)
  }
}

/**
 * Returns the OpenRouter API key from environment variables with fallback
 */
export function getOpenRouterApiKey(): string {
  return (
    process.env.OPENROUTER_API_KEY ||
    "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"
  )
}

/**
 * Initializes and returns an OpenRouter client instance configured for the AI SDK
 */
export function getOpenRouterClient() {
  const apiKey = getOpenRouterApiKey()
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer": "https://snattarwala.com",
      "X-Title": "SN AttarWala Luxury Fragrances",
    },
  })
}

/**
 * Returns the currently active working free model instantly (0ms latency overhead).
 * Always prioritizes and defaults to 'nvidia/nemotron-3.5-lightning:free' unless it
 * is temporarily experiencing a cooldown due to an active failure.
 */
export function getCurrentWorkingModel(): string {
  const cache = readCache()
  const defaultFailedAt = cache.recentFailures[DEFAULT_FREE_MODEL]

  // If the default model experienced a temporary rate-limit or downtime,
  // allow a 15-minute cooldown before automatically restoring it as the default.
  if (defaultFailedAt) {
    const elapsed = Date.now() - new Date(defaultFailedAt).getTime()
    if (elapsed > 15 * 60 * 1000) {
      delete cache.recentFailures[DEFAULT_FREE_MODEL]
      cache.currentModel = DEFAULT_FREE_MODEL
      writeCache(cache)
      inMemoryModel = DEFAULT_FREE_MODEL
      return DEFAULT_FREE_MODEL
    }
    inMemoryModel = cache.currentModel || DEFAULT_PRIORITY_FREE_MODELS[1]
    return inMemoryModel
  }

  // Under normal conditions, always lock in DEFAULT_FREE_MODEL
  if (cache.currentModel !== DEFAULT_FREE_MODEL) {
    cache.currentModel = DEFAULT_FREE_MODEL
    writeCache(cache)
  }
  inMemoryModel = DEFAULT_FREE_MODEL
  return inMemoryModel
}

/**
 * Updates the sticky working model in memory and persists to disk.
 * Subsequent chat requests will directly use this model on their first try!
 */
export function setWorkingModel(model: string) {
  inMemoryModel = model
  const cache = readCache()
  cache.currentModel = model
  cache.lastSuccessAt = new Date().toISOString()
  delete cache.recentFailures[model]
  writeCache(cache)
  console.log(`[OpenRouter Model Manager] Active sticky free model updated to: ${model}`)
}

/**
 * Records a model failure to avoid immediately retrying it
 */
export function recordModelFailure(model: string, reason: string) {
  const cache = readCache()
  cache.recentFailures[model] = new Date().toISOString()
  writeCache(cache)
  console.warn(`[OpenRouter Model Manager] Marked model '${model}' as failed: ${reason}`)
}

/**
 * Performs a fast lightweight test on a model (under 4 seconds) to verify if it responds
 */
export async function quickTestModel(modelName: string): Promise<boolean> {
  const apiKey = getOpenRouterApiKey()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4500)

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://snattarwala.com",
        "X-Title": "SN AttarWala",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5,
      }),
    })

    clearTimeout(timeout)
    if (!res.ok) return false

    const text = await res.text()
    const json = JSON.parse(text.trim())
    return Boolean(json.choices && json.choices.length > 0)
  } catch {
    return false
  }
}

/**
 * Dynamically queries OpenRouter API to discover any newly available free models.
 * Cached for 1 hour to prevent unnecessary network requests.
 */
export async function discoverDynamicFreeModels(): Promise<string[]> {
  const now = Date.now()
  if (lastDiscoveredModels.length > 0 && now - lastDiscoveryTime < 3600000) {
    return lastDiscoveredModels
  }

  const apiKey = getOpenRouterApiKey()
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` },
      cache: "no-store",
    })
    if (!res.ok) return []

    const json = await res.json()
    if (Array.isArray(json?.data)) {
      const free = json.data
        .filter((m: any) => {
          const p = m.pricing
          return p && Number(p.prompt) === 0 && Number(p.completion) === 0
        })
        .map((m: any) => m.id as string)

      lastDiscoveredModels = free
      lastDiscoveryTime = now
      return free
    }
  } catch (err) {
    console.warn("Could not dynamically query OpenRouter free models:", err)
  }

  return []
}

/**
 * When the current model fails, this function analyzes available free models,
 * tests the next candidates, and locks in the new working model.
 * Next time, the chatbot will immediately use this model!
 */
export async function findAndSwitchToNextWorkingFreeModel(failedModel?: string): Promise<string> {
  if (failedModel) {
    recordModelFailure(failedModel, "Runtime error / timeout")
  }

  const discovered = await discoverDynamicFreeModels()
  const candidatePool = Array.from(new Set([...DEFAULT_PRIORITY_FREE_MODELS, ...discovered]))

  // Filter out the failed model
  const modelsToTry = candidatePool.filter(m => m !== failedModel)

  console.log(`[OpenRouter Model Manager] Searching for a working free model among:`, modelsToTry)

  for (const model of modelsToTry) {
    console.log(`[OpenRouter Model Manager] Probing candidate: ${model}...`)
    const isWorking = await quickTestModel(model)
    if (isWorking) {
      setWorkingModel(model)
      console.log(`[OpenRouter Model Manager] Found working free model: ${model}! Locked in for future requests.`)
      return model
    }
  }

  // Fallback to openrouter/free meta-router if specific models all failed
  const fallback = "openrouter/free"
  setWorkingModel(fallback)
  return fallback
}

