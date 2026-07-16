import { GoogleGenerativeAI } from "@google/generative-ai";
import { apiCache } from "./cache";
import { FeasibilityResult, ItineraryItem, TouristPlace, TripPreferences } from "@/types";

// Primary model — fastest and cheapest with billing enabled
const MODEL = "gemini-2.5-flash";


// ─── JSON Utilities ────────────────────────────────────────────────────────────

/**
 * Balanced-bracket JSON extractor.
 * Finds the first complete JSON array ([...]) or object ({...}) in the text,
 * properly handling nested brackets inside string values.
 */
const extractJsonBlock = (text: string, startChar: "[" | "{"): string | null => {
  const endChar = startChar === "[" ? "]" : "}";
  const start = text.indexOf(startChar);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === startChar) depth++;
    else if (ch === endChar) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
};

const sanitizeJsonString = (raw: string): string => {
  let s = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  s = s.replace(/,\s*([}\]])/g, "$1");
  s = s.replace(/[\u0000-\u001F\u007F]+/g, " ");
  return s;
};

const extractJson = <T>(text: string, kind: "array" | "object"): T => {
  const cleaned = sanitizeJsonString(text);
  const startChar = kind === "array" ? "[" : "{";
  const block = extractJsonBlock(cleaned, startChar);

  if (!block) {
    console.error("[gemini] JSON extraction failed. Raw snippet:", cleaned.substring(0, 300));
    throw new Error("Invalid response from AI — could not parse JSON.");
  }

  try {
    return JSON.parse(block) as T;
  } catch (err) {
    console.error("[gemini] JSON parse failed:", block.substring(0, 400));
    throw new Error(`AI response format error: ${(err as Error).message}`);
  }
};

// ─── Core Text Generator ───────────────────────────────────────────────────────

const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36) + str.length;
};

const generateText = async (prompt: string, maxRetries = 5): Promise<string> => {
  const cacheKey = `gemini_${getHash(prompt)}`;
  const cached = apiCache.get<string>(cacheKey);
  if (cached) {
    console.log(`[Cache] HIT: ${prompt.slice(0, 50)}...`);
    return cached;
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    "";

  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in environment variables.");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  let lastErr = null;
  let currentModelToTry = MODEL;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: currentModelToTry,
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text?.trim()) throw new Error("Empty response from AI.");
      apiCache.set(cacheKey, text, 86400); // cache for 24 hours
      return text;
    } catch (err: any) {
      lastErr = err;
      const msg: string = err?.message || String(err);
      
      console.warn(`[gemini] Error on attempt ${attempt}/${maxRetries} with ${currentModelToTry}: ${msg.slice(0, 100)}`);

      if (msg.includes("503") || msg.toLowerCase().includes("service unavailable") || msg.toLowerCase().includes("overloaded")) {
        if (attempt < maxRetries) {
          const delayMs = attempt * 2500; // 2.5s, 5s, 7.5s, 10s backoff
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
      }
      
      if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
        throw new Error("QUOTA_EXCEEDED");
      }
      if (attempt === maxRetries) {
        if (msg.includes("503") || msg.toLowerCase().includes("service unavailable") || msg.toLowerCase().includes("overloaded")) {
          throw new Error("SERVICE_OVERLOADED");
        }
        throw err;
      }
    }
  }
  
  throw lastErr;
};

// ─── Exported Types ────────────────────────────────────────────────────────────

export interface CityAttractionDetail {
  name: string;
  type: string;
  description: string;
  highlights: string[];
  visitingHours: string;
  bestSeason: string;
  timeNeeded: string;
  entryFeeAdult: number;
  entryFeeChild: number;
  entryFeeForeign: number;
  nearbyAttractions: string[];
  tips: string[];
  rating: number;
  fameScore: number;
}

