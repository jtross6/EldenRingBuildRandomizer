# Unified Armament Slots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge weapons, shields, staves, and seals into a unified 3 Right Hand + 3 Left Hand slot model, matching the in-game equipment screen.

**Architecture:** A new `ArmamentRef` type (tagged type + index pair) replaces the separate `weaponsRight`, `weaponsLeft`, `shields`, `staves`, `seals` fields on the Build type. A new `armaments.ts` module provides a unified lookup interface over the four separate data arrays. The codec bumps to version 3 with 10-bit per-slot encoding (2 bits type tag + 8 bits index). All build producers (randomizer, generator, fate generator) and consumers (viewers, codec, resolver) update to the new model.

**Tech Stack:** TypeScript, React, TanStack Router

---

### File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/armaments.ts` | Create | ArmamentType, ArmamentRef, lookup, pool helpers |
| `src/types/build.ts` | Modify | Replace weapon/shield/staff/seal fields with rightHand/leftHand |
| `src/lib/build-codec.ts` | Modify | Version 3 codec with 10-bit armament slot encoding |
| `src/lib/randomizer.ts` | Modify | Generate random builds using ArmamentRef |
| `src/lib/build-generator.ts:102-512` | Modify | fillWeaponsByProfile returns ArmamentRef[], generateBuild uses new Build shape |
| `src/lib/fate/fate-build-generator.ts` | Modify | generateBuildFromFate uses ArmamentRef[] and new Build shape |
| `src/lib/resolve-community-build.ts` | Modify | ResolvedCommunityBuild uses unified rightHand/leftHand |
| `src/pages/build-viewer.tsx` | Modify | Unified Armaments section with 3+3 slots |
| `src/pages/generate-build.tsx` | Modify | Update GeneratedBuildView and CommunityBuildView |
| `src/components/gallery/build-card.tsx:80` | Modify | Use rightHand instead of weaponsRight |

---

### Task 1: Armaments Module and Build Type

**Files:**
- Create: `src/lib/armaments.ts`
- Modify: `src/types/build.ts`

- [ ] **Step 1: Create the armaments module**

Create `src/lib/armaments.ts`:

```ts
import type { Weapon, Shield, Staff, Seal } from "../types/items";
import { weapons, shields, staves, seals } from "../data";

export type ArmamentType = "weapon" | "shield" | "staff" | "seal";

export interface ArmamentRef {
  type: ArmamentType;
  index: number;
}

export type Armament = Weapon | Shield | Staff | Seal;

const DATA_ARRAYS: Record<ArmamentType, readonly Armament[]> = {
  weapon: weapons,
  shield: shields,
  staff: staves,
  seal: seals,
};

export function lookupArmament(ref: ArmamentRef): Armament | undefined {
  return DATA_ARRAYS[ref.type]?.[ref.index];
}

export function armamentName(ref: ArmamentRef): string {
  return lookupArmament(ref)?.name ?? "Unknown";
}

export function armamentCategory(ref: ArmamentRef): ArmamentType {
  return ref.type;
}

export function armamentPoolSize(type: ArmamentType): number {
  return DATA_ARRAYS[type].length;
}

export function allArmamentRefs(type: ArmamentType): ArmamentRef[] {
  return DATA_ARRAYS[type].map((_, index) => ({ type, index }));
}
```

- [ ] **Step 2: Update the Build interface**

Replace the contents of `src/types/build.ts` with:

```ts
import type { ArmamentRef } from "../lib/armaments";

export interface Build {
  buildName?: string;
  buildImage?: string;
  rightHand: ArmamentRef[];
  leftHand: ArmamentRef[];
  helm: number;
  chest: number;
  gauntlets: number;
  legs: number;
  talismans: number[];
  ashesOfWar: number[];
  sorceries: number[];
  incantations: number[];
}
```

- [ ] **Step 3: Verify the type errors surface**

Run: `pnpm build 2>&1 | head -80`

Expected: TypeScript errors in every file that references `weaponsRight`, `weaponsLeft`, `shields`, `staves`, or `seals` on the Build type. This confirms the type change propagated correctly. Do NOT fix them yet — subsequent tasks handle each file.

- [ ] **Step 4: Commit**

```bash
git add src/lib/armaments.ts src/types/build.ts
git commit -m "feat: add ArmamentRef type and update Build interface for unified hand slots"
```

---

### Task 2: Build Codec v3

**Files:**
- Modify: `src/lib/build-codec.ts`

- [ ] **Step 1: Rewrite the codec**

Replace the contents of `src/lib/build-codec.ts` with:

