#!/usr/bin/env node
/**
 * Generate Star Wars template data for the public TerminusDB data server.
 *
 * HISTORICAL ARTIFACT: This script was used once to generate the initial
 * dataset from SWAPI. The committed templates/star-wars/data.json is now
 * the source of truth (enriched with side, faction, quote, died_in_film
 * fields that SWAPI does not provide). Do NOT re-run this script — it would
 * overwrite the enriched static data.
 *
 * For data updates, edit templates/star-wars/data.json directly.
 *
 * Original usage:
 *   node scripts/generate-star-wars-data.mjs
 *
 * Outputs:
 *   templates/star-wars/schema.json
 *   templates/star-wars/data.json
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = resolve(__dirname, "../templates/star-wars");

// SWAPI endpoints — try primary, fall back to mirror
const SWAPI_PRIMARY = "https://swapi.dev/api";
const SWAPI_FALLBACK = "https://swapi.py4e.com/api";

let baseUrl = SWAPI_PRIMARY;

// --- Utilities ---

/**
 * Encode a value for use in a TerminusDB Lexical key @id.
 *
 * TerminusDB uses SWI-Prolog's uri_encoded(segment, ...) which keeps:
 *   unreserved: A-Z a-z 0-9 - . _ ~
 *   sub-delims: ! $ & ' ( ) * + , ; =
 *   plus: : @
 * Everything else is percent-encoded (e.g., spaces -> %20).
 * Then literal '+' is replaced with '%2B'.
 *
 * JavaScript's encodeURIComponent over-encodes (it encodes & @ : etc.),
 * so we decode the chars that SWI-Prolog's segment encoding preserves.
 */
function encodeLexicalField(value) {
  const encoded = encodeURIComponent(String(value))
    .replace(/%21/g, "!")
    .replace(/%24/g, "$")
    .replace(/%26/g, "&")
    .replace(/%27/g, "'")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%2A/g, "*")
    .replace(/%2B/g, "+")
    .replace(/%2C/g, ",")
    .replace(/%3B/g, ";")
    .replace(/%3D/g, "=")
    .replace(/%3A/g, ":")
    .replace(/%40/g, "@");
  // TerminusDB then replaces literal '+' with '%2B'
  return encoded.replace(/\+/g, "%2B");
}

function makeId(type, name) {
  return `terminusdb:///data/${type}/${encodeLexicalField(name)}`;
}

// Extract the SWAPI numeric ID from a URL like https://swapi.dev/api/people/1/
function swapiIdFromUrl(url) {
  const match = url.match(/\/(\d+)\/$/);
  return match ? parseInt(match[1], 10) : null;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.json();
}

async function fetchWithFallback(path) {
  try {
    return await fetchJson(`${baseUrl}${path}`);
  } catch (err) {
    if (baseUrl === SWAPI_PRIMARY) {
      console.warn(`Primary SWAPI failed (${err.message}), trying fallback...`);
      baseUrl = SWAPI_FALLBACK;
      return await fetchJson(`${baseUrl}${path}`);
    }
    throw err;
  }
}

async function fetchAllPages(path, maxItems) {
  const results = [];
  let url = path;
  while (url && results.length < maxItems) {
    const data = await fetchWithFallback(url);
    results.push(...data.results);
    // Next page — convert absolute URL to relative path
    if (data.next) {
      url = data.next.replace(/https?:\/\/[^/]+\/api/, "");
    } else {
      url = null;
    }
  }
  return results.slice(0, maxItems);
}

// --- Fetch SWAPI data ---

async function fetchSwapiData() {
  console.log("Fetching people (first 20)...");
  const people = await fetchAllPages("/people/", 20);

  console.log("Fetching films (all 6)...");
  const films = await fetchAllPages("/films/", 10);

  console.log("Fetching planets (first 15)...");
  const planets = await fetchAllPages("/planets/", 15);

  console.log("Fetching species (first 10)...");
  const species = await fetchAllPages("/species/", 10);

  return { people, films, planets, species };
}

// --- Build lookup maps (SWAPI URL → @id) ---

function buildLookups(data) {
  const lookup = {};

  for (const p of data.planets) {
    lookup[p.url] = makeId("Planet", p.name);
  }
  for (const f of data.films) {
    lookup[f.url] = makeId("Film", f.title);
  }
  for (const s of data.species) {
    lookup[s.url] = makeId("Species", s.name);
  }
  for (const p of data.people) {
    lookup[p.url] = makeId("Person", p.name);
  }

  return lookup;
}

// Resolve a SWAPI URL to a @id, or null if not in our dataset
function resolveRef(url, lookup) {
  if (!url || url === "unknown" || url === "n/a") return null;
  return lookup[url] || null;
}

// Resolve an array of SWAPI URLs to @id references (filtering out unknowns)
function resolveRefs(urls, lookup) {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.map(u => resolveRef(u, lookup)).filter(Boolean);
}

