const Bottleneck = require("bottleneck/es5");
const axios = require("axios")
class WikipediaService {
    constructor(){
    this.wikiLimiter = new Bottleneck({
        minTime: 500
    });
    this.cityCache = new Map()
    }
async  getCityDescription(city) {
  if (this.cityCache.has(city)) return this.cityCache.get(city);

  try {
    const response = await this.wikiLimiter.schedule(() =>
      axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`)
    );

    if (response.data && response.data.extract) {
      const description = response.data.extract;
      this.cityCache.set(city, description);
      return description;
    }
  } catch (err) {
    console.warn(`Wiki lookup failed for ${city}: ${err.message}`);
     return null;
  }
  return "Description not available.";
}
}

module.exports = new WikipediaService();