```ts
import type { Build } from "../types/build";
import type { ArmamentRef, ArmamentType } from "./armaments";

const CODEC_VERSION = 3;
const HAND_SLOTS = 3;
const EMPTY_INDEX = 255;

const TYPE_TO_TAG: Record<ArmamentType, number> = {
  weapon: 0,
  shield: 1,
  staff: 2,
  seal: 3,
};

const TAG_TO_TYPE: ArmamentType[] = ["weapon", "shield", "staff", "seal"];

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array | null {
  try {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function encodeHandSlots(refs: ArmamentRef[]): number[] {
  const parts: number[] = [];
  for (let i = 0; i < HAND_SLOTS; i++) {
    const ref = refs[i];
    if (ref) {
      const tag = TYPE_TO_TAG[ref.type];
      // High byte: top 2 bits are type tag, lower 6 bits unused
      // Encode as: (tag << 8) | index — split across two bytes
      const combined = (tag << 8) | (ref.index & 0xff);
      parts.push((combined >> 8) & 0xff);
      parts.push(combined & 0xff);
    } else {
      parts.push(0);
      parts.push(EMPTY_INDEX);
    }
  }
  return parts;
}

function decodeHandSlots(
  readByte: () => number,
): ArmamentRef[] {
  const refs: ArmamentRef[] = [];
  for (let i = 0; i < HAND_SLOTS; i++) {
    const hi = readByte();
    const lo = readByte();
    if (lo === EMPTY_INDEX) continue;
    const tag = hi & 0x03;
    const type = TAG_TO_TYPE[tag];
    if (type) {
      refs.push({ type, index: lo });
    }
  }
  return refs;
}

export function encodeBuild(build: Build): string {
  const parts: number[] = [];

  const flags =
    (build.buildName ? 0x01 : 0) | (build.buildImage ? 0x02 : 0);

  parts.push(CODEC_VERSION);
  parts.push(flags);

  if (build.buildName) {
    const nameBytes = new TextEncoder().encode(build.buildName);
    parts.push(nameBytes.length);
    for (const b of nameBytes) parts.push(b);
  }

  if (build.buildImage) {
    const imgBytes = new TextEncoder().encode(build.buildImage);
    parts.push((imgBytes.length >> 8) & 0xff);
    parts.push(imgBytes.length & 0xff);
    for (const b of imgBytes) parts.push(b);
  }

  // Hand slots: 3 right + 3 left = 12 bytes
  parts.push(...encodeHandSlots(build.rightHand));
  parts.push(...encodeHandSlots(build.leftHand));

  // Armor (4 x uint16)
  function writeIndex(idx: number) {
    parts.push((idx >> 8) & 0xff);
    parts.push(idx & 0xff);
  }

  writeIndex(build.helm);
  writeIndex(build.chest);
  writeIndex(build.gauntlets);
  writeIndex(build.legs);

  // Variable-length arrays
  function writeArray(arr: number[]) {
    parts.push(arr.length);
    for (const idx of arr) {
      parts.push((idx >> 8) & 0xff);
      parts.push(idx & 0xff);
    }
  }

  writeArray(build.talismans);
  writeArray(build.ashesOfWar);
  writeArray(build.sorceries);
  writeArray(build.incantations);

  return toBase64Url(new Uint8Array(parts));
}

export function decodeBuild(encoded: string): Build | null {
  const maybeBytes = fromBase64Url(encoded);
  if (!maybeBytes || maybeBytes.length < 2) return null;
  const bytes = maybeBytes;

  let offset = 0;

  function readByte(): number {
    if (offset >= bytes.length) throw new RangeError();
    return bytes[offset++];
  }

  function readUint16(): number {
    const hi = readByte();
    const lo = readByte();
    return (hi << 8) | lo;
  }

  function readArray(): number[] {
    const count = readByte();
    const arr: number[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(readUint16());
    }
    return arr;
  }

  try {
    const version = readByte();
    if (version !== CODEC_VERSION) return null;

    const flags = readByte();

    let buildName: string | undefined;
    if (flags & 0x01) {
      const nameLen = readByte();
      const nameBytes = bytes.slice(offset, offset + nameLen);
      offset += nameLen;
      buildName = new TextDecoder().decode(nameBytes);
    }

    let buildImage: string | undefined;
    if (flags & 0x02) {
      const imgLen = readUint16();
      const imgBytes = bytes.slice(offset, offset + imgLen);
      offset += imgLen;
      buildImage = new TextDecoder().decode(imgBytes);
    }

    const rightHand = decodeHandSlots(readByte);
    const leftHand = decodeHandSlots(readByte);

    const helm = readUint16();
    const chest = readUint16();
    const gauntlets = readUint16();
    const legs = readUint16();

    const talismans = readArray();
    const ashesOfWar = readArray();
    const sorceries = readArray();
    const incantations = readArray();

    return {
      buildName,
      buildImage,
      rightHand,
      leftHand,
      helm,
      chest,
      gauntlets,
      legs,
      talismans,
      ashesOfWar,
      sorceries,
      incantations,
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/build-codec.ts
git commit -m "feat: build codec v3 with 10-bit armament slot encoding"
```

---

### Task 3: Randomizer

**Files:**
- Modify: `src/lib/randomizer.ts`

- [ ] **Step 1: Update generateRandomBuild**

Replace the contents of `src/lib/randomizer.ts` with:

