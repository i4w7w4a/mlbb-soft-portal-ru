import assert from "node:assert/strict";
import test from "node:test";

import {
  extractRemoteHeroDetail,
  extractRemoteHeroLinks,
  normalizeImportedHero,
  normalizeLaneLabel,
  type RawHeroSeed,
} from "@/lib/content/import-heroes";

const heroListHtml = `
  <main>
    <a href="/heroes/109?rank_filter=Mythical%20Glory%20Plus">
      <img alt="Aamon" src="/_next/image?url=https%3A%2F%2Fback.mlbb.gg%2Fstorage%2Faamon.webp&w=384&q=75" />
      <h3>Aamon</h3>
    </a>
    <a href="/heroes/109?rank_filter=Mythical%20Glory%20Plus">
      <h3>Aamon</h3>
    </a>
    <a href="/heroes/115?rank_filter=Mythical%20Glory%20Plus">
      <img alt="Xavier" src="/_next/image?url=https%3A%2F%2Fback.mlbb.gg%2Fstorage%2Fxavier.webp&w=384&q=75" />
      <h3>Xavier</h3>
    </a>
  </main>
`;

const heroDetailHtml = `
  <html>
    <head>
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "VideoGame",
          "name": "Aamon - Mobile Legends: Bang Bang",
          "description": "Aamon is a Assassin hero in Mobile Legends specializing in Chase/Burst. Currently in S tier.",
          "image": "https://back.mlbb.gg/storage/heroes/aamon.webp",
          "mainEntity": {
            "additionalProperty": [
              { "@type": "PropertyValue", "name": "Main Lane", "value": "Jungle" }
            ]
          }
        }
      </script>
    </head>
    <body>
      <div style="background-image:url(https://back.mlbb.gg/storage/hero_backgrounds/aamon-card.webp)">
        <header>
          <div style="border-color:#B03E3E">
            <img
              alt="Aamon hero portrait - Assassin in Jungle"
              src="/_next/image?url=https%3A%2F%2Fback.mlbb.gg%2Fstorage%2Fheroes%2Faamon-avatar.webp&w=256&q=75"
            />
          </div>
          <div>
            <h1>Aamon</h1>
            <span>Assassin</span>
            <span>•</span>
            <span>Jungle</span>
            <span>Chase</span>
          </div>
        </header>
      </div>
    </body>
  </html>
`;

test("extractRemoteHeroLinks returns de-duplicated hero entries", () => {
  const links = extractRemoteHeroLinks(heroListHtml);

  assert.equal(links.length, 2);
  assert.deepEqual(
    links.map((link) => link.slug),
    ["aamon", "xavier"],
  );
  assert.equal(
    links[0]?.remoteUrl,
    "https://mlbb.gg/heroes/109?rank_filter=Mythical+Glory+Plus",
  );
});

test("extractRemoteHeroDetail parses structured hero data and visual metadata", () => {
  const detail = extractRemoteHeroDetail(heroDetailHtml);

  assert.equal(detail.name, "Aamon");
  assert.deepEqual(detail.role, ["Assassin"]);
  assert.deepEqual(detail.lane, ["Jungle"]);
  assert.deepEqual(detail.specialty, ["Chase", "Burst"]);
  assert.equal(
    detail.avatarUrl,
    "https://back.mlbb.gg/storage/heroes/aamon-avatar.webp",
  );
  assert.equal(
    detail.backgroundUrl,
    "https://back.mlbb.gg/storage/hero_backgrounds/aamon-card.webp",
  );
  assert.equal(detail.accent, "#B03E3E");
});

test("normalizeLaneLabel handles MLBB lane labels consistently", () => {
  assert.equal(normalizeLaneLabel("Gold Lane"), "Gold");
  assert.equal(normalizeLaneLabel("Exp Lane"), "EXP");
  assert.equal(normalizeLaneLabel("Roaming"), "Roam");
  assert.equal(normalizeLaneLabel("Mid"), "Mid");
});

test("normalizeImportedHero uses fallback titles and preserves imported specialties", () => {
  const importedHero: RawHeroSeed = {
    slug: "aamon",
    name: "Aamon",
    role: ["Assassin"],
    lane: ["Jungle"],
    specialty: ["Chase", "Burst"],
    description: "Aamon is a Assassin hero in Mobile Legends specializing in Chase/Burst.",
    remotePath: "/heroes/109",
  };

  const normalized = normalizeImportedHero(importedHero, {
    slug: "aamon",
    name: "Aamon",
    title: "Duke of Shards",
    role: ["Assassin"],
    lane: ["Jungle"],
    specialty: ["Burst"],
  });

  assert.equal(normalized.hero.title, "Duke of Shards");
  assert.deepEqual(normalized.hero.specialty, ["Chase", "Burst"]);
  assert.equal(normalized.hero.difficulty, "High");
  assert.ok(
    normalized.hero.excerpt.startsWith(
      "Aamon is a Assassin hero in Mobile Legends specializing in Chase/Burst",
    ),
  );
  assert.equal(
    normalized.diagnostics.some((diagnostic) => diagnostic.code === "title_missing"),
    false,
  );
});
