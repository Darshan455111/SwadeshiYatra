'use client';

import React, { Suspense, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { TouristPlace, TripPreferences, FeasibilityResult, ItineraryItem, User } from '@/types';
import { CityPlannerData } from '@/lib/gemini';
// ─── Helpers ─────────────────────────────────────────────────────────────────
type GuideOption = { id: string; name: string; city: string; pricePerDay: number; expertise: string };
type CitySuggestion = { name: string; placeId: string; description: string };
const FALLBACK_IMAGE = '/placeholder-travel.svg';
const googlePhotos = (place: string, city: string) =>
  `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${place} ${city} India`)}`;
const googleMap = (place: string, city: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, ${city}, India`)}`;
// Quick-pick buttons (static shortcuts for popular cities)
const POPULAR_CITIES = ['Jaipur', 'Varanasi', 'Mumbai', 'Delhi', 'Goa', 'Agra', 'Udaipur', 'Kochi'];
const TYPE_FALLBACKS: Record<string, string> = {
  lake: 'https://images.unsplash.com/photo-1543881515-3885bb326848?w=800&q=80',
  river: 'https://images.unsplash.com/photo-1437482078695-73f550074fa8?w=800&q=80',
  dam: 'https://images.unsplash.com/photo-1596701540348-73dd9818ae41?w=800&q=80',
  fort: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80',
  church: 'https://images.unsplash.com/photo-1548625361-ecac3a6db9ce?w=800&q=80',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  temple: 'https://images.unsplash.com/photo-1514222288957-49fac7bfde0a?w=800&q=80',
  museum: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80',
  park: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  garden: 'https://images.unsplash.com/photo-1585320806297-9794b3e4ce11?w=800&q=80',
  palace: 'https://images.unsplash.com/photo-1548625361-ecac3a6db9ce?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80'
};

// ─── Google Places Photo Hook ────────────────────────────────────────────────

/** Cache map to avoid re-fetching photos for the same place */
const globalPhotoCache: Record<string, string> = {};

function useGooglePhoto(placeName: string, city: string): string {
  const key = `${placeName}__${city}`;
  const [url, setUrl] = useState(globalPhotoCache[key] || '');

  useEffect(() => {
    if (!placeName || !city) return;
    if (globalPhotoCache[key]) { setUrl(globalPhotoCache[key]); return; }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/place-photo?place=${encodeURIComponent(placeName)}&city=${encodeURIComponent(city)}`
        );
        const data = await res.json();
        const photo = data.photoUrl || '';
        if (!cancelled) {
          globalPhotoCache[key] = photo;
          setUrl(photo);
        }
      } catch {
        if (!cancelled) setUrl('');
      }
    })();
    return () => { cancelled = true; };
  }, [placeName, city, key]);

  return url;
}

/** Component wrapper for lazy-loaded Google Place Photo */
function PlaceImage({ placeName, city, type, className }: { placeName: string; city: string; type?: string; className?: string }) {
  const photoUrl = useGooglePhoto(placeName, city);
  const [imgError, setImgError] = useState(false);

  if (!photoUrl || imgError) {
    return (
      <a
        href={googlePhotos(placeName, city)}
        target="_blank"
        rel="noreferrer"
        className={`w-full h-full absolute inset-0 flex flex-col items-center justify-center bg-orange-50 text-orange-400 hover:text-red-500 hover:bg-orange-100 transition p-4 gap-2 z-0`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <span className="font-semibold text-sm text-center">Click for more</span>
      </a>
    );
  }

  return (
    <a
      href={googlePhotos(placeName, city)}
      target="_blank"
      rel="noreferrer"
      className={`group block absolute inset-0 z-0 ${className || ''}`}
    >
      <Image
        src={photoUrl}
        alt={placeName}
        fill
        className="object-cover"
        unoptimized
        onError={() => setImgError(true)}
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
        <span className="bg-white/95 text-red-700 font-bold px-4 py-2 rounded-full text-sm shadow-xl flex items-center gap-2 transform transition-transform group-hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Click for more
        </span>
      </div>
    </a>
  );
}

// ─── Travel Tip Loader ─────────────────────────────────────────────────────

const TRAVEL_TIPS = [
  '🇮🇳 India has 42 UNESCO World Heritage Sites, the 6th most in the world.',
  '🛕 The Kashi Vishwanath temple in Varanasi is one of the oldest living cities.',
  '🌿 India produces over 70% of the world\'s spices.',
  '🏔️ The Himalayas rank as the youngest and highest mountain range in the world.',
  '🐅 India is home to 75% of the world\'s wild tiger population.',
  '🚂 The Chhatrapati Shivaji Maharaj Terminus in Mumbai is a UNESCO-recognized railway station.',
  '🌊 The Sundarbans in West Bengal form the largest mangrove forest in the world.',
  '🏜️ The Rann of Kutch is the world\'s largest seasonal salt marsh desert.',
  '🌁 Meghalaya holds the Guinness World Record for being the wettest place on Earth.',
  '🚗 The highest motorable road in the world is the Umling La pass in Ladakh at 19,024 ft.',
];

function TravelTipLoader({ message, small = false }: { message: string, small?: boolean }) {
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % TRAVEL_TIPS.length);
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`rounded-2xl shadow-sm border text-center relative overflow-hidden ${small ? 'p-6' : 'p-10'}`} style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <div className="absolute top-0 left-0 w-32 h-32 bg-orange-100/50 rounded-full blur-2xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-100/50 rounded-full blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
      <div className={`${small ? 'text-4xl mb-4' : 'text-6xl mb-6'} flex justify-center w-full relative z-10`}>
        <div className="relative inline-block hover:scale-110 transition-transform duration-500">
          <span className="absolute inset-0 bg-yellow-200 rounded-full blur-xl opacity-40 animate-pulse"></span>
          <span className="relative z-10 drop-shadow-md">🌏</span>
          <span className="absolute -top-2 -right-4 text-2xl animate-bounce">✈️</span>
        </div>
      </div>
      <p className={`${small ? 'text-xl' : 'text-2xl'} font-black mb-2 tracking-tight relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500`}>{message}</p>
      {!small && <p className="text-sm mb-8 font-medium relative z-10 text-gray-500">Optimising routes and gathering local insights...</p>}
      
      <div className={`max-w-md mx-auto rounded-xl p-5 border shadow-sm relative z-10 backdrop-blur-sm bg-white/40 ${small ? 'min-h-[85px]' : 'min-h-[95px]'}`} style={{ borderColor: 'rgba(255,122,0,0.15)' }}>
        <p className="text-[10px] font-black uppercase mb-1.5 tracking-wider text-orange-600">General Knowledge Fact</p>
        <p
          className={`font-semibold transition-all duration-300 text-gray-800 ${small ? 'text-sm' : 'text-base'}`}
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(4px)' }}
        >
          {TRAVEL_TIPS[index]}
        </p>
      </div>
      
      <div className="flex justify-center gap-2 mt-6 relative z-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-full shadow-sm" style={{ width: 8, height: 8, background: i === 0 ? 'var(--sw-saffron)' : i === 1 ? '#e2e8f0' : 'var(--sw-blue)', animation: `pulse 1.5s ease-in-out infinite alternate`, animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── City Autocomplete Hook ─────────────────────────────────────────────────

function useCityAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (q.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/city-autocomplete?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSuggestions(data.cities || []);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  }, []);

  return { query, setQuery: search, suggestions, loading, showDropdown, setShowDropdown, clear, rawSetQuery: setQuery };
}