```ts
import type { Build } from "../types/build";
import type { ArmamentRef, ArmamentType } from "./armaments";
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

function randomIndex(poolSize: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % poolSize;
}

function randomIndices(poolSize: number, count: number): number[] {
  const picked = new Set<number>();
  while (picked.size < Math.min(count, poolSize)) {
    picked.add(randomIndex(poolSize));
  }
  return [...picked];
}

function randomChance(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / 0xffffffff;
}

function randomArmamentRef(type: ArmamentType, poolSize: number): ArmamentRef {
  return { type, index: randomIndex(poolSize) };
}

export function generateRandomBuild(): Build {
  const rightHand: ArmamentRef[] = [];
  const leftHand: ArmamentRef[] = [];

  // 1-3 weapons in right hand
  const rightCount = 1 + randomIndex(3);
  for (let i = 0; i < rightCount; i++) {
    rightHand.push(randomArmamentRef("weapon", weapons.length));
  }

  // 1-3 items in left hand (mix of weapon types)
  const leftCount = 1 + randomIndex(3);
  for (let i = 0; i < leftCount; i++) {
    const roll = randomChance();
    if (roll < 0.5) {
      leftHand.push(randomArmamentRef("weapon", weapons.length));
    } else if (roll < 0.75) {
      leftHand.push(randomArmamentRef("shield", shields.length));
    } else if (roll < 0.875) {
      leftHand.push(randomArmamentRef("staff", staves.length));
    } else {
      leftHand.push(randomArmamentRef("seal", seals.length));
    }
  }

  return {
    rightHand,
    leftHand,
    helm: randomIndex(armorHead.length),
    chest: randomIndex(armorBody.length),
    gauntlets: randomIndex(armorArms.length),
    legs: randomIndex(armorLegs.length),
    talismans: randomIndices(talismans.length, 4),
    ashesOfWar: randomIndices(ashesOfWar.length, 3),
    sorceries: randomIndices(sorceries.length, 4),
    incantations: randomIndices(incantations.length, 4),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/randomizer.ts
git commit -m "feat: randomizer uses unified ArmamentRef hand slots"
```

---

### Task 4: Build Generator

**Files:**
- Modify: `src/lib/build-generator.ts:102-512`

- [ ] **Step 1: Update fillWeaponsByProfile signature and return type**

Change the return type and internal variables of `fillWeaponsByProfile` (line 102-388). Replace the function signature and its opening local variable declarations:

Replace lines 102-125 (the function signature through the local variables) with:

```ts
function fillWeaponsByProfile(
  loadoutProfile: LoadoutProfile,
  seedItems: SeedItem[],
  scoredWeapons: ScoredCandidate<(typeof weapons)[number]>[],
  profile: ReturnType<typeof extractStatProfile>,
  creativity: number,
  rng: SeededRng,
  seedWeaponIndices: Set<number>,
  seedShieldIndices: Set<number>,
  seedStaffIndices: Set<number>,
  seedSealIndices: Set<number>,
): {
  rightHand: ArmamentRef[];
  leftHand: ArmamentRef[];
} {
  const excludeWeapons = new Set(seedWeaponIndices);
  const rightHand: ArmamentRef[] = [];
  const leftHand: ArmamentRef[] = [];
```

Add these imports at the top of the file:

```ts
import type { ArmamentRef } from "./armaments";
```

- [ ] **Step 2: Update each profile case to use ArmamentRef**

For each case in the switch statement, replace direct index pushes with ArmamentRef pushes. The pattern for each line is:

- `weaponsRight.push(someIndex)` → `rightHand.push({ type: "weapon", index: someIndex })`
- `weaponsLeft.push(someIndex)` → `leftHand.push({ type: "weapon", index: someIndex })`
- `shieldIndices.push(someIndex)` → `leftHand.push({ type: "shield", index: someIndex })`
- `staffIndices.push(someIndex)` → `leftHand.push({ type: "staff", index: someIndex })`
- `sealIndices.push(someIndex)` → `leftHand.push({ type: "seal", index: someIndex })`

The return statement (line 387) becomes:

```ts
  return { rightHand, leftHand };
```

Here is the complete updated switch statement for every case. Replace lines 127-387 (from `const seedWeaponList` through the return):

