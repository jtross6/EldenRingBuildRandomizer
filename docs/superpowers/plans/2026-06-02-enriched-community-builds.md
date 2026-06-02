# Enriched Community Builds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich community builds to display full interactive equipment loadouts (armor, shields, talismans, ashes, spells) instead of just weapon names.

**Architecture:** The enriched source data (`data/enriched-community-builds.json`) already contains all equipment fields. The slim pipeline script strips them — we update it to pass them through. A new resolver maps item name strings to data array indices at runtime, enabling interactive `ItemSlot` rendering. The `CommunityBuildView` component is redesigned to show all equipment sections matching the generated build layout.

**Tech Stack:** TypeScript, React, Vite, Tailwind CSS v4

---

## File Structure

| File | Responsibility |
|---|---|
| `data/enriched-community-builds.json` | Source data — rename Magma Blade → Magma Spitter |
| `src/types/community.ts` | `CommunityBuild` interface — add optional equipment fields |
| `scripts/generate-slim-community-builds.ts` | Slim pipeline — pass through new fields |
| `src/data/community-builds.json` | Generated output — regenerated with new fields |
| `src/lib/resolve-community-build.ts` | New file — resolves item name strings to data array entries |
| `src/pages/generate-build.tsx` | `CommunityBuildView` — redesigned with full equipment slots |

---

### Task 1: Rename Magma Blade build in source data

**Files:**
- Modify: `data/enriched-community-builds.json`

- [ ] **Step 1: Update the Magma Blade entry**

Find the build with `"id": "magmablade"` in `data/enriched-community-builds.json` and change:
- `"id": "magmablade"` → `"id": "magmaspitter"`
- `"name": "Magma Blade"` → `"name": "Magma Spitter"`

- [ ] **Step 2: Verify the change**

Run: `grep -A 2 '"magma' data/enriched-community-builds.json`

Expected output should show `"id": "magmaspitter"` and `"name": "Magma Spitter"`.

- [ ] **Step 3: Commit**

```bash
git add data/enriched-community-builds.json
git commit -m "chore: rename Magma Blade build to Magma Spitter"
```

---

### Task 2: Add optional equipment fields to CommunityBuild type

**Files:**
- Modify: `src/types/community.ts`

- [ ] **Step 1: Update the interface**

Replace the entire contents of `src/types/community.ts` with:

```typescript
export interface CommunityBuild {
  id: string;
  name: string;
  weapons: string[];
  primaryStats: string[];
  tags: string[];
  playstyle: string;
  strategy: string;
  sourceUrl: string;
  shield?: string | null;
  armor?: string[];
  talismans?: string[];
  skills?: string[];
  spells?: string[];
  secondaryStats?: string[];
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm build`

Expected: passes with no type errors. All existing code only reads the original fields, so adding optional fields is backwards-compatible.

- [ ] **Step 3: Commit**

```bash
git add src/types/community.ts
git commit -m "feat: add optional equipment fields to CommunityBuild type"
```

---

### Task 3: Update slim pipeline to pass through new fields

**Files:**
- Modify: `scripts/generate-slim-community-builds.ts`

- [ ] **Step 1: Update the EnrichedBuild interface and mapping**

Replace the entire contents of `scripts/generate-slim-community-builds.ts` with:

```typescript
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

interface EnrichedBuild {
  id: string;
  name: string;
  weapons: string[];
  primaryStats: string[];
  secondaryStats?: string[];
  tags: string[];
  playstyle: string;
  strategy: string;
  sourceUrl: string;
  shield?: string | null;
  armor?: string[];
  talismans?: string[];
  skills?: string[];
  spells?: string[];
}

const enriched: EnrichedBuild[] = JSON.parse(
  readFileSync(join(ROOT, "data", "enriched-community-builds.json"), "utf-8"),
);

function nonEmpty<T>(arr: T[] | undefined): T[] | undefined {
  return arr && arr.length > 0 ? arr : undefined;
}

const slim = enriched.map((b) => ({
  id: b.id,
  name: b.name,
  weapons: b.weapons.slice(0, 3),
  primaryStats: b.primaryStats,
  tags: b.tags,
  playstyle: b.playstyle,
  strategy: b.strategy,
  sourceUrl: b.sourceUrl,
  ...(b.shield != null ? { shield: b.shield } : {}),
  ...(nonEmpty(b.armor) ? { armor: b.armor } : {}),
  ...(nonEmpty(b.talismans) ? { talismans: b.talismans } : {}),
  ...(nonEmpty(b.skills) ? { skills: b.skills } : {}),
  ...(nonEmpty(b.spells) ? { spells: b.spells } : {}),
  ...(nonEmpty(b.secondaryStats) ? { secondaryStats: b.secondaryStats } : {}),
}));

writeFileSync(join(ROOT, "src", "data", "community-builds.json"), JSON.stringify(slim) + "\n");
console.log(`Generated ${slim.length} slim community builds -> src/data/community-builds.json`);
```