// Parse a numeric value, returning null if "unknown" or "n/a"
function parseNum(val) {
  if (!val || val === "unknown" || val === "n/a" || val === "none" || val === "indefinite") {
    return null;
  }
  // Remove commas from numbers like "1,000,000"
  const cleaned = val.toString().replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// --- Convert to TerminusDB documents ---

function convertPeople(people, lookup) {
  return people.map(p => {
    const doc = {
      "@id": makeId("Person", p.name),
      "@type": "Person",
      "name": p.name,
    };

    const height = parseNum(p.height);
    if (height !== null) doc.height = height;

    const mass = parseNum(p.mass);
    if (mass !== null) doc.mass = mass;

    if (p.hair_color && p.hair_color !== "unknown" && p.hair_color !== "n/a") {
      doc.hair_color = p.hair_color;
    }
    if (p.eye_color && p.eye_color !== "unknown" && p.eye_color !== "n/a") {
      doc.eye_color = p.eye_color;
    }
    if (p.birth_year && p.birth_year !== "unknown") {
      doc.birth_year = p.birth_year;
    }
    if (p.gender && p.gender !== "unknown" && p.gender !== "n/a") {
      doc.gender = p.gender;
    }

    const homeworld = resolveRef(p.homeworld, lookup);
    if (homeworld) doc.homeworld = { "@id": homeworld, "@type": "@id" };

    const films = resolveRefs(p.films, lookup);
    if (films.length > 0) doc.films = films.map(f => ({ "@id": f, "@type": "@id" }));

    const species = resolveRefs(p.species, lookup);
    if (species.length > 0) doc.species = species.map(s => ({ "@id": s, "@type": "@id" }));

    return doc;
  });
}

function convertFilms(films, lookup) {
  return films.map(f => {
    const doc = {
      "@id": makeId("Film", f.title),
      "@type": "Film",
      "title": f.title,
      "episode_id": f.episode_id,
    };

    if (f.opening_crawl) doc.opening_crawl = f.opening_crawl;
    if (f.director) doc.director = f.director;
    if (f.producer) doc.producer = f.producer;
    if (f.release_date) doc.release_date = f.release_date;

    const characters = resolveRefs(f.characters, lookup);
    if (characters.length > 0) doc.characters = characters.map(c => ({ "@id": c, "@type": "@id" }));

    const planets = resolveRefs(f.planets, lookup);
    if (planets.length > 0) doc.planets = planets.map(p => ({ "@id": p, "@type": "@id" }));

    const species = resolveRefs(f.species, lookup);
    if (species.length > 0) doc.species = species.map(s => ({ "@id": s, "@type": "@id" }));

    return doc;
  });
}

function convertPlanets(planets, lookup) {
  return planets.map(p => {
    const doc = {
      "@id": makeId("Planet", p.name),
      "@type": "Planet",
      "name": p.name,
    };

    const rotationPeriod = parseNum(p.rotation_period);
    if (rotationPeriod !== null) doc.rotation_period = rotationPeriod;

    const orbitalPeriod = parseNum(p.orbital_period);
    if (orbitalPeriod !== null) doc.orbital_period = orbitalPeriod;

    const diameter = parseNum(p.diameter);
    if (diameter !== null) doc.diameter = diameter;

    if (p.climate && p.climate !== "unknown") doc.climate = p.climate;
    if (p.gravity && p.gravity !== "unknown" && p.gravity !== "N/A") doc.gravity = p.gravity;
    if (p.terrain && p.terrain !== "unknown") doc.terrain = p.terrain;

    const population = parseNum(p.population);
    if (population !== null) doc.population = population;

    return doc;
  });
}

function convertSpecies(species, lookup) {
  return species.map(s => {
    const doc = {
      "@id": makeId("Species", s.name),
      "@type": "Species",
      "name": s.name,
    };

    if (s.classification && s.classification !== "unknown") doc.classification = s.classification;
    if (s.designation && s.designation !== "unknown") doc.designation = s.designation;

    const avgHeight = parseNum(s.average_height);
    if (avgHeight !== null) doc.average_height = avgHeight;

    if (s.skin_colors && s.skin_colors !== "unknown") doc.skin_colors = s.skin_colors;
    if (s.hair_colors && s.hair_colors !== "unknown") doc.hair_colors = s.hair_colors;
    if (s.eye_colors && s.eye_colors !== "unknown") doc.eye_colors = s.eye_colors;
    if (s.average_lifespan && s.average_lifespan !== "unknown" && s.average_lifespan !== "indefinite") {
      doc.average_lifespan = s.average_lifespan;
    }

    const homeworld = resolveRef(s.homeworld, lookup);
    if (homeworld) doc.homeworld = { "@id": homeworld, "@type": "@id" };

    if (s.language && s.language !== "unknown") doc.language = s.language;

    return doc;
  });
}

// --- Schema definition ---

function generateSchema() {
  return [
    {
      "@type": "Class",
      "@id": "Person",
      "@key": { "@type": "Lexical", "@fields": ["name"] },
      "name": "xsd:string",
      "height": { "@type": "Optional", "@class": "xsd:decimal" },
      "mass": { "@type": "Optional", "@class": "xsd:decimal" },
      "hair_color": { "@type": "Optional", "@class": "xsd:string" },
      "eye_color": { "@type": "Optional", "@class": "xsd:string" },
      "birth_year": { "@type": "Optional", "@class": "xsd:string" },
      "gender": { "@type": "Optional", "@class": "xsd:string" },
      "homeworld": { "@type": "Optional", "@class": "Planet" },
      "species": { "@type": "Set", "@class": "Species" },
      "films": { "@type": "Set", "@class": "Film" },
      "side": "xsd:string",
      "faction": { "@type": "Optional", "@class": "xsd:string" },
      "quote": { "@type": "Optional", "@class": "xsd:string" },
      "died_in_film": { "@type": "Optional", "@class": "Film" }
    },
    {
      "@type": "Class",
      "@id": "Planet",
      "@key": { "@type": "Lexical", "@fields": ["name"] },
      "name": "xsd:string",
      "rotation_period": { "@type": "Optional", "@class": "xsd:decimal" },
      "orbital_period": { "@type": "Optional", "@class": "xsd:decimal" },
      "diameter": { "@type": "Optional", "@class": "xsd:decimal" },
      "climate": { "@type": "Optional", "@class": "xsd:string" },
      "gravity": { "@type": "Optional", "@class": "xsd:string" },
      "terrain": { "@type": "Optional", "@class": "xsd:string" },
      "population": { "@type": "Optional", "@class": "xsd:decimal" }
    },
    {
      "@type": "Class",
      "@id": "Film",
      "@key": { "@type": "Lexical", "@fields": ["title"] },
      "title": "xsd:string",
      "episode_id": "xsd:integer",
      "opening_crawl": { "@type": "Optional", "@class": "xsd:string" },
      "director": { "@type": "Optional", "@class": "xsd:string" },
      "producer": { "@type": "Optional", "@class": "xsd:string" },
      "release_date": { "@type": "Optional", "@class": "xsd:string" },
      "characters": { "@type": "Set", "@class": "Person" },
      "planets": { "@type": "Set", "@class": "Planet" },
      "species": { "@type": "Set", "@class": "Species" }
    },
    {
      "@type": "Class",
      "@id": "Species",
      "@key": { "@type": "Lexical", "@fields": ["name"] },
      "name": "xsd:string",
      "classification": { "@type": "Optional", "@class": "xsd:string" },
      "designation": { "@type": "Optional", "@class": "xsd:string" },
      "average_height": { "@type": "Optional", "@class": "xsd:decimal" },
      "skin_colors": { "@type": "Optional", "@class": "xsd:string" },
      "hair_colors": { "@type": "Optional", "@class": "xsd:string" },
      "eye_colors": { "@type": "Optional", "@class": "xsd:string" },
      "average_lifespan": { "@type": "Optional", "@class": "xsd:string" },
      "homeworld": { "@type": "Optional", "@class": "Planet" },
      "language": { "@type": "Optional", "@class": "xsd:string" }
    }
  ];
}

// --- Main ---

async function main() {
  console.log("=== Star Wars Data Generator for TerminusDB ===\n");

  // Fetch from SWAPI
  const raw = await fetchSwapiData();
  console.log(`\nFetched: ${raw.people.length} people, ${raw.films.length} films, ${raw.planets.length} planets, ${raw.species.length} species\n`);

  // Build lookup table
  const lookup = buildLookups(raw);

  // Convert to TerminusDB documents
  const people = convertPeople(raw.people, lookup);
  const films = convertFilms(raw.films, lookup);
  const planets = convertPlanets(raw.planets, lookup);
  const species = convertSpecies(raw.species, lookup);

  const allDocuments = [...planets, ...species, ...films, ...people];
  console.log(`Generated ${allDocuments.length} documents total`);
  console.log(`  - ${planets.length} planets`);
  console.log(`  - ${species.length} species`);
  console.log(`  - ${films.length} films`);
  console.log(`  - ${people.length} people`);

  // Generate schema
  const schema = generateSchema();

  // Write outputs
  const schemaPath = resolve(TEMPLATE_DIR, "schema.json");
  const dataPath = resolve(TEMPLATE_DIR, "data.json");

  writeFileSync(schemaPath, JSON.stringify(schema, null, 2) + "\n");
  console.log(`\nWrote schema: ${schemaPath}`);

  writeFileSync(dataPath, JSON.stringify(allDocuments, null, 2) + "\n");
  console.log(`Wrote data:   ${dataPath}`);

  console.log("\nDone.");
}

main().catch(err => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