```ts
  const seedWeaponList = seedItems.filter((s) => s.type === "weapon");
  const primarySeedIdx = seedWeaponList[0]?.index ?? -1;

  switch (loadoutProfile) {
    case "Pure Caster": {
      const hasSeedStaff = seedItems.some((s) => s.type === "staff");
      const hasSeedSeal = seedItems.some((s) => s.type === "seal");
      const hasInt = (profile.intelligence ?? 0) >= 0.1;
      const hasFth = (profile.faith ?? 0) >= 0.1;

      if (hasSeedStaff) {
        rightHand.push({ type: "staff", index: seedItems.find((s) => s.type === "staff")!.index });
      } else if (hasInt) {
        const scored = scoreStaves(staves, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedStaffIndices);
        if (pick.length > 0) rightHand.push({ type: "staff", index: pick[0].index });
      }

      if (hasSeedSeal) {
        leftHand.push({ type: "seal", index: seedItems.find((s) => s.type === "seal")!.index });
      } else if (hasFth) {
        const scored = scoreSeals(seals, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedSealIndices);
        if (pick.length > 0) leftHand.push({ type: "seal", index: pick[0].index });
      }
      break;
    }

    case "Spellblade": {
      if (primarySeedIdx >= 0) {
        rightHand.push({ type: "weapon", index: primarySeedIdx });
        excludeWeapons.add(primarySeedIdx);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          rightHand.push({ type: "weapon", index: pick[0].index });
          excludeWeapons.add(pick[0].index);
        }
      }
      const hasInt = (profile.intelligence ?? 0) >= 0.1;
      const hasFth = (profile.faith ?? 0) >= 0.1;

      if (seedItems.some((s) => s.type === "staff")) {
        leftHand.push({ type: "staff", index: seedItems.find((s) => s.type === "staff")!.index });
      } else if (hasInt) {
        const scored = scoreStaves(staves, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedStaffIndices);
        if (pick.length > 0) leftHand.push({ type: "staff", index: pick[0].index });
      }

      if (seedItems.some((s) => s.type === "seal")) {
        leftHand.push({ type: "seal", index: seedItems.find((s) => s.type === "seal")!.index });
      } else if (hasFth) {
        const scored = scoreSeals(seals, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedSealIndices);
        if (pick.length > 0) leftHand.push({ type: "seal", index: pick[0].index });
      }
      break;
    }

    case "Sword & Board": {
      if (primarySeedIdx >= 0) {
        rightHand.push({ type: "weapon", index: primarySeedIdx });
        excludeWeapons.add(primarySeedIdx);
      }
      const neededRight = primarySeedIdx >= 0 ? (rng.next() < 0.4 ? 1 : 0) : 1;
      const additionalRight = pickFromPool(
        scoredWeapons,
        creativity,
        rng,
        neededRight,
        excludeWeapons,
      );
      for (const w of additionalRight) {
        rightHand.push({ type: "weapon", index: w.index });
        excludeWeapons.add(w.index);
      }
      if (rightHand.length === 0) {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          rightHand.push({ type: "weapon", index: pick[0].index });
          excludeWeapons.add(pick[0].index);
        }
      }
      const hasSeedShield = seedItems.some((s) => s.type === "shield");
      if (hasSeedShield) {
        leftHand.push({ type: "shield", index: seedItems.find((s) => s.type === "shield")!.index });
      } else {
        const scoredShields = scoreShields(shields, profile, seedItems);
        const pick = pickFromPool(scoredShields, creativity, rng, 1, seedShieldIndices);
        if (pick.length > 0) leftHand.push({ type: "shield", index: pick[0].index });
      }
      break;
    }

    case "Shield Caster": {
      if (primarySeedIdx >= 0) {
        rightHand.push({ type: "weapon", index: primarySeedIdx });
        excludeWeapons.add(primarySeedIdx);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          rightHand.push({ type: "weapon", index: pick[0].index });
          excludeWeapons.add(pick[0].index);
        }
      }
      const hasSeedShieldSC = seedItems.some((s) => s.type === "shield");
      if (hasSeedShieldSC) {
        leftHand.push({ type: "shield", index: seedItems.find((s) => s.type === "shield")!.index });
      } else {
        const scoredShields = scoreShields(shields, profile, seedItems);
        const pick = pickFromPool(scoredShields, creativity, rng, 1, seedShieldIndices);
        if (pick.length > 0) leftHand.push({ type: "shield", index: pick[0].index });
      }
      const hasIntSC = (profile.intelligence ?? 0) >= 0.1;
      const hasFthSC = (profile.faith ?? 0) >= 0.1;

      if (seedItems.some((s) => s.type === "staff")) {
        rightHand.push({ type: "staff", index: seedItems.find((s) => s.type === "staff")!.index });
      } else if (hasIntSC) {
        const scored = scoreStaves(staves, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedStaffIndices);
        if (pick.length > 0) rightHand.push({ type: "staff", index: pick[0].index });
      }

      if (seedItems.some((s) => s.type === "seal")) {
        rightHand.push({ type: "seal", index: seedItems.find((s) => s.type === "seal")!.index });
      } else if (hasFthSC) {
        const scored = scoreSeals(seals, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedSealIndices);
        if (pick.length > 0) rightHand.push({ type: "seal", index: pick[0].index });
      }
      break;
    }

    case "Two-hander": {
      if (primarySeedIdx >= 0) {
        rightHand.push({ type: "weapon", index: primarySeedIdx });
        excludeWeapons.add(primarySeedIdx);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          rightHand.push({ type: "weapon", index: pick[0].index });
          excludeWeapons.add(pick[0].index);
        }
      }
      break;
    }

    case "Colossal Powerstance": {
      if (primarySeedIdx >= 0) {
        rightHand.push({ type: "weapon", index: primarySeedIdx });
        excludeWeapons.add(primarySeedIdx);
      } else {
        const colossalCandidates = scoredWeapons.filter((c) =>
          ["Colossal Sword", "Colossal Weapon", "Great Hammer", "Greataxe"].includes(
            c.item.category,
          ),
        );
        const pick = pickFromPool(colossalCandidates, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          rightHand.push({ type: "weapon", index: pick[0].index });
          excludeWeapons.add(pick[0].index);
        }
      }
      if (rightHand.length > 0) {
        const category = weapons[rightHand[0].index]?.category;
        if (category) {
          const sameCatCandidates = scoredWeapons.filter((c) => c.item.category === category);
          const pick = pickFromPool(sameCatCandidates, creativity, rng, 1, excludeWeapons);
          if (pick.length > 0) {
            leftHand.push({ type: "weapon", index: pick[0].index });
            excludeWeapons.add(pick[0].index);
          }
        }
      }
      break;
    }

    case "Powerstance": {
      if (primarySeedIdx >= 0) {
        rightHand.push({ type: "weapon", index: primarySeedIdx });
        excludeWeapons.add(primarySeedIdx);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          rightHand.push({ type: "weapon", index: pick[0].index });
          excludeWeapons.add(pick[0].index);
        }
      }
      if (rightHand.length > 0) {
        const category = weapons[rightHand[0].index]?.category;
        if (category) {
          const sameCatCandidates = scoredWeapons.filter((c) => c.item.category === category);
          const pick = pickFromPool(sameCatCandidates, creativity, rng, 1, excludeWeapons);
          if (pick.length > 0) {
            leftHand.push({ type: "weapon", index: pick[0].index });
            excludeWeapons.add(pick[0].index);
          }
        }
      }
      break;
    }

    case "Ranged": {
      if (primarySeedIdx >= 0 && RANGED_CATEGORIES.has(weapons[primarySeedIdx]?.category)) {
        rightHand.push({ type: "weapon", index: primarySeedIdx });
        excludeWeapons.add(primarySeedIdx);
      } else {
        const rangedCandidates = scoredWeapons.filter((c) =>
          RANGED_CATEGORIES.has(c.item.category),
        );
        const pick = pickFromPool(rangedCandidates, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          rightHand.push({ type: "weapon", index: pick[0].index });
          excludeWeapons.add(pick[0].index);
        }
      }
      const meleeCandidates = scoredWeapons.filter((c) => !RANGED_CATEGORIES.has(c.item.category));
      const meleePick = pickFromPool(meleeCandidates, creativity, rng, 1, excludeWeapons);
      if (meleePick.length > 0) {
        leftHand.push({ type: "weapon", index: meleePick[0].index });
        excludeWeapons.add(meleePick[0].index);
      }
      break;
    }

    case "Dual Wield":
    default: {
      if (primarySeedIdx >= 0) {
        rightHand.push({ type: "weapon", index: primarySeedIdx });
        excludeWeapons.add(primarySeedIdx);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          rightHand.push({ type: "weapon", index: pick[0].index });
          excludeWeapons.add(pick[0].index);
        }
      }
      const leftPick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
      if (leftPick.length > 0) {
        leftHand.push({ type: "weapon", index: leftPick[0].index });
        excludeWeapons.add(leftPick[0].index);
      }
      break;
    }
  }

  return { rightHand, leftHand };
```