Key changes from original:
- `EnrichedBuild` interface adds `shield`, `armor`, `talismans`, `skills`, `spells`, `secondaryStats`
- `.map()` spreads in new fields conditionally (omits when undefined/null/empty to keep JSON compact)
- `nonEmpty()` helper filters out empty arrays
- `shield` uses `!= null` check because `null` is a valid value (build explicitly has no shield)

- [ ] **Step 2: Commit**

```bash
git add scripts/generate-slim-community-builds.ts
git commit -m "feat: pass through equipment fields in slim community builds pipeline"
```

---

### Task 4: Regenerate community-builds.json

**Files:**
- Regenerate: `src/data/community-builds.json`

- [ ] **Step 1: Run the slim pipeline**

Run: `npx tsx scripts/generate-slim-community-builds.ts`

Expected output: `Generated 104 slim community builds -> src/data/community-builds.json`

- [ ] **Step 2: Verify new fields are present**

Run: `cat src/data/community-builds.json | python3 -c "import sys,json; data=json.load(sys.stdin); b=[x for x in data if x['id']=='magmaspitter'][0]; print(json.dumps(b, indent=2))"`

Expected: the Magma Spitter build should now include `shield`, `armor`, `talismans`, `skills` fields alongside the existing ones. The `name` field should be `"Magma Spitter"`.

- [ ] **Step 3: Type-check**

Run: `pnpm build`

Expected: passes. The new JSON fields are all optional in `CommunityBuild`, so existing code is unaffected.

- [ ] **Step 4: Commit**

```bash
git add src/data/community-builds.json
git commit -m "chore: regenerate community-builds.json with equipment fields"
```

---

### Task 5: Create resolveCommunityBuild utility

**Files:**
- Create: `src/lib/resolve-community-build.ts`

- [ ] **Step 1: Create the resolver module**

Create `src/lib/resolve-community-build.ts` with the following contents:

