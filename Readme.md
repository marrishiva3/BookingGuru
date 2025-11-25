# 🌆 City Pollution Data Cleaning – Approach

This project processes raw pollution data and produces a **clean, deduplicated, validated, and enriched list of cities** ranked by pollution level.  
The main logic is implemented in the `cleanCities` function.

---

## 🛠 My Approach

When dealing with open pollution datasets, raw city names often contain **duplicates, noise, or non-city entries** (like “Station 12”, “N/A”, “Industrial Plant”).  
To ensure clean and meaningful results, my approach applies the following **multi-stage pipeline**:

---

### 1. **Input Validation**

- Skip rows without a `name`.
- Skip rows with invalid or non-numeric `pollution` values.
- This ensures only meaningful records are processed further.

---

### 2. **Normalization**

- Trim spaces from the name.
- Convert to lowercase.
- Remove diacritics (e.g., `"Kraków"` → `"krakow"`).
- Normalize multiple spaces into single spaces.  
  👉 This step guarantees consistent city keys for deduplication.

---

### 3. **Filtering Rules**

- **Invalid Tokens** → Remove placeholders like `na`, `n/a`, `null`, `undefined`,`unknown`.
- **Non-City Keywords** → Remove entries containing `"station"`, `"powerplant"`, `"factory"`, etc.
- **Regex Validation** → Allow only names with letters, spaces, apostrophes, and hyphens (`2–64` chars).  
  👉 At this stage, only valid city-like names survive.

---

### 4. **Deduplication with Priority**

- Use a **Map (`seen`)** keyed by city name.
- If multiple records exist for the same city, **keep the one with the highest pollution**.  
  👉 Prevents duplication and ensures the “worst pollution case” is captured.

---

### 5. **Wikipedia Enrichment**

- For each valid city, fetch a **short description** from Wikipedia via `wikipediaService`.
- This provides **contextual information** alongside raw pollution numbers.  
  👉 Example: `"Warsaw"` → `"Warsaw is the capital and largest city of Poland."`

---

### 6. **Sorting**

- Convert the `seen` map into an array.
- Sort cities in **descending order by pollution**.  
  👉 The output highlights the most polluted cities at the top.

## 📦 Installation

1. **Clone the repository**:

```bash
git clone https://github.com/marrishiva3/BookingGuru.git
cd bookinguru
```

2. **Install dependencies**:

```bash
npm install
```

---

## ▶️ Running the Project

Start the server:

```bash
npm start
```

The server runs using `app.js`. You can now access the API at:

```
GET http://localhost:3000/cities?country=COUNTRY_NAME&page=1
```

- `country` (required): Name of the country
- `page` (optional, default = 1): Page number

The API returns **paginated, cleaned, and enriched city pollution data**.

This is for Test 
This change is from Dev branch---