- [ ] **Step 3: Update generateBuild to use the new return shape**

In the `generateBuild` function (lines 390-512), update the destructuring and Build construction.

Replace line 418 (`const { weaponsRight, weaponsLeft, shieldIndices, staffIndices, sealIndices } =`) and its usage:

```ts
  const { rightHand, leftHand } =
    fillWeaponsByProfile(
      loadoutProfile,
      seedItems,
      scoredWeapons,
      profile,
      creativity,
      rng,
      seedWeaponIndices,
      seedShieldIndices,
      seedStaffIndices,
      seedSealIndices,
    );
```

Update `getWeaponCategories` call (line 446) — extract weapon indices from ArmamentRefs:

```ts
  const allWeaponIndices = [...rightHand, ...leftHand]
    .filter((ref) => ref.type === "weapon")
    .map((ref) => ref.index);
  const allWeaponCategories = getWeaponCategories(seedItems, allWeaponIndices);
```

Update ash count (line 449):

```ts
  const ashCount = Math.max(1, rightHand.length + leftHand.length);
```

Update armor class calculation (lines 485-486) — calculate weight from all armament types:

```ts
  const rightWeapons = rightHand.filter((ref) => ref.type === "weapon");
  const totalWeaponWeight = rightWeapons.reduce(
    (sum, ref) => sum + (weapons[ref.index]?.weight ?? 0),
    0,
  );
  const armorClass = determineArmorClass(
    profile,
    rightWeapons.length > 0 ? totalWeaponWeight / rightWeapons.length : 0,
  );
```

Update the Build object construction (lines 488-503):

```ts
  const build: Build = {
    buildName: generateBuildName(seedItems, profile, damageTypes, rng),
    rightHand,
    leftHand,
    helm: -1,
    chest: -1,
    gauntlets: -1,
    legs: -1,
    talismans: talismanIndices,
    ashesOfWar: ashIndices,
    sorceries: sorceryIndices,
    incantations: incantationIndices,
  };
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/build-generator.ts
git commit -m "feat: build generator uses unified ArmamentRef hand slots"
```

---

### Task 5: Fate Build Generator

**Files:**
- Modify: `src/lib/fate/fate-build-generator.ts`

- [ ] **Step 1: Update generateBuildFromFate**

Add the import at the top of the file:

```ts
import type { ArmamentRef } from "../armaments";
```

Replace the local variable declarations (lines 69-73):

```ts
  const rightHand: ArmamentRef[] = [];
  const leftHand: ArmamentRef[] = [];
  const exclude = new Set<number>();
```

Update each stance case. Replace lines 76-140 (the switch statement):