```typescript
import type { CommunityBuild } from "../types/community";
import type { ItemCategory } from "../components/icons/item-icons";
import {
  weapons,
  shields,
  staves,
  seals,
  armorHead,
  armorBody,
  armorArms,
  armorLegs,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";

export interface ResolvedItem {
  name: string;
  index: number;
  category: ItemCategory;
}

export interface ResolvedCommunityBuild {
  armament: ResolvedItem[];
  staves: ResolvedItem[];
  seals: ResolvedItem[];
  shield: ResolvedItem | null;
  armor: ResolvedItem[];
  talismans: ResolvedItem[];
  ashesOfWar: ResolvedItem[];
  sorceries: ResolvedItem[];
  incantations: ResolvedItem[];
}

function normalize(name: string): string {
  return name
    .replace(/\s*\((?:Spell|Skill)\)\s*$/i, "")
    .replace(/^Ash of War:\s*/i, "")
    .replace(/^Ash of War\s+/i, "")
    .replace(/[,]/g, "")
    .toLowerCase()
    .trim();
}

function findByName<T extends { name: string }>(
  arr: readonly T[],
  name: string,
): number {
  const norm = normalize(name);
  return arr.findIndex((item) => normalize(item.name) === norm);
}

function resolveWeapons(
  names: string[],
): { armament: ResolvedItem[]; staves: ResolvedItem[]; seals: ResolvedItem[] } {
  const armament: ResolvedItem[] = [];
  const resolvedStaves: ResolvedItem[] = [];
  const resolvedSeals: ResolvedItem[] = [];

  for (const name of names) {
    const weaponIdx = findByName(weapons, name);
    if (weaponIdx >= 0) {
      armament.push({ name: weapons[weaponIdx].name, index: weaponIdx, category: "weapon" });
      continue;
    }

    const staffIdx = findByName(staves, name);
    if (staffIdx >= 0) {
      resolvedStaves.push({ name: staves[staffIdx].name, index: staffIdx, category: "staff" });
      continue;
    }

    const sealIdx = findByName(seals, name);
    if (sealIdx >= 0) {
      resolvedSeals.push({ name: seals[sealIdx].name, index: sealIdx, category: "seal" });
    }
  }

  return { armament, staves: resolvedStaves, seals: resolvedSeals };
}

function resolveShield(name: string | null | undefined): ResolvedItem | null {
  if (!name) return null;
  const idx = findByName(shields, name);
  if (idx < 0) return null;
  return { name: shields[idx].name, index: idx, category: "shield" };
}

const ARMOR_ARRAYS = [armorHead, armorBody, armorArms, armorLegs] as const;
const ARMOR_LABELS = ["Helm", "Chest Armor", "Gauntlets", "Leg Armor"] as const;

function resolveArmor(names: string[] | undefined): ResolvedItem[] {
  if (!names) return [];
  const resolved: ResolvedItem[] = [];
  for (let i = 0; i < names.length && i < ARMOR_ARRAYS.length; i++) {
    const idx = findByName(ARMOR_ARRAYS[i], names[i]);
    if (idx >= 0) {
      resolved.push({ name: ARMOR_ARRAYS[i][idx].name, index: idx, category: "armor" });
    }
  }
  return resolved;
}

function resolveTalismans(names: string[] | undefined): ResolvedItem[] {
  if (!names) return [];
  const resolved: ResolvedItem[] = [];
  for (const name of names) {
    if (resolved.length >= 4) break;
    const idx = findByName(talismans, name);
    if (idx >= 0) {
      resolved.push({ name: talismans[idx].name, index: idx, category: "talisman" });
    }
  }
  return resolved;
}

function resolveSkills(names: string[] | undefined): ResolvedItem[] {
  if (!names) return [];
  const resolved: ResolvedItem[] = [];
  for (const name of names) {
    const idx = findByName(ashesOfWar, name);
    if (idx >= 0) {
      resolved.push({ name: ashesOfWar[idx].name, index: idx, category: "ash" });
    }
  }
  return resolved;
}

function resolveSpells(
  names: string[] | undefined,
): { sorceries: ResolvedItem[]; incantations: ResolvedItem[] } {
  if (!names) return { sorceries: [], incantations: [] };
  const resolvedSorceries: ResolvedItem[] = [];
  const resolvedIncantations: ResolvedItem[] = [];

  for (const name of names) {
    const sorcIdx = findByName(sorceries, name);
    if (sorcIdx >= 0) {
      resolvedSorceries.push({ name: sorceries[sorcIdx].name, index: sorcIdx, category: "spell" });
      continue;
    }

    const incIdx = findByName(incantations, name);
    if (incIdx >= 0) {
      resolvedIncantations.push({
        name: incantations[incIdx].name,
        index: incIdx,
        category: "spell",
      });
    }
  }

  return { sorceries: resolvedSorceries, incantations: resolvedIncantations };
}

export function resolveCommunityBuild(build: CommunityBuild): ResolvedCommunityBuild {
  const { armament, staves: resolvedStaves, seals: resolvedSeals } = resolveWeapons(build.weapons);
  const { sorceries: resolvedSorceries, incantations: resolvedIncantations } = resolveSpells(
    build.spells,
  );

  return {
    armament,
    staves: resolvedStaves,
    seals: resolvedSeals,
    shield: resolveShield(build.shield),
    armor: resolveArmor(build.armor),
    talismans: resolveTalismans(build.talismans),
    ashesOfWar: resolveSkills(build.skills),
    sorceries: resolvedSorceries,
    incantations: resolvedIncantations,
  };
}

export { ARMOR_LABELS };
```

Important implementation details:

- **`normalize()`** handles name mismatches between Fextralife scrape data and the app's data arrays:
  - Strips `(Spell)` and `(Skill)` suffixes (e.g., `"Golden Vow (Spell)"` → `"Golden Vow"`)
  - Strips `Ash of War:` and `Ash of War ` prefixes (e.g., `"Ash of War: Bloody Slash"` → `"Bloody Slash"`)
  - Removes commas (e.g., `"Flame Grant me Strength"` matches `"Flame, Grant Me Strength"`)
  - Case-insensitive via `.toLowerCase()`
- **`findByName()`** normalizes both sides for comparison
- **`resolveWeapons()`** checks `weapons` → `staves` → `seals` in order since the enriched data puts catalysts in the weapons array
- **`resolveTalismans()`** caps at 4 (Fextralife lists alternate talismans beyond the 4 slots)
- **`resolveSkills()`** silently skips weapon skills that don't match any Ash of War
- **`ARMOR_LABELS`** is exported for use by the view component to label armor slots

- [ ] **Step 2: Type-check**

Run: `pnpm build`

