function normalizeKey(name) {
  return name
    .trim()
    .normalize("NFD") // split accents (é → e +  ́)
    .replace(/\p{Diacritic}/gu, "") // remove accents
    .replace(/\s+/g, " ") // collapse spaces
    .toLowerCase();
}

module.exports.normalizeKey = normalizeKey