```ts
  switch (card.stance) {
    case "two-hand": {
      const candidates = filterWeaponsBySubGroup(card.subGroups[0]);
      if (candidates.length > 0) {
        const shuffled = rng.shuffle(candidates);
        rightHand.push({ type: "weapon", index: shuffled[0] });
        exclude.add(shuffled[0]);
      }
      break;
    }
    case "dual-wield": {
      const rightCandidates = filterWeaponsBySubGroup(card.subGroups[0]);
      if (rightCandidates.length > 0) {
        const shuffled = rng.shuffle(rightCandidates);
        rightHand.push({ type: "weapon", index: shuffled[0] });
        exclude.add(shuffled[0]);
      }
      if (card.subGroups[0] === card.subGroups[1]) {
        const remaining = filterWeaponsBySubGroup(card.subGroups[1]).filter((i) => !exclude.has(i));
        if (remaining.length > 0) {
          const shuffled = rng.shuffle(remaining);
          leftHand.push({ type: "weapon", index: shuffled[0] });
          exclude.add(shuffled[0]);
        }
      } else {
        const leftCandidates = filterWeaponsBySubGroup(card.subGroups[1]);
        if (leftCandidates.length > 0) {
          const shuffled = rng.shuffle(leftCandidates);
          leftHand.push({ type: "weapon", index: shuffled[0] });
          exclude.add(shuffled[0]);
        }
      }
      break;
    }
    case "sword-board": {
      const candidates = filterWeaponsBySubGroup(card.subGroups[0]);
      if (candidates.length > 0) {
        const shuffled = rng.shuffle(candidates);
        rightHand.push({ type: "weapon", index: shuffled[0] });
        exclude.add(shuffled[0]);
      }
      const shieldPick = pickRandom(shields, rng, 1);
      if (shieldPick.length > 0) leftHand.push({ type: "shield", index: shieldPick[0] });
      break;
    }
    case "ranged": {
      const candidates = filterWeaponsBySubGroup(card.subGroups[0]);
      if (candidates.length > 0) {
        const shuffled = rng.shuffle(candidates);
        rightHand.push({ type: "weapon", index: shuffled[0] });
        exclude.add(shuffled[0]);
      }
      const meleeWeapons = weapons
        .map((w, i) => ({ w, i }))
        .filter(
          ({ w }) => !["Bow", "Light Bow", "Greatbow", "Crossbow", "Ballista"].includes(w.category),
        )
        .map(({ i }) => i);
      if (meleeWeapons.length > 0) {
        const meleePick = rng.shuffle(meleeWeapons);
        leftHand.push({ type: "weapon", index: meleePick[0] });
      }
      break;
    }
  }
```

Update the staff/seal selection (lines 142-157):

```ts
  if (identityAllowsMagic(card.identity) && card.school) {
    const isSorc = card.school ? isSorcerySchool(card.school) : false;
    if (isSorc) {
      const pool = staves.map((_, i) => i);
      if (pool.length > 0) {
        const shuffled = rng.shuffle(pool);
        leftHand.push({ type: "staff", index: shuffled[0] });
      }
    } else {
      const pool = seals.map((_, i) => i);
      if (pool.length > 0) {
        const shuffled = rng.shuffle(pool);
        leftHand.push({ type: "seal", index: shuffled[0] });
      }
    }
  }
```

Update the ash-of-war section (lines 177-196) — extract weapon indices from ArmamentRefs:

```ts
  const equippedWeaponIndices = [...rightHand, ...leftHand]
    .filter((ref) => ref.type === "weapon")
    .map((ref) => ref.index);
  const targetAffinities = card.primaryStats.flatMap((s) => AFFINITY_BY_STAT[s] ?? []);
  for (const wIdx of equippedWeaponIndices) {
    const w = weapons[wIdx];
    if (!w?.allowAshOfWar) continue;
    const matchingAshes = ashesOfWar
      .map((a, i) => ({ a, i }))
      .filter(({ a }) => {
        if (targetAffinities.length === 0) return true;
        return a.defaultAffinity ? targetAffinities.includes(a.defaultAffinity) : false;
      })
      .map(({ i }) => i);
    if (matchingAshes.length > 0) {
      const shuffled = rng.shuffle(matchingAshes);
      const picked = shuffled[0];
      if (!ashIndices.includes(picked)) ashIndices.push(picked);
    }
    if (ashIndices.length >= 2) break;
  }
```

Update the return statement (lines 203-218):

```ts
  return {
    buildName: card.name,
    rightHand,
    leftHand,
    helm,
    chest,
    gauntlets,
    legs,
    talismans: talismanIndices,
    ashesOfWar: ashIndices,
    sorceries: sorceryIndices,
    incantations: incantationIndices,
  };
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/fate/fate-build-generator.ts
git commit -m "feat: fate build generator uses unified ArmamentRef hand slots"
```

---

### Task 6: Community Build Resolver

**Files:**
- Modify: `src/lib/resolve-community-build.ts`

- [ ] **Step 1: Update ResolvedCommunityBuild and resolver**

The key change: collapse `armament`, `staves`, `seals`, `shield` into `rightHand` and `leftHand` arrays of `ResolvedItem`. Community builds don't have explicit hand assignment in their source data, so all resolved armaments go into `rightHand` (since we don't know the original hand assignment, we just list them in order).

Update the `ResolvedItem` interface to include the armament type, and update `ResolvedCommunityBuild`:

