import { GoogleGenerativeAI } from "@google/generative-ai";
import { runWithRotation } from "./api-keys";
import { apiCache } from "./cache";

export interface CitySuggestion {
  name: string;
  placeId: string;
  description: string;
}

// Top 50+ major Indian cities for high-speed fallback and to reduce API cost
export const POPULAR_INDIAN_CITIES: CitySuggestion[] = [
  { name: "Mumbai", placeId: "mumbai", description: "Mumbai, Maharashtra, India" },
  { name: "Delhi", placeId: "delhi", description: "Delhi, India" },
  { name: "Bangalore", placeId: "bangalore", description: "Bangalore, Karnataka, India" },
  { name: "Hyderabad", placeId: "hyderabad", description: "Hyderabad, Telangana, India" },
  { name: "Ahmedabad", placeId: "ahmedabad", description: "Ahmedabad, Gujarat, India" },
  { name: "Chennai", placeId: "chennai", description: "Chennai, Tamil Nadu, India" },
  { name: "Kolkata", placeId: "kolkata", description: "Kolkata, West Bengal, India" },
  { name: "Surat", placeId: "surat", description: "Surat, Gujarat, India" },
  { name: "Pune", placeId: "pune", description: "Pune, Maharashtra, India" },
  { name: "Jaipur", placeId: "jaipur", description: "Jaipur, Rajasthan, India" },
  { name: "Lucknow", placeId: "lucknow", description: "Lucknow, Uttar Pradesh, India" },
  { name: "Kanpur", placeId: "kanpur", description: "Kanpur, Uttar Pradesh, India" },
  { name: "Nagpur", placeId: "nagpur", description: "Nagpur, Maharashtra, India" },
  { name: "Indore", placeId: "indore", description: "Indore, Madhya Pradesh, India" },
  { name: "Thane", placeId: "thane", description: "Thane, Maharashtra, India" },
  { name: "Bhopal", placeId: "bhopal", description: "Bhopal, Madhya Pradesh, India" },
  { name: "Visakhapatnam", placeId: "visakhapatnam", description: "Visakhapatnam, Andhra Pradesh, India" },
  { name: "Pimpri-Chinchwad", placeId: "pimpri_chinchwad", description: "Pimpri-Chinchwad, Maharashtra, India" },
  { name: "Patna", placeId: "patna", description: "Patna, Bihar, India" },
  { name: "Vadodara", placeId: "vadodara", description: "Vadodara, Gujarat, India" },
  { name: "Ghaziabad", placeId: "ghaziabad", description: "Ghaziabad, Uttar Pradesh, India" },
  { name: "Ludhiana", placeId: "ludhiana", description: "Ludhiana, Punjab, India" },
  { name: "Agra", placeId: "agra", description: "Agra, Uttar Pradesh, India" },
  { name: "Nashik", placeId: "nashik", description: "Nashik, Maharashtra, India" },
  { name: "Faridabad", placeId: "faridabad", description: "Faridabad, Haryana, India" },
  { name: "Meerut", placeId: "meerut", description: "Meerut, Uttar Pradesh, India" },
  { name: "Rajkot", placeId: "rajkot", description: "Rajkot, Gujarat, India" },
  { name: "Kalyan-Dombivli", placeId: "kalyan_dombivli", description: "Kalyan-Dombivli, Maharashtra, India" },
  { name: "Vasai-Virar", placeId: "vasai_virar", description: "Vasai-Virar, Maharashtra, India" },
  { name: "Varanasi", placeId: "varanasi", description: "Varanasi, Uttar Pradesh, India" },
  { name: "Srinagar", placeId: "srinagar", description: "Srinagar, Jammu and Kashmir, India" },
  { name: "Aurangabad", placeId: "aurangabad", description: "Aurangabad, Maharashtra, India" },
  { name: "Dhanbad", placeId: "dhanbad", description: "Dhanbad, Jharkhand, India" },
  { name: "Amritsar", placeId: "amritsar", description: "Amritsar, Punjab, India" },
  { name: "Navi Mumbai", placeId: "navi_mumbai", description: "Navi Mumbai, Maharashtra, India" },
  { name: "Allahabad", placeId: "allahabad", description: "Allahabad, Uttar Pradesh, India" },
  { name: "Ranchi", placeId: "ranchi", description: "Ranchi, Jharkhand, India" },
  { name: "Howrah", placeId: "howrah", description: "Howrah, West Bengal, India" },
  { name: "Coimbatore", placeId: "coimbatore", description: "Coimbatore, Tamil Nadu, India" },
  { name: "Jabalpur", placeId: "jabalpur", description: "Jabalpur, Madhya Pradesh, India" },
  { name: "Gwalior", placeId: "gwalior", description: "Gwalior, Madhya Pradesh, India" },
  { name: "Vijayawada", placeId: "vijayawada", description: "Vijayawada, Andhra Pradesh, India" },
  { name: "Jodhpur", placeId: "jodhpur", description: "Jodhpur, Rajasthan, India" },
  { name: "Madurai", placeId: "madurai", description: "Madurai, Tamil Nadu, India" },
  { name: "Raipur", placeId: "raipur", description: "Raipur, Chhattisgarh, India" },
  { name: "Kota", placeId: "kota", description: "Kota, Rajasthan, India" },
  { name: "Guwahati", placeId: "guwahati", description: "Guwahati, Assam, India" },
  { name: "Chandigarh", placeId: "chandigarh", description: "Chandigarh, India" },
  { name: "Solapur", placeId: "solapur", description: "Solapur, Maharashtra, India" },
  { name: "Hubli-Dharwad", placeId: "hubli_dharwad", description: "Hubli-Dharwad, Karnataka, India" },
  { name: "Udaipur", placeId: "udaipur", description: "Udaipur, Rajasthan, India" },
  { name: "Kochi", placeId: "kochi", description: "Kochi, Kerala, India" },
  { name: "Rishikesh", placeId: "rishikesh", description: "Rishikesh, Uttarakhand, India" },
  { name: "Haridwar", placeId: "haridwar", description: "Haridwar, Uttarakhand, India" },
];

