const axios = require("axios");
const Bottleneck = require("bottleneck/es5");
const { normalizeKey } = require("../utills/normalizers");
const wikipediaService = require("./wikipedia.service");

// List of invalid tokens (used to filter out invalid city names)
const INVALID_TOKENS = new Set(['na','n/a','null','none','unknown','undefined']);

// Regex: allows only alphabets, spaces, hyphens, apostrophes, and periods (2–64 chars)
const CITY_REGEX = /^[a-zA-Z\s\-'.]{2,64}$/;

// Keywords that indicate non-city entities (factories, stations, etc.)
const NON_CITY_KEYWORDS = ['station', 'powerplant', 'plant', 'factory', 'industrial'];

class CityService {
  constructor() {
    this.axios = axios;

    // Cache results per country to avoid repeated API calls
    this.map = new Map();

    // Rate limiter (2 sec delay between requests to avoid hitting API limits)
    this.limitter = new Bottleneck({
      minTime: 2000
    });
  }

  /**
   * Get paginated list of polluted cities for a given country
   * - First checks in local cache (`this.map`)
   * - If cache miss, fetches cities from API, cleans them, caches them
   * - Returns paginated response
   */
  async getCities(req) {
    try {
      const respObj = {};
      const poluteCities = this.map.get(req.query.country);

      if (poluteCities) {
        // ✅ Use cached data
        respObj["total"] = poluteCities.length;
        respObj["limit"] = 10;
        respObj["page"] = parseInt(req.query.page) || 1;

        // Pagination logic
        let start = (respObj["page"] - 1) * respObj["limit"];
        start = respObj["total"] < start ? 0 : start;
        let end = respObj["page"] * respObj["limit"];

        respObj["cities"] = poluteCities.slice(start, end);
        return respObj;

      } else {
        // Cache miss → Fetch & clean cities
        let data = await this.getfetchAllcities(req.query.country);
        const cleanCities = await this.cleanCities(data);

        respObj["total"] = cleanCities.length;
        respObj["limit"] = 10;
        respObj["page"] = parseInt(req.query.page) || 1;

        // Pagination logic
        let start = (respObj["page"] - 1) * respObj["limit"];
        start = respObj["total"] < start ? 0 : start;
        let end = respObj["page"] * respObj["limit"];

        respObj["cities"] = cleanCities.slice(start, end);

        // Save cleaned results to cache
        this.map.set(req.query.country, cleanCities);
      }

      return respObj;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Cleans raw city data:
   * - Normalizes city names (lowercase, remove diacritics, trim spaces)
   * - Skips invalid tokens / non-city keywords
   * - Ensures valid city names (via regex)
   * - Keeps the record with highest pollution per city
   * - Adds Wikipedia description for each city
   * - Returns list sorted by pollution (desc)
   */
  async cleanCities(rawCities) {
    const seen = new Map();
    let cleaned = [];

    for (const row of rawCities) {
      if (!row.name || !Number.isFinite(Number(row.pollution))) continue;

      let cityName = row.name.trim();

      // Normalize name (lowercase, remove accents, normalize spaces)
      row.name = normalizeKey(cityName);

      // Skip invalid tokens
      if (INVALID_TOKENS.has(row.name)) continue;

      // Skip non-city keywords or too short names
      if (NON_CITY_KEYWORDS.some(k => row.name.includes(k)) || row.name.length < 3) continue;

      // Validate format using regex
      if (!CITY_REGEX.test(row.name)) continue;

      // Keep the record with the highest pollution
      const existing = seen.get(row.name);
      if (!existing || row.pollution > existing.pollution) {
        seen.set(row.name, {
          name: row.name.trim(),
          pollution: row.pollution,
          description: await wikipediaService.getCityDescription(row.name)
        });
      }
    }

    // Sort cities by pollution (descending)
    cleaned = Array.from(seen.values()).sort((a, b) => b.pollution - a.pollution);
    return cleaned;
  }

  /**
   * Fetches *all* cities for a given country from external API.
   * - Uses pagination (50 per page)
   * - Stops when no more results
   * - Uses Bottleneck to respect rate limits
   */
  async getfetchAllcities(country) {
    let page = 1;
    let allCities = [];
    let limit = 50;

    while (true) {
      try {
        const { data } = await this.limitter.schedule(async () =>
          this.axios.get("https://be-recruitment-task.onrender.com/pollution", {
            params: { page, limit, country },
            headers: { Authorization: await this.getAuthorizationKey() }
          })
        );

        if (!data || data.results.length === 0) break;

        allCities = allCities.concat(data.results);
        page++;
      } catch (error) {
        console.error("Pagination fetch failed:", error.message);
        break;
      }
    }
    return allCities;
  }

  /**
   * Gets authorization key (JWT token) from API
   * - Sends login request with username/password
   * - Returns Bearer token
   */
  async getAuthorizationKey() {
    let tokenInfo = await this.axios.post("https://be-recruitment-task.onrender.com/auth/login", {
      "username": "testuser",
      "password": "testpass"
    });
    return "Bearer " + tokenInfo.data.token;
  }
}

module.exports = new CityService();