```ts
export interface ResolvedCommunityBuild {
  rightHand: ResolvedItem[];
  leftHand: ResolvedItem[];
  armor: (ResolvedItem | null)[];
  talismans: ResolvedItem[];
  ashesOfWar: ResolvedItem[];
  sorceries: ResolvedItem[];
  incantations: ResolvedItem[];
}
```

Replace the `resolveWeapons` function and `resolveShield` function with a unified `resolveArmaments` function:

```ts
function resolveArmaments(
  weaponNames: string[],
  shieldName: string | null | undefined,
): { rightHand: ResolvedItem[]; leftHand: ResolvedItem[] } {
  const rightHand: ResolvedItem[] = [];
  const leftHand: ResolvedItem[] = [];

  for (const name of weaponNames) {
    const weaponIdx = findByName(weapons, name);
    if (weaponIdx >= 0) {
      rightHand.push({ name: weapons[weaponIdx].name, index: weaponIdx, category: "weapon" });
      continue;
    }

    const staffIdx = findByName(staves, name);
    if (staffIdx >= 0) {
      leftHand.push({ name: staves[staffIdx].name, index: staffIdx, category: "staff" });
      continue;
    }

    const sealIdx = findByName(seals, name);
    if (sealIdx >= 0) {
      leftHand.push({ name: seals[sealIdx].name, index: sealIdx, category: "seal" });
      continue;
    }

    const shieldIdx = findByName(shields, name);
    if (shieldIdx >= 0) {
      leftHand.push({ name: shields[shieldIdx].name, index: shieldIdx, category: "shield" });
    }
  }

  if (shieldName) {
    const idx = findByName(shields, shieldName);
    if (idx >= 0) {
      leftHand.push({ name: shields[idx].name, index: idx, category: "shield" });
    }
  }

  return { rightHand, leftHand };
}
```

Update `resolveCommunityBuild`:

```ts
export function resolveCommunityBuild(build: CommunityBuild): ResolvedCommunityBuild {
  const { rightHand, leftHand } = resolveArmaments(build.weapons, build.shield);
  const { sorceries: resolvedSorceries, incantations: resolvedIncantations } = resolveSpells(
    build.spells,
  );

  return {
    rightHand,
    leftHand,
    armor: resolveArmor(build.armor),
    talismans: resolveTalismans(build.talismans),
    ashesOfWar: resolveSkills(build.skills),
    sorceries: resolvedSorceries,
    incantations: resolvedIncantations,
  };
}
```

Remove the now-unused `resolveShield` function.

- [ ] **Step 2: Commit**

```bash
git add src/lib/resolve-community-build.ts
git commit -m "feat: community build resolver uses unified hand slot model"
```

---

### Task 7: Build Viewer (Chaos Forge)

**Files:**
- Modify: `src/pages/build-viewer.tsx`

- [ ] **Step 1: Update imports and slot rendering**

Add armaments import at the top:

```ts
import { armamentName, type ArmamentRef } from "../lib/armaments";
```

Remove `shields`, `staves`, `seals` from the data import (line 8-10). Keep `weapons` only if it's used elsewhere (check — it's not needed after this change, but `armorHead` etc. still are).

Replace the weapon slot preparation (lines 91-100) with:

```ts
  const HAND_SLOTS = 3;

  function handSlotItems(refs: ArmamentRef[], side: "Right" | "Left") {
    return Array.from({ length: HAND_SLOTS }, (_, i) => {
      const ref = refs[i];
      return {
        ref,
        name: ref ? armamentName(ref) : undefined,
        label: `${side} Hand ${i + 1}`,
        slotId: `${side.toLowerCase()}-${i}`,
        category: ref?.type ?? ("weapon" as const),
      };
    });
  }

  const rightSlots = handSlotItems(build.rightHand, "Right");
  const leftSlots = handSlotItems(build.leftHand, "Left");
```

Replace the entire Armament section and the three separate Shields/Staves/Seals sections (lines 123-229) with:

```tsx
        <EquipmentSection title="Armament">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              {rightSlots.map((s) => (
                <ItemSlot
                  key={s.slotId}
                  itemName={s.name ?? "Empty"}
                  slotLabel={s.label}
                  slotId={s.slotId}
                  category={s.category}
                  variant="standard"
                  isEmpty={!s.ref}
                  onClick={s.ref ? () => selectItem(s.name!, s.category) : undefined}
                />
              ))}
            </div>
            <div className="space-y-2">
              {leftSlots.map((s) => (
                <ItemSlot
                  key={s.slotId}
                  itemName={s.name ?? "Empty"}
                  slotLabel={s.label}
                  slotId={s.slotId}
                  category={s.category}
                  variant="standard"
                  isEmpty={!s.ref}
                  onClick={s.ref ? () => selectItem(s.name!, s.category) : undefined}
                />
              ))}
            </div>
          </div>
        </EquipmentSection>
```

- [ ] **Step 2: Add `isEmpty` prop to ItemSlot**

Open `src/components/equipment/item-slot.tsx` and add an `isEmpty` optional boolean prop. When true, render with reduced opacity.

Add to the props interface:

```ts
  isEmpty?: boolean;
```

In the component's outer `<div>`, add a conditional class:

```ts
className={`... ${props.isEmpty ? "opacity-30" : ""}`}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/build-viewer.tsx src/components/equipment/item-slot.tsx
git commit -m "feat: build viewer renders unified 3+3 armament hand slots"
```