function getStaticSuggestions(query: string): CitySuggestion[] {
  const q = query.toLowerCase().trim();
  return POPULAR_INDIAN_CITIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  ).slice(0, 5);
}

export async function searchCities(
  query: string
): Promise<CitySuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // 1. Check local static list FIRST to save API quota
  const staticResults = getStaticSuggestions(trimmed);
  // If we have a good match (e.g. they typed "Mum" and we found "Mumbai"), return it immediately
  // Or if the query is very short, don't even bother the AI yet
  if (staticResults.length > 0 && (trimmed.length < 4 || staticResults.some(s => s.name.toLowerCase() === trimmed.toLowerCase()))) {
    console.log(`[Static] HIT for city search: ${trimmed}`);
    return staticResults;
  }

  // 2. Check persistent cache
  const cacheKey = `cities_${trimmed.toLowerCase()}`;
  const cached = apiCache.get<CitySuggestion[]>(cacheKey);
  if (cached) {
    console.log(`[Cache] HIT for city search: ${trimmed}`);
    return cached;
  }

  // 3. Only then ask Gemini
  return runWithRotation(async (genAI) => {
    let lastErr = null;
    let maxRetries = 5;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `User typed: "${trimmed}". Return a JSON array of up to 5 actual major Indian cities matching this prefix or spelling.
Format STRICTLY as:
[{"name":"City Name","placeId":"cityname","description":"City Name, State, India"}]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        const match = stripped.match(/\[[\s\S]*?\]/);
        let results: CitySuggestion[] = [];
        
        if (match?.[0]) {
          results = JSON.parse(match[0]) as CitySuggestion[];
        }
        
        // If AI gave no results, try static list (backup)
        if (results.length === 0) {
          results = staticResults;
        }

        apiCache.set(cacheKey, results, 86400); // 24 hour cache
        return results;
      } catch (err: any) {
        lastErr = err;
        const msg = err.message || '';
        
        if (msg.includes("503") || msg.toLowerCase().includes("service unavailable")) {
          console.warn(`[gemini] Autocomplete 503 Overload on attempt ${attempt}/${maxRetries}`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
            continue;
          }
        }
        
        if (msg.includes("429") || err.status === 429) {
          console.warn(`[AI Rotation] 429 for ${trimmed}. Falling back to static suggestions.`);
          if (staticResults.length > 0) return staticResults;
          throw err;
        }
        console.error("[fallback-places] Autocomplete failed:", msg);
        return staticResults;
      }
    }
    throw lastErr;
  });
}


// ─── Place Photo ─────────────────────────────────────────────────────────────

/**
 * Gets a real photo from Wikimedia Commons for a given place.
 */
export async function getPlacePhotoUrl(
  placeName: string,
  city: string
): Promise<string | null> {
  const query = `${placeName} ${city}`;
  try {
    // Step 1: Fuzzy search Wikipedia for the closest matching article
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&utf8=&format=json&srlimit=1`;

    let res = await fetch(searchUrl, { cache: "no-store", headers: { "User-Agent": "SwadeshiYatra/1.0" } });
    let data = await res.json();
    let bestTitle = data.query?.search?.[0]?.title;

    // Step 2: Fetch the original main image for that article
    if (bestTitle) {
      const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(
        bestTitle
      )}`;
      res = await fetch(imgUrl, { cache: "no-store", headers: { "User-Agent": "SwadeshiYatra/1.0" } });
      data = await res.json();
      const pages = data?.query?.pages;
      const pageId = Object.keys(pages || {})[0];
      const photoUrl = pages?.[pageId]?.original?.source;
      if (photoUrl) return photoUrl;
    }

    return null;
  } catch (err) {
    console.error("[fallback-places] Photo fetch failed:", err);
    return null;
  }
}
