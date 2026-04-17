import { TouristPlace } from "@/types";
import { CityPlannerData } from "./gemini";

// Factual fallback data for top Indian cities to handle 429 quota issues gracefully
export const PRE_CACHED_PLACES: Record<string, TouristPlace[]> = {
  "mumbai": [
    { id: "mumbai-0", name: "Gateway of India", rating: 4.7, fameScore: 10, description: "Iconic arch built in 1924 overlooking the Arabian Sea.", historyInfo: "Commemorates the visit of King George V.", bestTime: "MORNING", type: "HISTORICAL", city: "Mumbai" },
    { id: "mumbai-1", name: "Marine Drive", rating: 4.6, fameScore: 9, description: "3.6km long boulevard along the coast.", historyInfo: "Also known as the Queen's Necklace.", bestTime: "EVENING", type: "OTHER", city: "Mumbai" },
    { id: "mumbai-2", name: "Elephanta Caves", rating: 4.5, fameScore: 8, description: "UNESCO site with rock-cut Shiva temples.", historyInfo: "Dates back to 5th-8th centuries.", bestTime: "MORNING", type: "HISTORICAL", city: "Mumbai" },
    { id: "mumbai-3", name: "Chhatrapati Shivaji Maharaj Terminus", rating: 4.8, fameScore: 9, description: "Historic railway station and UNESCO site.", historyInfo: "Masterpiece of Gothic Revival architecture.", bestTime: "AFTERNOON", type: "HISTORICAL", city: "Mumbai" },
  ],
  "delhi": [
    { id: "delhi-0", name: "Red Fort", rating: 4.6, fameScore: 10, description: "17th-century fortress complex by Shah Jahan.", historyInfo: "Served as the main residence of Mughal Emperors.", bestTime: "MORNING", type: "HISTORICAL", city: "Delhi" },
    { id: "delhi-1", name: "Qutub Minar", rating: 4.7, fameScore: 9, description: "World's tallest brick minaret.", historyInfo: "Built by Qutub-ud-din Aibak in 1192.", bestTime: "AFTERNOON", type: "HISTORICAL", city: "Delhi" },
    { id: "delhi-2", name: "India Gate", rating: 4.7, fameScore: 10, description: "War memorial dedicated to Indian soldiers.", historyInfo: "Designed by Sir Edwin Lutyens.", bestTime: "EVENING", type: "HISTORICAL", city: "Delhi" },
    { id: "delhi-3", name: "Lotus Temple", rating: 4.5, fameScore: 8, description: "Baháʼí House of Worship famous for its flowerlike shape.", historyInfo: "Completed in 1986.", bestTime: "MORNING", type: "OTHER", city: "Delhi" },
  ],
  "jaipur": [
    { id: "jaipur-0", name: "Hawa Mahal", rating: 4.6, fameScore: 10, description: "Five-story pink sandstone palace with 953 windows.", historyInfo: "Built in 1799 by Maharaja Sawai Pratap Singh.", bestTime: "MORNING", type: "HISTORICAL", city: "Jaipur" },
    { id: "jaipur-1", name: "Amer Fort", rating: 4.8, fameScore: 9, description: "Majestic hilltop fort with artistic Hindu elements.", historyInfo: "Former residence of the Rajput Maharajas.", bestTime: "MORNING", type: "HISTORICAL", city: "Jaipur" },
    { id: "jaipur-2", name: "City Palace", rating: 4.6, fameScore: 8, description: "Complex of courtyards, gardens and buildings.", historyInfo: "Built between 1729 and 1732.", bestTime: "AFTERNOON", type: "HISTORICAL", city: "Jaipur" },
  ]
};

export const PRE_CACHED_CITY_GUIDES: Record<string, CityPlannerData> = {
  "mumbai": {
    cityOverview: "Mumbai is India's most populous city and its financial capital, known as the 'City of Dreams'.",
    historicalImportance: "Originally seven islands, it became an important port under British rule and a hub for the independence movement.",
    bestTimeToVisit: "November to February",
    howToReach: "Major international airport (BOM) and two main railway terminals.",
    localTransport: "Local trains, BEST buses, black-and-yellow taxis, and metro.",
    topSuggestions: ["Watch the sunset at Marine Drive", "Eat Vada Pav at Dadar", "Take a ferry to Elephanta Caves"],
    attractions: [
      { name: "Gateway of India", type: "Historical", description: "Iconic arch overlooking the sea.", highlights: ["Morning boat rides", "Photography", "Sea breeze"], visitingHours: "24/7", bestSeason: "Year round", timeNeeded: "1 hr", entryFeeAdult: 0, entryFeeChild: 0, entryFeeForeign: 0, nearbyAttractions: ["Taj Mahal Palace", "Marine Drive"], tips: ["Visit early morning to avoid crowds"], rating: 4.8, fameScore: 10 }
    ],
    totalBudgetEstimate: "₹2500 - ₹5000 per day",
    culturalTips: ["Mumbai is fast-paced", "Try cutting chai", "Respect local customs"]
  },
  "delhi": {
    cityOverview: "Delhi is the sprawling capital of India, where ancient history meets modern government.",
    historicalImportance: "Has been the capital of various empires, most notably the Mughals and the British Raj.",
    bestTimeToVisit: "October to March",
    howToReach: "Indira Gandhi International Airport (DEL) and extensive rail connectivity.",
    localTransport: "Delhi Metro, auto-rickshaws, and cycle rickshaws in old city.",
    topSuggestions: ["Explore Old Delhi's food", "Visit Akshardham Temple", "Evening at India Gate"],
    attractions: [
      { name: "Red Fort", type: "Historical", description: "Magnificent Mughal fort.", highlights: ["Sound and Light show", "Museums", "Lahori Gate"], visitingHours: "9:30 AM - 4:30 PM", bestSeason: "Winters", timeNeeded: "2-3 hrs", entryFeeAdult: 35, entryFeeChild: 0, entryFeeForeign: 500, nearbyAttractions: ["Jama Masjid", "Chandni Chowk"], tips: ["Closed on Mondays"], rating: 4.6, fameScore: 10 }
    ],
    totalBudgetEstimate: "₹2000 - ₹4500 per day",
    culturalTips: ["Try street food with caution", "Bargain in local markets", "Use the Metro"]
  }
};
