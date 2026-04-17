import fs from 'fs';
import path from 'path';

type CacheEntry<T> = {
  value: T;
  expiry: number;
};

class PersistentCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheFilePath: string;

  constructor() {
    // In dev, save to a local file so the cache survives server restarts/auto-reloads
    this.cacheFilePath = path.join(process.cwd(), '.gemini-cache.json');
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf-8'));
        this.cache = new Map(Object.entries(data));
        console.log(`[Cache] Loaded ${this.cache.size} entries from disk.`);
      }
    } catch (e) {
      console.warn('[Cache] Could not load cache from disk:', e);
    }
  }

  private saveToDisk() {
    try {
      const data = Object.fromEntries(this.cache);
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn('[Cache] Could not save cache to disk:', e);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.saveToDisk();
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
    this.saveToDisk();
  }

  clear(): void {
    this.cache.clear();
    this.saveToDisk();
  }
}

// Global instance to persist across HMR reloads
export const apiCache = new PersistentCache();