// ─── Autocomplete Dropdown Component ────────────────────────────────────────

function CityAutocompleteInput({
  value,
  onSearch,
  suggestions,
  loading,
  showDropdown,
  setShowDropdown,
  onSelect,
  onSubmit,
  placeholder,
  listId,
}: {
  value: string;
  onSearch: (q: string) => void;
  suggestions: CitySuggestion[];
  loading: boolean;
  showDropdown: boolean;
  setShowDropdown: (v: boolean) => void;
  onSelect: (city: string) => void;
  onSubmit: () => void;
  placeholder: string;
  listId: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setShowDropdown]);

  return (
    <div ref={containerRef} className="relative flex-1 min-w-[220px]">
      <input
        id={listId}
        type="text"
        value={value}
        onChange={(e) => onSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setShowDropdown(false);
            onSubmit();
          }
        }}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
        placeholder={placeholder}
        className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-orange-50 text-sm transition flex flex-col"
                onClick={() => {
                  onSelect(s.name);
                  setShowDropdown(false);
                }}
              >
                <span className="font-semibold text-gray-800">{s.name}</span>
                {s.description !== s.name && (
                  <span className="text-xs text-gray-500">{s.description}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── API helpers (server-side routes) ────────────────────────────────────────

async function fetchPlaces(city: string): Promise<TouristPlace[]> {
  const res = await fetch(`/api/places?city=${encodeURIComponent(city)}`);
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || `Places API error: ${res.status}`);
  }
  const { places } = await res.json();
  return places;
}

async function fetchCityGuide(city: string): Promise<CityPlannerData> {
  const res = await fetch(`/api/city-guide?city=${encodeURIComponent(city)}`);
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || `City guide API error: ${res.status}`);
  }
  const { data } = await res.json();
  return data;
}

async function fetchPlan(preferences: {
  budget: number; durationDays: number; cities: string[]; places: Pick<TouristPlace, 'name'>[];
  originCountry: string; foodPreference: string; travelPreference: string;
}): Promise<{ feasibility: FeasibilityResult; itinerary: ItineraryItem[] }> {
  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || `Plan API error: ${res.status}`);
  }
  return res.json();
}

// ─── City Planner ────────────────────────────────────────────────────────────