Expected: passes with no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/resolve-community-build.ts
git commit -m "feat: add resolveCommunityBuild utility for name-to-index resolution"
```

---

### Task 6: Redesign CommunityBuildView with full equipment slots

**Files:**
- Modify: `src/pages/generate-build.tsx`

- [ ] **Step 1: Add imports**

At the top of `src/pages/generate-build.tsx`, add this import after the existing ones:

```typescript
import {
  resolveCommunityBuild,
  ARMOR_LABELS,
} from "../lib/resolve-community-build";
```

No changes needed to the existing `"../data"` imports — the resolver handles all data array lookups internally.

- [ ] **Step 2: Replace the CommunityBuildView component**

Replace the entire `CommunityBuildView` function (lines 249–314 in the current file) with:

```tsx
function CommunityBuildView({
  pick,
  onSelectItem,
}: {
  pick: CommunityPick;
  onSelectItem: (name: string, category: ItemCategory) => void;
}) {
  const { build } = pick;
  const resolved = resolveCommunityBuild(build);

  return (
    <>
      <BuildIdentity buildName={build.name} />

      <div className="mb-6 rounded-lg border border-border-dark bg-bg-card/50 px-4 py-3">
        <p className="font-display text-[10px] uppercase tracking-[1.5px] text-text-dim">
          {build.playstyle}
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-text-secondary">{build.strategy}</p>
      </div>

      {resolved.armament.length > 0 && (
        <EquipmentSection title="Armament">
          <div className="grid grid-cols-2 gap-2">
            {resolved.armament.map((item, i) => (
              <ItemSlot
                key={`comm-weapon-${i}`}
                itemName={item.name}
                slotId={`comm-weapon-${i}`}
                category="weapon"
                variant="standard"
                onClick={() => onSelectItem(item.name, "weapon")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      {resolved.shield && (
        <EquipmentSection title="Shields">
          <div className="grid gap-2">
            <ItemSlot
              itemName={resolved.shield.name}
              slotLabel="Shield"
              slotId="comm-shield-0"
              category="shield"
              variant="standard"
              onClick={() => onSelectItem(resolved.shield!.name, "shield")}
            />
          </div>
        </EquipmentSection>
      )}

      {resolved.staves.length > 0 && (
        <EquipmentSection title="Staves">
          <div className="grid gap-2">
            {resolved.staves.map((item, i) => (
              <ItemSlot
                key={`comm-staff-${i}`}
                itemName={item.name}
                slotLabel="Staff"
                slotId={`comm-staff-${i}`}
                category="staff"
                variant="standard"
                onClick={() => onSelectItem(item.name, "staff")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      {resolved.seals.length > 0 && (
        <EquipmentSection title="Seals">
          <div className="grid gap-2">
            {resolved.seals.map((item, i) => (
              <ItemSlot
                key={`comm-seal-${i}`}
                itemName={item.name}
                slotLabel="Seal"
                slotId={`comm-seal-${i}`}
                category="seal"
                variant="standard"
                onClick={() => onSelectItem(item.name, "seal")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      {resolved.armor.length > 0 && (
        <EquipmentSection title="Armor">
          <div className="grid grid-cols-2 gap-2">
            {resolved.armor.map((item, i) => (
              <ItemSlot
                key={`comm-armor-${i}`}
                itemName={item.name}
                slotLabel={ARMOR_LABELS[i]}
                slotId={`comm-armor-${i}`}
                category="armor"
                variant="standard"
                onClick={() => onSelectItem(item.name, "armor")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      {resolved.talismans.length > 0 && (
        <EquipmentSection title="Talismans">
          <div className="grid grid-cols-4 gap-2">
            {resolved.talismans.map((item, i) => (
              <ItemSlot
                key={`comm-tal-${i}`}
                itemName={item.name}
                slotId={`comm-tal-${i}`}
                category="talisman"
                variant="talisman"
                onClick={() => onSelectItem(item.name, "talisman")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      {resolved.ashesOfWar.length > 0 && (
        <EquipmentSection title="Ashes of War">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {resolved.ashesOfWar.map((item, i) => (
              <ItemSlot
                key={`comm-ash-${i}`}
                itemName={item.name}
                slotId={`comm-ash-${i}`}
                category="ash"
                variant="compact"
                onClick={() => onSelectItem(item.name, "ash")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      {(resolved.sorceries.length > 0 || resolved.incantations.length > 0) && (
        <EquipmentSection title="Sorceries & Incantations">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {resolved.sorceries.map((item, i) => (
              <ItemSlot
                key={`comm-sorc-${i}`}
                itemName={item.name}
                slotId={`comm-sorc-${i}`}
                category="spell"
                variant="compact"
                onClick={() => onSelectItem(item.name, "spell")}
              />
            ))}
            {resolved.incantations.map((item, i) => (
              <ItemSlot
                key={`comm-incant-${i}`}
                itemName={item.name}
                slotId={`comm-incant-${i}`}
                category="spell"
                variant="compact"
                onClick={() => onSelectItem(item.name, "spell")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      {(build.primaryStats.length > 0 || (build.secondaryStats?.length ?? 0) > 0) && (
        <div className="mb-6 rounded-lg border border-border-dark bg-bg-card/50 px-4 py-3">
          {build.primaryStats.length > 0 && (
            <>
              <div className="font-display text-[10px] uppercase tracking-[1.5px] text-text-dim">
                Primary Stats
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {build.primaryStats.map((stat) => (
                  <span
                    key={stat}
                    className="rounded bg-bg-surface px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wider text-gold-dim"
                  >
                    {stat}
                  </span>
                ))}
              </div>
            </>
          )}
          {(build.secondaryStats?.length ?? 0) > 0 && (
            <>
              <div className="mt-3 font-display text-[10px] uppercase tracking-[1.5px] text-text-dim">
                Secondary Stats
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {build.secondaryStats!.map((stat) => (
                  <span
                    key={stat}
                    className="rounded bg-bg-surface px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wider text-text-dim"
                  >
                    {stat}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mb-6 text-center">
        <a
          href={build.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-display text-[11px] font-semibold uppercase tracking-wider text-gold-dim transition-colors hover:text-gold-light"
        >
          View full guide on Fextralife &#8599;
        </a>
      </div>
    </>
  );
}
```

Key differences from the old `CommunityBuildView`:
- Calls `resolveCommunityBuild(build)` once at the top
- Equipment sections use `resolved.*` arrays of `ResolvedItem` instead of raw strings
- Each section is conditionally rendered (only shown when resolved items exist)
- All slots use the correct `ItemCategory` from the resolved item, enabling proper detail modals
- Armor slots use `ARMOR_LABELS[i]` for slot labels ("Helm", "Chest Armor", "Gauntlets", "Leg Armor")
- Secondary stats shown below primary stats in a separate badge row with dimmer styling
- Layout ordering: strategy card → armament → shield → staves → seals → armor → talismans → ashes → spells → stats → fextralife link

- [ ] **Step 3: Type-check and lint**

Run: `pnpm build && pnpm lint`

Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/generate-build.tsx
git commit -m "feat: redesign CommunityBuildView with full interactive equipment slots"
```

---

### Task 7: Visual verification

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`

- [ ] **Step 2: Navigate to the Magma Spitter build**

1. Open the app in a browser
2. Navigate to `/generate` (Guided Hand / Chaos Forge)
3. Search for "Magma Blade" to trigger Guided Hand
4. The community build "Magma Spitter" should appear in results
5. Click on it to open the community build view

- [ ] **Step 3: Verify all equipment sections render**

Confirm the build view shows:
- Build name: "Magma Spitter"
- Playstyle & strategy text card
- **Armament:** Magma Blade (weapon slot with image)
- **Shields:** One-Eyed Shield (shield slot with image)
- **Seals:** Erdtree Seal (seal slot with image)
- **Armor:** Fire Knight Helm, Fire Knight Armor, Scaled Gauntlets, Scaled Greaves (4 slots in 2x2 grid with slot labels)
- **Talismans:** Talisman of the Dread, Shard of Alexander, Fire Scorpion Charm, Rotten Winged Sword Insignia (4 slots in talisman grid)
- **Primary Stats:** strength, vigor
- **Secondary Stats:** endurance, mind, dexterity
- Fextralife link at bottom

- [ ] **Step 4: Verify slot interactivity**

1. Click on the "Magma Blade" weapon slot → item detail modal should open showing weapon stats and a Guided Hand button
2. Close modal, click on "One-Eyed Shield" → shield detail modal with Guided Hand button
3. Close modal, click on "Fire Knight Helm" → armor detail modal (no Guided Hand button since category is "armor")
4. Close modal, click on a talisman → talisman detail modal with Guided Hand button
5. Close modal, click Guided Hand on any item → should navigate to picks page with that item as seed

- [ ] **Step 5: Verify another community build**

Navigate back and select a different community build (e.g., "Duel Sword Duelist") to verify:
- No shield section (this build has `shield: null`)
- Spells section shows "Golden Vow" and "Flame, Grant Me Strength" (resolved despite name mismatches in source data)
- All other equipment sections render correctly

- [ ] **Step 6: Verify a build with minimal data**

Find a community build that may have fewer equipment fields populated. Confirm it gracefully degrades — sections with no resolved items are simply not shown, no errors or empty sections.