---

### Task 8: Generated & Community Build Views (Guiding Hand)

**Files:**
- Modify: `src/pages/generate-build.tsx`

- [ ] **Step 1: Update GeneratedBuildView**

Add armaments import:

```ts
import { armamentName, type ArmamentRef } from "../lib/armaments";
```

Remove `shields`, `staves`, `seals` from the data import (keep `weapons` only if still referenced elsewhere — after this change it is not).

In `GeneratedBuildView`, replace the Armament section and the three Shields/Staves/Seals sections (lines 81-173) with:

```tsx
      <EquipmentSection title="Armament">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => {
              const ref = build.rightHand[i];
              const name = ref ? armamentName(ref) : "Empty";
              return (
                <ItemSlot
                  key={`gen-right-${i}`}
                  itemName={name}
                  slotLabel={`Right Hand ${i + 1}`}
                  slotId={`gen-right-${i}`}
                  category={ref?.type ?? "weapon"}
                  variant="standard"
                  isEmpty={!ref}
                  onClick={ref ? () => onSelectItem(name, ref.type) : undefined}
                />
              );
            })}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => {
              const ref = build.leftHand[i];
              const name = ref ? armamentName(ref) : "Empty";
              return (
                <ItemSlot
                  key={`gen-left-${i}`}
                  itemName={name}
                  slotLabel={`Left Hand ${i + 1}`}
                  slotId={`gen-left-${i}`}
                  category={ref?.type ?? "weapon"}
                  variant="standard"
                  isEmpty={!ref}
                  onClick={ref ? () => onSelectItem(name, ref.type) : undefined}
                />
              );
            })}
          </div>
        </div>
      </EquipmentSection>
```

- [ ] **Step 2: Update CommunityBuildView**

Replace the Armament, Shields, Staves, and Seals sections (lines 274-340) with:

```tsx
      <EquipmentSection title="Armament">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => {
              const item = resolved.rightHand[i];
              return (
                <ItemSlot
                  key={`comm-right-${i}`}
                  itemName={item?.name ?? "Empty"}
                  slotLabel={`Right Hand ${i + 1}`}
                  slotId={`comm-right-${i}`}
                  category={item?.category ?? "weapon"}
                  variant="standard"
                  isEmpty={!item}
                  onClick={item ? () => onSelectItem(item.name, item.category) : undefined}
                />
              );
            })}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => {
              const item = resolved.leftHand[i];
              return (
                <ItemSlot
                  key={`comm-left-${i}`}
                  itemName={item?.name ?? "Empty"}
                  slotLabel={`Left Hand ${i + 1}`}
                  slotId={`comm-left-${i}`}
                  category={item?.category ?? "weapon"}
                  variant="standard"
                  isEmpty={!item}
                  onClick={item ? () => onSelectItem(item.name, item.category) : undefined}
                />
              );
            })}
          </div>
        </div>
      </EquipmentSection>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/generate-build.tsx
git commit -m "feat: generated and community build views use unified hand slots"
```

---

### Task 9: Build Card Gallery

**Files:**
- Modify: `src/components/gallery/build-card.tsx:80`

- [ ] **Step 1: Update GeneratedCard**

Replace line 80-82:

```ts
  const primaryWeapons = generated.build.weaponsRight
    .map((idx) => weapons[idx]?.name ?? "Unknown")
    .slice(0, 2);
```

with:

```ts
  const primaryWeapons = generated.build.rightHand
    .map((ref) => {
      const { lookupArmament } = await import("../../lib/armaments");
      return lookupArmament(ref)?.name ?? "Unknown";
    })
    .slice(0, 2);
```

Wait — this is a synchronous render context, not async. Use a direct import instead:

Add import at top:

```ts
import { armamentName } from "../../lib/armaments";
```

Replace line 80-82 with:

```ts
  const primaryWeapons = generated.build.rightHand
    .map((ref) => armamentName(ref))
    .slice(0, 2);
```

Remove the `weapons` import from `../../data` if no longer used.

- [ ] **Step 2: Commit**

```bash
git add src/components/gallery/build-card.tsx
git commit -m "feat: build card uses armamentName for display"
```

---

### Task 10: Build and Verify

- [ ] **Step 1: Run type check**

Run: `pnpm build 2>&1 | tail -20`

Expected: No TypeScript errors. If errors remain, they indicate missed references to the old Build fields — fix them.

- [ ] **Step 2: Run linter**

Run: `pnpm lint`

Expected: Clean or only pre-existing warnings.

- [ ] **Step 3: Run formatter**

Run: `pnpm format`

- [ ] **Step 4: Start dev server and verify in browser**

Run: `pnpm dev`

Open the app in a browser and verify:
1. Landing page loads and generates a random build with 3 Right Hand + 3 Left Hand slots displayed
2. Empty slots show as dimmed placeholders
3. Each item shows the correct category icon/color (weapon, shield, staff, seal)
4. Clicking Randomize generates a new build with the 3+3 layout
5. Share button produces a working URL that decodes correctly
6. Navigate to Guiding Hand → pick an item → picks page shows generated builds with 3+3 layout
7. Community builds display with unified armament section

- [ ] **Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix: resolve remaining unified armament slot issues"
```