export interface CityPlannerData {
  cityOverview: string;
  historicalImportance: string;
  bestTimeToVisit: string;
  howToReach: string;
  localTransport: string;
  topSuggestions: string[];
  attractions: CityAttractionDetail[];
  totalBudgetEstimate: string;
  culturalTips: string[];
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export const getTouristPlaces = async (city: string): Promise<TouristPlace[]> => {
  const prompt = `List up to 8 exact, currently relevant tourist attractions located specifically within the geography of ${city}, India.
CRITICAL: Ground your response strictly to the actual city of ${city}. Do NOT hallucinate places from nearby cities. If the city is small and has fewer than 8 attractions, list only the real ones. Keep descriptions very brief (1-2 sentences max) to improve speed.
CRITICAL: Use only simple ASCII characters. No unescaped double quotes inside values. No trailing commas.

Respond ONLY as valid JSON array:
[{"name":"Exact place","rating":4.7,"fameScore":9,"description":"1 short sentence","historyInfo":"Brief","bestTime":"MORNING","type":"HISTORICAL"}]

Allowed types: TEMPLE, BEACH, MUSEUM, PARK, HISTORICAL, OTHER
Allowed bestTime: MORNING, AFTERNOON, EVENING, NIGHT`;

  try {
    const text = await generateText(prompt);
    const places = extractJson<TouristPlace[]>(text, "array");
    if (!Array.isArray(places) || places.length === 0) {
      throw new Error("No places returned by AI.");
    }
    return places
      .map((p, i) => ({
        ...p,
        id: `${city}-${i}`,
        city,
        rating: Number(p.rating || 0),
        fameScore: Number(p.fameScore || 0),
      }))
      .slice(0, 8);
  } catch (err: any) {
    if (err?.message === "QUOTA_EXCEEDED") {
      throw new Error("AI quota exceeded. Please add billing to your API key or try again tomorrow.");
    }
    if (err?.message === "SERVICE_OVERLOADED") {
      throw new Error("AI service is temporarily overloaded. Please wait a moment and try again.");
    }
    throw err;
  }
};

export const getCityPlannerData = async (city: string): Promise<CityPlannerData> => {
  const prompt = `Expert Indian travel guide for ${city}, India.
Provide highly accurate theoretical information and expert suggestions about the city.
CRITICAL: Ground your response strictly to the actual city of ${city}. Do NOT hallucinate places from nearby cities. If the city has fewer than 8 real notable attractions, return only the real ones. Keep text concise to improve speed.
CRITICAL: Use only simple ASCII characters in string values. Do not use unescaped double quotes inside values. No trailing commas.

Respond ONLY as valid JSON:
{"cityOverview":"2 brief sentences","historicalImportance":"1 brief paragraph","bestTimeToVisit":"e.g. Oct-Mar","howToReach":"Air/Train/Road briefly","localTransport":"Options","topSuggestions":["tip 1","tip 2"],"attractions":[{"name":"Exact real name","type":"Historical","description":"2 brief sentences","highlights":["h1","h2"],"visitingHours":"9AM-5PM","bestSeason":"Oct-Mar","timeNeeded":"2hr","entryFeeAdult":100,"entryFeeChild":50,"entryFeeForeign":500,"nearbyAttractions":["a","b"],"tips":["t1"],"rating":4.7,"fameScore":9}],"totalBudgetEstimate":"Rs 2000-4000/person/day","culturalTips":["c1"]}
Give up to 8 real attractions only for ${city}. All fees in INR.`;

  try {
    const text = await generateText(prompt);
    const data = extractJson<CityPlannerData>(text, "object");
    if (!data.attractions?.length) {
      throw new Error("No city attraction data returned by AI.");
    }
    data.attractions = data.attractions
      .map((a) => ({
        ...a,
        rating: Number(a.rating || 0),
        fameScore: Number(a.fameScore || 0),
      }))
      .slice(0, 8);
    return data;
  } catch (err: any) {
    if (err?.message === "QUOTA_EXCEEDED") {
      throw new Error("AI quota exceeded. Please add billing to your API key or try again tomorrow.");
    }
    if (err?.message === "SERVICE_OVERLOADED") {
      throw new Error("AI service is temporarily overloaded. Please wait a moment and try again.");
    }
    throw err;
  }
};

type PlannerInput = Pick<
  TripPreferences,
  "budget" | "durationDays" | "cities" | "foodPreference" | "travelPreference" | "groupType" | "activityLevel" | "dietaryRestrictions"
> & {
  originCountry: string;
  places: Pick<TouristPlace, "name">[];
};

export const analyzeFeasibility = async (data: PlannerInput): Promise<FeasibilityResult> => {
  const prompt = `Analyze India trip feasibility:
From: ${data.originCountry}, Budget: Rs ${data.budget}
Route: ${data.cities.join("->")}, Places: ${data.places.map((p) => p.name).join(", ")}
Transport: ${data.travelPreference}
Group: ${data.groupType || "Not specified"}, Activity Level: ${data.activityLevel || "Not specified"}
Diet: ${data.dietaryRestrictions || "None"}

Calculate the optimal number of days required for this trip.
Evaluate if the route makes sense. You MUST reorder the cities into a STRICTLY LINEAR and SEQUENTIAL geographic route. Do NOT create rotational, circular, or triangular routes. The journey should logically flow from one end to the other.
Given your optimized sequential route, identify the absolute NEAREST functional passenger airport (domestic or international) to the FIRST city in your chronological sequence, and suggest that as the arrival airport.
Provide practical advice on where to find authentic food/shelter if booked hotels/restaurants are unavailable, tailoring advice to diet and group type.
Provide specific cautions for this route (e.g. network issues, carry food/water on highways), keeping the group type and activity level in mind.
CRITICAL: Use only simple ASCII characters. No trailing commas. No unescaped quotes inside values.

Respond ONLY as JSON:
{"isPossible":true,"reason":"1-2 sentences","suggestedArrivalAirport":"Arrival Airport (Code)","optimizedCityRoute":["City1","City2"],"foodAndStayAdvice":"Advice","generalCautions":["caution1","caution2"],"suggestions":["tip1","tip2"],"estimatedCost":45000,"estimatedTime":36}`;

  const text = await generateText(prompt);
  return extractJson<FeasibilityResult>(text, "object");
};

export const generateItinerary = async (data: PlannerInput): Promise<ItineraryItem[]> => {
  const prompt = `Create a detailed India trip itinerary:
Route: ${data.cities.join("->")}
Places: ${data.places.map((p) => p.name).join(", ")}
Transport: ${data.travelPreference}
Group: ${data.groupType || "Not specified"}, Activity Level: ${data.activityLevel || "Not specified"}
Diet: ${data.dietaryRestrictions || "None"}

Calculate the optimal number of days required for this trip and assign the 'day' field accordingly. Ensure pace naturally matches Activity Level. Ensure food/step suggestions match Group and Diet.
Use real Indian prices. Give 5 numbered point-wise steps per stop.
CRITICAL: You MUST explicitly include EVERY single attraction from the 'Places' list in your day-by-day steps. Do not skip any selected places.
CRITICAL: Prepend a relevant emoji to EVERY step in the 'highlights' array (e.g., "🛕 Visit Kashi Vishwanath...", "🍽️ Eat lunch at...", "🚕 Take a taxi to...").
CRITICAL: Use only simple ASCII characters. No trailing commas. No unescaped quotes inside values.

Respond ONLY as JSON array:
[{"day":1,"time":"09:00 AM","place":"Real name","city":"City","activity":"Brief","transport":"Mode","routeFrom":"From","routeTo":"To","suggestedGuide":"Note","entryFee":500,"transportCost":1200,"guideFee":0,"totalCost":1700,"highlights":["1. Step one","2. Step two"],"imageUrl":""}]`;

  const text = await generateText(prompt);
  const plan = extractJson<ItineraryItem[]>(text, "array");
  if (!Array.isArray(plan) || plan.length === 0) {
    throw new Error("No itinerary returned by AI.");
  }
  return plan;
};