function CityPlannerMode({ initialCity }: { initialCity: string }) {
  const autocomplete = useCityAutocomplete();
  const [selectedCity, setSelectedCity] = useState('');
  const [cityData, setCityData] = useState<CityPlannerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const geminiAlert = 'Gemini not giving data alert';

  const loadCity = async (city: string) => {
    if (!city.trim()) return;
    setLoading(true); setError(''); setCityData(null); setSelectedCity(city.trim());
    autocomplete.clear();
    try {
      const data = await fetchCityGuide(city.trim());
      setCityData(data);
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Could not load city data. Please try again.';
      setError(message.includes('Gemini not giving data alert') ? geminiAlert : message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (initialCity) loadCity(initialCity); }, []); // eslint-disable-line

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-orange-100">
        <h2 className="text-2xl font-black text-red-700 mb-1">City Deep Dive</h2>
        <p className="text-gray-600 text-sm mb-4">Select any Indian city to get a complete AI-powered travel guide with real attractions, entry fees, visiting hours, and budget tips.</p>
        <div className="flex flex-wrap gap-3">
          <CityAutocompleteInput
            value={autocomplete.query}
            onSearch={autocomplete.setQuery}
            suggestions={autocomplete.suggestions}
            loading={autocomplete.loading}
            showDropdown={autocomplete.showDropdown}
            setShowDropdown={autocomplete.setShowDropdown}
            onSelect={(city) => { autocomplete.rawSetQuery(city); loadCity(city); }}
            onSubmit={() => loadCity(autocomplete.query)}
            placeholder="Type city name (e.g. Jaipur, Varanasi, Goa)"
            listId="cp-city-input"
          />
          <button onClick={() => loadCity(autocomplete.query)} disabled={loading}
            className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-7 py-3 rounded-lg font-bold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 transition">
            {loading ? 'Loading AI Guide...' : 'Get City Guide'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {POPULAR_CITIES.map((c) => (
            <button key={c} onClick={() => { autocomplete.rawSetQuery(c); loadCity(c); }}
              className="px-3 py-1 rounded-full bg-yellow-100 hover:bg-yellow-200 text-red-800 text-sm font-semibold transition">
              {c}
            </button>
          ))}
        </div>
        {error && <p className="text-red-600 font-semibold mt-3">⚠ {error}</p>}
      </div>

      {loading && (
        <TravelTipLoader message={`Fetching guide for ${selectedCity}...`} />
      )}

      {cityData && !loading && (
        <div className="space-y-6">
          {/* Overview banner */}
          <div className="rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-yellow-400 p-6 text-white shadow-md">
            <h2 className="text-3xl font-black mb-2">{selectedCity} — Complete Travel Guide</h2>
            <p className="text-white/95 text-lg mb-4 leading-relaxed font-medium">{cityData.cityOverview}</p>

            {cityData.historicalImportance && (
              <div className="mb-5 bg-black/20 rounded-xl p-4 border border-white/10">
                <p className="font-bold text-sm mb-1.5 flex items-center gap-2 text-yellow-200">
                  <span>🏛️</span> Historical & Cultural Legacy
                </p>
                <p className="text-white/90 text-sm leading-relaxed">{cityData.historicalImportance}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-5">
              {[
                { label: 'Best Time', val: cityData.bestTimeToVisit },
                { label: 'How to Reach', val: cityData.howToReach },
                { label: 'Local Transport', val: cityData.localTransport },
                { label: 'Budget/Day', val: cityData.totalBudgetEstimate },
              ].map((item) => (
                <div key={item.label} className="bg-white/20 rounded-xl p-3">
                  <p className="text-white/70 text-xs font-bold uppercase mb-1">{item.label}</p>
                  <p className="font-semibold text-sm">{item.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cityData.topSuggestions?.length > 0 && (
                <div className="bg-white/15 rounded-xl p-4">
                  <p className="font-bold text-sm mb-3 flex items-center gap-2 text-yellow-200">
                    <span>⭐</span> Expert Recommendations
                  </p>
                  <ul className="space-y-2 text-sm text-white/95">
                    {cityData.topSuggestions.map((tip, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-yellow-300 font-black">·</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cityData.culturalTips?.length > 0 && (
                <div className="bg-white/15 rounded-xl p-4">
                  <p className="font-bold text-sm mb-3 flex items-center gap-2 text-yellow-200">
                    <span>💡</span> Local & Cultural Tips
                  </p>
                  <ul className="space-y-2 text-sm text-white/95">
                    {cityData.culturalTips.map((tip, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-yellow-300 font-black">·</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Attraction cards */}
          <div>
            <h3 className="text-2xl font-black text-red-700 mb-4">Top Attractions in {selectedCity}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(cityData.attractions || []).map((attr, i) => (
                <div key={i} className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                  <div className="relative w-full h-48">
                    <PlaceImage placeName={attr.name} city={selectedCity} type={attr.type} className="object-cover" />
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full pointer-events-none">{attr.type}</div>
                    <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-black px-2 py-1 rounded-full pointer-events-none">★ {attr.rating} · {attr.fameScore}/10</div>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-2">
                      <h4 className="text-white font-black text-lg">{attr.name}</h4>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-700 text-sm mb-3">{attr.description}</p>

                    {/* Highlights */}
                    {attr.highlights?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-orange-600 uppercase mb-2">Highlights</p>
                        <ol className="space-y-1">
                          {attr.highlights.map((h, hi) => (
                            <li key={hi} className="text-sm text-gray-700 flex gap-2">
                              <span className="text-red-500 font-bold shrink-0">{hi + 1}.</span>{h}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Visit info */}
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="bg-orange-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Visiting Hours</p>
                        <p className="font-semibold text-gray-800">{attr.visitingHours}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Time Needed</p>
                        <p className="font-semibold text-gray-800">{attr.timeNeeded}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Best Season</p>
                        <p className="font-semibold text-gray-800">{attr.bestSeason}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                        <p className="text-xs text-gray-500">Entry Fee (Adult/Child/Foreign)</p>
                        <p className="font-bold text-red-700">₹{attr.entryFeeAdult} / ₹{attr.entryFeeChild} / ₹{attr.entryFeeForeign}</p>
                      </div>
                    </div>

                    {attr.tips?.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                        <p className="text-xs font-bold text-orange-600 uppercase mb-1">Tips</p>
                        {attr.tips.map((t, ti) => <p key={ti} className="text-sm text-gray-700">• {t}</p>)}
                      </div>
                    )}

                    {attr.nearbyAttractions?.length > 0 && (
                      <p className="text-xs text-gray-600 mb-3"><span className="font-bold text-orange-600">Nearby: </span>{attr.nearbyAttractions.join(', ')}</p>
                    )}

                    <div className="flex justify-end pt-2">
                      <a href={googleMap(attr.name, selectedCity)} target="_blank" rel="noreferrer" title="Map view" className="inline-flex items-center gap-1.5 text-green-700 font-bold hover:text-green-900 transition bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span>Map View</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Journey Planner ─────────────────────────────────────────────────────────

function JourneyPlannerMode() {
  const [step, setStep] = useState(1);
  const autocomplete = useCityAutocomplete();
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cityPlaces, setCityPlaces] = useState<Record<string, TouristPlace[]>>({});
  const [selectedPlaces, setSelectedPlaces] = useState<TouristPlace[]>([]);
  const [guideMap, setGuideMap] = useState<Record<string, GuideOption[]>>({});
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedGuides, setSelectedGuides] = useState<Record<string, string>>({});
  const [preferences, setPreferences] = useState<TripPreferences>({
    budget: 30000, durationDays: 5, cities: [], places: [], originCountry: 'India', foodPreference: 'BOTH', travelPreference: 'BOTH',
    groupType: 'FAMILY', activityLevel: 'MODERATE', dietaryRestrictions: 'NONE'
  });
  const [feasibility, setFeasibility] = useState<FeasibilityResult | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [interestsInput, setInterestsInput] = useState('history, food, architecture');

  const loadGuides = async (cities: string[]) => {
    if (!cities.length) { setGuideMap({}); return; }
    try {
      const q = cities.map((c) => `city=${encodeURIComponent(c)}`).join('&');
      const res = await fetch(`/api/guides?${q}`, { cache: 'no-store' });
      if (!res.ok) { setGuideMap({}); return; }
      const { guides } = (await res.json()) as { guides: User[] };
      const byCity: Record<string, GuideOption[]> = {};
      guides.forEach((g) => {
        const key = g.location || '';
        if (!byCity[key]) byCity[key] = [];
        byCity[key].push({ id: g.id, name: g.name, city: key, pricePerDay: g.price || 0, expertise: g.expertise || 'City Tour' });
      });
      setGuideMap(byCity);
    } catch { setGuideMap({}); }
  };

  const addCity = async (raw: string) => {
    const city = raw.trim();
    if (!city || selectedCities.includes(city)) { autocomplete.clear(); return; }
    setError(''); setCitiesLoading(true);
    autocomplete.clear();
    try {
      const places = await fetchPlaces(city);
      const next = [...selectedCities, city];
      setCityPlaces((p) => ({ ...p, [city]: places }));
      if (places.length > 0) {
        const top = [...places].sort((a, b) => b.fameScore - a.fameScore || b.rating - a.rating)[0];
        setSelectedPlaces((prev) => prev.find((p) => p.name === top.name && p.city === top.city) ? prev : [...prev, top]);
      }
      setSelectedCities(next);
      await loadGuides(next);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not load city data. Please try again.';
      setError(message);
    }
    finally { setCitiesLoading(false); }
  };

  const togglePlace = (place: TouristPlace) => {
    if (selectedPlaces.find((p) => p.name === place.name && p.city === place.city))
      setSelectedPlaces(selectedPlaces.filter((p) => !(p.name === place.name && p.city === place.city)));
    else setSelectedPlaces([...selectedPlaces, place]);
  };

  const removeCity = (city: string) => {
    const next = selectedCities.filter((c) => c !== city);
    setSelectedCities(next);
    setSelectedPlaces((p) => p.filter((x) => x.city !== city));
    setSelectedGuides((p) => { const n = { ...p }; delete n[city]; return n; });
    loadGuides(next);
  };

  const handleGeneratePlan = async () => {
    if (!selectedCities.length || !selectedPlaces.length) { setError('Please select at least one city and one place.'); return; }
    setPlanLoading(true); setError('');
    try {
      const { feasibility: feas, itinerary: plan } = await fetchPlan({
        ...preferences, cities: selectedCities, places: selectedPlaces,
      });
      const normalized = plan.map((item) => {
        const guideId = selectedGuides[item.city];
        const guide = Object.values(guideMap).flat().find((g) => g.id === guideId);
        const entryFee = item.entryFee ?? 300;
        const transportCost = item.transportCost ?? (selectedCities.length > 1 ? 1500 : 500);
        const guideFee = guide ? guide.pricePerDay : 0;
        return {
          ...item,
          routeFrom: item.routeFrom ?? 'Previous Stop',
          routeTo: item.routeTo ?? item.city,
          suggestedGuide: guide ? `${guide.name} — ₹${guide.pricePerDay}/day` : 'Not selected',
          entryFee, transportCost, guideFee,
          totalCost: entryFee + transportCost + guideFee,
          imageUrl: item.imageUrl || '',
          highlights: item.highlights?.length ? item.highlights : [
            `1. Reach ${item.place} via ${item.transport || 'local transport'}.`,
            '2. Collect entry tickets at the gate.',
            '3. Explore main highlights — allow 2 hours.',
            '4. Visit the best photo spots.',
            '5. Proceed to next stop on schedule.',
          ],
        };
      });
      const total = normalized.reduce((s, it) => s + (it.totalCost ?? 0), 0);
      setFeasibility(feas ?? { isPossible: total <= preferences.budget, reason: total <= preferences.budget ? 'Route feasible.' : 'Exceeds budget.', estimatedCost: total, estimatedTime: normalized.length * 3 });
      setItinerary(normalized);
      setStep(3);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to generate plan. Please retry.';
      setError(message);
    }
    finally { setPlanLoading(false); }
  };

  const totalGuideCost = Object.entries(selectedGuides).reduce((s, [city, id]) => { const g = (guideMap[city] ?? []).find((x) => x.id === id); return s + (g?.pricePerDay ?? 0); }, 0);
  const totalRouteCost = itinerary.reduce((s, it) => s + (it.totalCost ?? 0), 0);
  const routeMapLink = useMemo(() => {
    if (selectedCities.length < 2) return '';
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selectedCities[0])}&destination=${encodeURIComponent(selectedCities[selectedCities.length - 1])}&waypoints=${encodeURIComponent(selectedCities.slice(1, -1).join('|'))}&travelmode=driving`;
  }, [selectedCities]);

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex justify-between gap-3">
        {['Cities & Places', 'Budget & Guides', 'Route & Expenses'].map((label, idx) => {
          const s = idx + 1;
          return (
            <div key={s} className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${step >= s ? 'bg-red-600 text-white' : 'bg-yellow-100 text-orange-400'}`}>{s}</div>
              <span className={`text-sm text-center ${step >= s ? 'text-red-700 font-semibold' : 'text-orange-400'}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm border border-orange-100">
          <div className="flex flex-wrap gap-3">
            <CityAutocompleteInput
              value={autocomplete.query}
              onSearch={autocomplete.setQuery}
              suggestions={autocomplete.suggestions}
              loading={autocomplete.loading}
              showDropdown={autocomplete.showDropdown}
              setShowDropdown={autocomplete.setShowDropdown}
              onSelect={(city) => { autocomplete.rawSetQuery(city); addCity(city); }}
              onSubmit={() => addCity(autocomplete.query)}
              placeholder="Type city name (e.g. Mumbai, Varanasi, Jaipur)"
              listId="jp-city-input"
            />
            <button onClick={() => addCity(autocomplete.query)} disabled={citiesLoading}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-lg font-bold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 transition">
              {citiesLoading ? '⏳ Loading...' : 'Add City'}
            </button>
          </div>

          {citiesLoading && (
            <div className="py-2">
              <TravelTipLoader message="Finding real attractions..." small={true} />
            </div>
          )}

          {/* Quick-pick popular cities */}
          <div className="flex flex-wrap gap-2">
            {POPULAR_CITIES.filter((c) => !selectedCities.includes(c)).map((c) => (
              <button key={c} onClick={() => addCity(c)} className="px-3 py-1 rounded-full bg-yellow-100 hover:bg-yellow-200 text-red-800 text-sm font-semibold">{c}</button>
            ))}
          </div>

          {selectedCities.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {selectedCities.map((city) => (
                <span key={city} className="bg-orange-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                  {city}
                  <button onClick={() => removeCity(city)} className="hover:text-black text-lg leading-none">×</button>
                </span>
              ))}
            </div>
          )}

          {selectedCities.map((city) => (
            <div key={city} className="bg-white rounded-xl border border-orange-100 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-xl text-red-700">{city} Attractions</h3>
                <button
                  type="button"
                  onClick={() => {
                    const places = cityPlaces[city] ?? [];
                    const allSel = places.every((p) => selectedPlaces.find((s) => s.name === p.name && s.city === p.city));
                    if (allSel) {
                      setSelectedPlaces((prev) => prev.filter((s) => s.city !== city));
                    } else {
                      const toAdd = places.filter((p) => !selectedPlaces.find((s) => s.name === p.name && s.city === p.city));
                      setSelectedPlaces((prev) => [...prev, ...toAdd]);
                    }
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-full border transition"
                  style={{ borderColor: 'rgba(255,122,0,0.4)', color: 'var(--sw-saffron)', background: 'rgba(255,122,0,0.08)' }}
                >
                  {(cityPlaces[city] ?? []).every((p) => selectedPlaces.find((s) => s.name === p.name && s.city === p.city))
                    ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(cityPlaces[city] ?? []).map((place) => {
                  const isSel = !!selectedPlaces.find((p) => p.name === place.name && p.city === place.city);
                  return (
                    <button type="button" key={place.id}
                      className={`text-left p-4 border rounded-xl transition ${isSel ? 'border-red-500 bg-yellow-50' : 'border-orange-100 hover:border-orange-400'}`}
                      onClick={() => togglePlace(place)}>
                      <div className="relative w-full h-36 mb-3 rounded-lg overflow-hidden shrink-0">
                        <PlaceImage placeName={place.name} city={city} type={place.type} className="object-cover" />
                        {isSel && <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none"><span className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-black">✓</span></div>}
                      </div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-800">{place.name}</h4>
                        <span className="text-yellow-500 font-black shrink-0">★ {place.rating}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{place.description}</p>
                      <div className="flex gap-2 text-xs flex-wrap mb-2">
                        <span className="bg-orange-100 px-2 py-1 rounded">Fame: {place.fameScore}/10</span>
                        <span className="bg-orange-100 px-2 py-1 rounded">{place.bestTime}</span>
                        <span className="bg-orange-100 px-2 py-1 rounded">{place.type}</span>
                      </div>
                      <div className="flex justify-end mt-2">
                        <a href={googleMap(place.name, city)} target="_blank" rel="noreferrer" title="Map view" className="inline-flex items-center gap-1.5 text-green-700 font-bold hover:text-green-900 transition bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-200" onClick={(e) => e.stopPropagation()}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span>Map View</span>
                        </a>
                      </div>
                    </button>
                  );
                })}
                {!(cityPlaces[city] ?? []).length && <p className="text-sm text-gray-500 col-span-2">No places loaded. Click Add City again to retry.</p>}
              </div>
            </div>
          ))}

          {error && <p className="text-red-600 font-semibold">{error}</p>}

          {selectedCities.length > 0 && (
            <div className="flex justify-center mt-4">
              <button onClick={() => {
                if (!selectedCities.length) { setError('Add at least one city.'); return; }
                if (!selectedPlaces.length) {
                  const auto = selectedCities.flatMap((c) => cityPlaces[c] ?? []).slice(0, 3);
                  if (!auto.length) { setError('No places found. Retry adding city.'); return; }
                  setSelectedPlaces(auto);
                }
                setStep(2);
              }} className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-10 py-3 rounded-full font-bold hover:from-red-700 hover:to-orange-700 transition shadow-lg">
                Next: Budget & Guides ({selectedPlaces.length} places)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm border border-orange-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 lg:col-span-1">
              <label className="flex flex-col text-sm font-bold text-gray-700 mb-1 gap-1.5">
                <div className="flex justify-between items-center w-full">
                  <span>Total Budget (₹ INR)</span>
                  <span className="text-xs text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded border border-orange-200 shadow-sm whitespace-nowrap">
                    💡 AI Est. Minimum: ₹{((selectedPlaces.length * 800) + (selectedCities.length * 2500)).toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block">⚠️ Post-Arrival/Inside India expenses ONLY (Excludes Intl. Flights)</span>
              </label>
              <input type="number" min={1000} value={preferences.budget}
                onChange={(e) => setPreferences((p) => ({ ...p, budget: Number(e.target.value) }))}
                className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-red-400 outline-none font-semibold text-lg" />
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Where are you traveling from? (City, Country)</label>
              <input type="text" value={preferences.originCountry}
                onChange={(e) => setPreferences((p) => ({ ...p, originCountry: e.target.value }))}
                placeholder="e.g., London, UK or Delhi, India"
                className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-red-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Travel Mode</label>
              <select value={preferences.travelPreference}
                onChange={(e) => setPreferences((p) => ({ ...p, travelPreference: e.target.value as TripPreferences['travelPreference'] }))}
                className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-red-400 outline-none">
                <option value="PUBLIC">Public (Bus / Train / Auto)</option>
                <option value="PRIVATE">Private Taxi / Car</option>
                <option value="BOTH">Mixed</option>
              </select>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 md:col-span-2">
              <p className="font-bold text-red-700">Trip Summary</p>
              <p className="text-sm text-gray-700 mt-1">{preferences.originCountry} → {selectedCities.join(' → ')} · {selectedPlaces.length} places · Guide daily total: ₹{totalGuideCost.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-orange-900">Trip Pace</label>
              <select
                value={preferences.tripPace}
                onChange={(e) => setPreferences({ ...preferences, tripPace: e.target.value as TripPreferences['tripPace'] })}
                className="w-full rounded-xl border border-orange-200 bg-white/90 p-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="RELAXED">Relaxed</option>
                <option value="BALANCED">Balanced</option>
                <option value="FAST">Fast</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-orange-900">Stay Preference</label>
              <select
                value={preferences.accommodationPreference}
                onChange={(e) => setPreferences({ ...preferences, accommodationPreference: e.target.value as TripPreferences['accommodationPreference'] })}
                className="w-full rounded-xl border border-orange-200 bg-white/90 p-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="BUDGET">Budget</option>
                <option value="COMFORT">Comfort</option>
                <option value="LUXURY">Luxury</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-orange-900">Group Type</label>
              <select
                value={preferences.groupType}
                onChange={(e) => setPreferences({ ...preferences, groupType: e.target.value as TripPreferences['groupType'] })}
                className="w-full rounded-xl border border-orange-200 bg-white/90 p-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="SOLO">Solo Traveler</option>
                <option value="COUPLE">Couple</option>
                <option value="FAMILY">Family with kids</option>
                <option value="FRIENDS">Group of Friends</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-orange-900">Activity Level</label>
              <select
                value={preferences.activityLevel}
                onChange={(e) => setPreferences({ ...preferences, activityLevel: e.target.value as TripPreferences['activityLevel'] })}
                className="w-full rounded-xl border border-orange-200 bg-white/90 p-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="LOW">Relaxed / Low Pace</option>
                <option value="MODERATE">Moderate / Balanced</option>
                <option value="HIGH">High / Adventure focused</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-orange-900">Dietary Restrictions</label>
              <select
                value={preferences.dietaryRestrictions}
                onChange={(e) => setPreferences({ ...preferences, dietaryRestrictions: e.target.value as TripPreferences['dietaryRestrictions'] })}
                className="w-full rounded-xl border border-orange-200 bg-white/90 p-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="NONE">None</option>
                <option value="VEGAN">Vegan / Pure Veg</option>
                <option value="JAIN">Jain</option>
                <option value="HALAL">Halal</option>
                <option value="GLUTEN_FREE">Gluten-free</option>
                <option value="OTHER">Other specific diet</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-orange-900">Interests (comma separated)</label>
              <input
                type="text"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                className="w-full rounded-xl border border-orange-200 bg-white/90 p-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="history, local food, nature, architecture"
              />
            </div>
          </div>

          {planLoading && <TravelTipLoader message="Building your journey plan..." />}

          <div style={{ display: planLoading ? 'none' : 'block' }}>
            <h3 className="text-xl font-black text-red-700 mb-3">Select Guide by City (Optional)</h3>
            {selectedCities.map((city) => {
              const guides = guideMap[city] ?? [];
              return (
                <div key={city} className="border border-orange-200 rounded-xl p-4 mb-4">
                  <h4 className="font-bold mb-2 text-red-700">{city}</h4>
                  {guides.length === 0 ? <p className="text-sm text-gray-500">No registered guides for {city} yet.</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {guides.map((g) => (
                        <button type="button" key={g.id}
                          onClick={() => setSelectedGuides((p) => ({ ...p, [city]: p[city] === g.id ? '' : g.id }))}
                          className={`text-left border rounded-lg p-3 transition ${selectedGuides[city] === g.id ? 'border-red-500 bg-yellow-50' : 'border-orange-200 hover:border-orange-400'}`}>
                          <p className="font-bold">{g.name}</p>
                          <p className="text-sm text-gray-700">{g.expertise}</p>
                          <p className="text-sm text-red-700 font-semibold mt-1">₹{g.pricePerDay.toLocaleString('en-IN')} / day</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className="text-red-600 font-semibold">{error}</p>}

          <div className="flex gap-4 justify-center">
            <button onClick={() => setStep(1)} className="px-8 py-3 border border-orange-300 rounded-full font-bold hover:bg-orange-50 transition">Back</button>
            <button onClick={handleGeneratePlan} disabled={planLoading}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-10 py-3 rounded-full font-bold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 transition shadow-lg">
              {planLoading ? '✈️ Planning your journey...' : 'Generate Journey Plan'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-8 rounded-2xl bg-white p-6 shadow-sm border border-orange-100">
          {!itinerary.length && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-gray-700">No route yet. Go to Step 2 and click Generate.</div>}

          {feasibility && (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border-l-8 shadow-sm ${feasibility.isPossible ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                <h2 className="text-2xl font-black mb-2">{feasibility.isPossible ? '✅ Trip is Feasible' : '⚠️ Needs Optimization'}</h2>
                <p className="text-gray-800 font-medium mb-4">{feasibility.reason}</p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { label: 'AI Estimated Cost', val: `₹${feasibility.estimatedCost.toLocaleString('en-IN')}` },
                    { label: 'Hours Required', val: `${feasibility.estimatedTime}h` },
                    { label: 'Route Total', val: `₹${totalRouteCost.toLocaleString('en-IN')}` },
                  ].map((x) => (
                    <div key={x.label} className="bg-white p-4 rounded-xl shadow-sm border border-black/5 text-center">
                      <p className="text-xs text-gray-500 uppercase font-bold">{x.label}</p>
                      <p className="text-xl md:text-2xl font-black text-red-700 mt-1">{x.val}</p>
                    </div>
                  ))}
                </div>
                {(feasibility.suggestions?.length ?? 0) > 0 && (
                  <div className="bg-white/60 p-4 rounded-xl mb-4">
                    <p className="font-bold text-sm mb-2 text-gray-800">💡 Optimization Suggestions</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
                      {feasibility.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                )}
              </div>

              {/* Detailed Pre-Trip AI Guidance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm">
                  <h4 className="font-black text-lg text-blue-700 mb-2 flex items-center gap-2"><span>✈️</span> Recommended Route & Arrival</h4>
                  <p className="text-sm text-gray-700 mb-3"><span className="font-bold">Land At:</span> {feasibility.suggestedArrivalAirport || 'Nearest major hub'}</p>
                  {(feasibility.optimizedCityRoute?.length ?? 0) > 0 && (
                    <div className="text-sm text-gray-700"><span className="font-bold mb-1 block">Optimised Sequence:</span>
                      <div className="flex flex-wrap gap-2">
                        {feasibility.optimizedCityRoute?.map((city, ci, arr) => (
                          <span key={ci} className="flex items-center gap-2">
                            <span className="bg-blue-50 text-blue-800 px-2 py-1 rounded font-semibold">{city}</span>
                            {ci < arr.length - 1 && <span className="text-gray-400">→</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm">
                  <h4 className="font-black text-lg text-red-700 mb-2 flex items-center gap-2"><span>⚠️</span> Survival & Safety Cautions</h4>
                  {(feasibility.generalCautions?.length ?? 0) > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1.5">
                      {feasibility.generalCautions?.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">No major cautions for this route. Standard travel precautions apply.</p>
                  )}
                </div>

                {feasibility.foodAndStayAdvice && (
                  <div className="md:col-span-2 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-r-2xl p-5 shadow-sm">
                    <h4 className="font-black text-lg text-yellow-800 mb-2 flex items-center gap-2"><span>🏕️</span> Independent Food & Shelter Guidance</h4>
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">{feasibility.foodAndStayAdvice}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedCities.length > 1 && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-red-700">Route Map</h2>
              <div className="rounded-xl overflow-hidden border border-orange-100">
                <iframe title="route-map" src={`https://www.google.com/maps?q=${encodeURIComponent(selectedCities.join(' to '))}&output=embed`} className="w-full h-[280px]" />
              </div>
              {routeMapLink && <a href={routeMapLink} target="_blank" rel="noreferrer" className="inline-block text-red-700 underline font-semibold text-sm">Open full route in Google Maps →</a>}
            </div>
          )}

          {itinerary.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-center text-red-700">Complete Route Plan</h2>
              {itinerary.map((item, idx) => (
                <div key={idx} className="bg-white border border-orange-200 rounded-2xl overflow-hidden shadow-sm group hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 ease-out">
                  <div className="relative w-full h-48">
                    <PlaceImage placeName={item.place} city={item.city} className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-4 text-white pointer-events-none">
                      <p className="text-xl font-black">{item.place}</p>
                      <p className="text-sm opacity-90">Day {item.day} · {item.time} · {item.city}</p>
                    </div>
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-sm font-black px-3 py-1 rounded-full pointer-events-none">
                      ₹{(item.totalCost ?? 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-700 mb-4">{item.activity}</p>
                    {(item.highlights ?? []).length > 0 && (
                      <div className="mb-4 bg-orange-50 rounded-xl p-4">
                        <p className="font-bold text-red-700 text-sm uppercase mb-2">📋 Step-by-Step Activity</p>
                        <ol className="space-y-2">
                          {(item.highlights ?? []).map((point, pi) => (
                            <li key={pi} className="flex gap-2 text-sm text-gray-800">
                              <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{pi + 1}</span>
                              <span>{point.replace(/^\d+\.\s*/, '')}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div className="bg-orange-50 rounded-lg p-2"><p className="text-xs text-gray-500">Route</p><p className="font-semibold">{item.routeFrom} → {item.routeTo}</p></div>
                      <div className="bg-orange-50 rounded-lg p-2"><p className="text-xs text-gray-500">Transport</p><p className="font-semibold">{item.transport}</p></div>
                      <div className="bg-orange-50 rounded-lg p-2"><p className="text-xs text-gray-500">Guide</p><p className="font-semibold">{item.suggestedGuide ?? 'Not selected'}</p></div>
                      <div className="bg-red-50 rounded-lg p-2 border border-red-100"><p className="text-xs text-gray-500">Entry Fee</p><p className="font-bold text-red-700">₹{(item.entryFee ?? 0).toLocaleString('en-IN')}</p></div>
                      <div className="bg-red-50 rounded-lg p-2 border border-red-100"><p className="text-xs text-gray-500">Transport</p><p className="font-bold text-red-700">₹{(item.transportCost ?? 0).toLocaleString('en-IN')}</p></div>
                      <div className="bg-red-50 rounded-lg p-2 border border-red-100"><p className="text-xs text-gray-500">Guide Fee</p><p className="font-bold text-red-700">₹{(item.guideFee ?? 0).toLocaleString('en-IN')}</p></div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 justify-between items-center border-t border-gray-100 pt-4">
                      <div className="flex gap-3">
                        <a href={googleMap(item.place, item.city)} target="_blank" rel="noreferrer" title="Map view" className="inline-flex items-center gap-1.5 text-green-700 font-bold hover:text-green-900 transition bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span>Map View</span>
                        </a>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold uppercase">Estimated Cost</p>
                        <p className="font-black text-xl text-red-700 leading-none">₹{(item.totalCost ?? 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-br from-orange-600 via-red-600 to-red-700 text-white rounded-2xl p-8 text-center shadow-xl border-4 border-orange-200/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full opacity-5 -translate-y-10 translate-x-10 pointer-events-none"></div>

                <p className="text-xl font-black text-orange-100 tracking-wide uppercase mb-2">Total Estimated Need (Post-Landing)</p>
                <p className="text-5xl md:text-6xl font-black drop-shadow-md">₹{totalRouteCost.toLocaleString('en-IN')}</p>

                <div className="mt-5 bg-black/20 backdrop-blur-sm rounded-xl p-4 inline-block border border-white/10 text-left">
                  <p className="text-sm font-bold text-white flex items-start gap-2 max-w-lg">
                    <span className="text-lg">🛬</span>
                    <span>Note: This estimation covers costs strictly <em>after</em> landing in India. Flights from your origin country to India are EXCLUDED.</span>
                  </p>
                </div>

                <p className="text-sm font-semibold opacity-90 mt-5 pt-4 border-t border-white/20 flex flex-wrap justify-center gap-x-4 gap-y-2">
                  <span>{itinerary.length} stops</span>
                  <span>•</span>
                  <span>{selectedCities.length} cities</span>
                  <span>•</span>
                  <span>{itinerary.length > 0 ? itinerary.reduce((max, item) => Math.max(max, item.day), 0) : 0} AI Predicted Days</span>
                  <span>•</span>
                  <span>Excludes personal accommodation & meals</span>
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center mt-6">
            <button onClick={() => setStep(2)} className="px-8 py-3 border border-orange-300 rounded-full font-bold hover:bg-orange-50 transition">Back</button>
            <button onClick={() => { setStep(1); setItinerary([]); setFeasibility(null); setSelectedCities([]); setSelectedPlaces([]); setSelectedGuides({}); setCityPlaces({}); }}
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-10 py-3 rounded-full font-bold hover:from-red-700 hover:to-orange-700 transition shadow-lg">
              New Journey Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function PlannerContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'city';
  const initialCity = searchParams.get('city') || '';
  const [activeMode, setActiveMode] = useState<'city' | 'journey'>(mode === 'journey' ? 'journey' : 'city');

  return (
    <div className="max-w-6xl mx-auto py-8 text-orange-950">
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-yellow-400 p-8 text-white mb-8 shadow-md">
        <h1 className="text-4xl md:text-5xl font-black text-center">SwadeshiYatra Planner</h1>
        <p className="text-center mt-2 text-white/90">Discover India like never before — city guides, routes, itineraries & costs</p>
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={() => setActiveMode('city')}
            className={`px-6 py-3 rounded-full font-bold transition ${activeMode === 'city' ? 'bg-white text-red-600' : 'bg-white/20 text-white hover:bg-white/30'}`}>
            🏛️ City Planner
          </button>
          <button onClick={() => setActiveMode('journey')}
            className={`px-6 py-3 rounded-full font-bold transition ${activeMode === 'journey' ? 'bg-white text-red-600' : 'bg-white/20 text-white hover:bg-white/30'}`}>
            🗺️ Journey Planner
          </button>
        </div>
      </div>
      {activeMode === 'city' && <CityPlannerMode key={initialCity} initialCity={initialCity} />}
      {activeMode === 'journey' && <JourneyPlannerMode />}
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] text-center">
        <div>
          <div className="text-5xl animate-bounce mb-4">🇮🇳</div>
          <p className="text-xl font-bold text-red-700">Loading planner...</p>
        </div>
      </div>
    }>
      <PlannerContent />
    </Suspense>
  );
}
