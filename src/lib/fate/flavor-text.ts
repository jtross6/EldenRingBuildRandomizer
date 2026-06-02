import type {
  CombatIdentity,
  WeaponStance,
  WeaponFamily,
  WeaponSubGroup,
  MagicSchool,
  StatusEffect,
} from "../../types/fate";
import type { SeededRng } from "../seeded-rng";

const SUB_GROUP_NOUNS: Record<WeaponSubGroup, string> = {
  daggers: "dagger",
  "curved-swords": "blade",
  katanas: "blade",
  "thrusting-swords": "blade",
  "backhand-blades": "blade",
  "throwing-blades": "blade",
  "straight-swords": "blade",
  greatswords: "blade",
  "great-katanas": "blade",
  "colossal-swords": "blade",
  "colossal-weapons": "weapon",
  axes: "axe",
  hammers: "hammer",
  spears: "spear",
  halberds: "halberd",
  reapers: "scythe",
  twinblades: "twinblade",
  whips: "whip",
  "fist-weapons": "fist",
  torches: "torch",
  "perfume-bottles": "bottle",
  bows: "bow",
  crossbows: "crossbow",
};

function resolveNoun(text: string, noun: string): string {
  const capitalized = noun.charAt(0).toUpperCase() + noun.slice(1);
  return text.replace("{Noun}", capitalized).replace("{noun}", noun);
}

const OPENERS: Record<CombatIdentity, string[]> = {
  warrior: [
    "Steel and sinew, nothing more.",
    "No sorcery. No miracles. Only the {noun}.",
    "Strength alone carves a path through the Lands Between.",
    "The simplest creed: strike first, strike hardest.",
    "Where others chant and gesture, you simply swing.",
  ],
  spellcaster: [
    "The stars whisper secrets to those who listen.",
    "Flesh is frail. The mind endures.",
    "Let others swing crude iron — you wield the cosmos.",
    "The old arts were never meant for the timid.",
    "Power flows from knowledge, and knowledge from patience.",
  ],
  spellblade: [
    "{Noun} in one hand, sigil in the other.",
    "The best offense is both — steel and sorcery in tandem.",
    "Where warriors falter and mages flee, the spellblade thrives.",
    "Magic and steel, woven into a single deadly thread.",
    "Two disciplines, one purpose.",
  ],
  skirmisher: [
    "They never see you coming. They never stop bleeding.",
    "Patience is a weapon. So is fear.",
    "The Lands Between reward the cunning over the strong.",
    "Strike where it hurts, then vanish.",
    "Every wound tells. Every second counts.",
  ],
};

const STATUS_OPENERS: Partial<Record<StatusEffect, string[]>> = {
  poison: ["Patience is a weapon. So is poison."],
};

const WEAPON_FRAGMENTS: Record<WeaponFamily, string[]> = {
  "light-blades": [
    "Quick blades flash like silver lightning.",
    "Each slash traces a lethal arc, too fast to follow.",
    "A flurry of cuts — death by a thousand edges.",
    "The lighter the blade, the quicker the kill.",
  ],
  "heavy-blades": [
    "A {noun} carves through armor like parchment.",
    "Heavy steel demands respect — and punishes those who show none.",
    "Each swing carries the weight of conviction.",
    "The {noun} is patient. One clean stroke is all it takes.",
  ],
  colossal: [
    "The ground trembles with every swing.",
    "A weapon this size isn't wielded — it's unleashed.",
    "Subtlety is for smaller warriors with smaller weapons.",
    "One hit. That's all you need. That's all you'll get.",
  ],
  "axes-hammers": [
    "Bones shatter. Shields splinter. The {noun} doesn't care.",
    "A good {noun} solves most problems. A great one solves all of them.",
    "Blunt force — the oldest magic in the world.",
    "Crush what cannot be cut.",
  ],
  polearms: [
    "Reach is everything — strike first, stay safe.",
    "The {noun}'s reach keeps enemies at bay and allies alive.",
    "A {noun} finds gaps that swords can only dream of.",
    "Control the distance, control the fight.",
  ],
  "agile-exotic": [
    "The {noun} — a weapon as wild as its wielder.",
    "Unconventional arms for unconventional warriors.",
    "The {noun} strikes. The enemy falls.",
    "They expect swords. They don't expect this.",
  ],
  ranged: [
    "Death arrives well before you're seen.",
    "The best fights are the ones your enemy never reaches.",
    "A well-placed shot outperforms any spell.",
    "At this range, armor is merely decorative.",
  ],
};

const MAGIC_FRAGMENTS: Record<MagicSchool, string[]> = {
  glintstone: [
    "Glintstone projectiles arc and shatter on impact.",
    "The academy's arts still echo in every shard.",
  ],
  "moon-frost": [
    "Frost crawls across the battlefield, slowing all it touches.",
    "The cold moon's blessing chills to the bone.",
  ],
  gravity: [
    "Gravity bends at your command — stones rise, enemies fall.",
    "Meteoric fragments rain from impossible angles.",
  ],
  night: [
    "Night sorceries slip past magical defenses unseen.",
    "Darkness is not the absence of power — it is power refined.",
  ],
  aberrant: [
    "Twisted sorceries that should not exist — yet they do.",
    "The briars grow from wounds that refuse to heal.",
  ],
  "golden-order": [
    "The Erdtree's light mends what darkness has broken.",
    "Golden radiance sears the faithless.",
  ],
  blackflame: [
    "The black flame devours all — even the divine.",
    "Godslaying fire that burns beyond what flesh can feel.",
  ],
  dragon: [
    "Dragon communion incantations roar with ancient fury.",
    "The hearts of dragons grant power beyond mortal ken.",
  ],
  lightning: [
    "Ancient dragon lightning arcs from palm to prey.",
    "The storm answers your call with devastating precision.",
  ],
  bestial: [
    "Primal incantations channel the beast within.",
    "Stone and claw — the oldest prayers of the wild.",
  ],
  fire: [
    "Holy flame purifies and destroys in equal measure.",
    "The giants' flame burns eternal, and so shall you.",
  ],
  blood: [
    "Blood rites fuel power that no clean magic can match.",
    "Hemorrhage is an art. You are its master.",
  ],
  "frenzied-flame": [
    "The flame of frenzy does not distinguish friend from foe.",
    "Madness is not a price — it is a gift.",
  ],
};

const CLOSERS: string[] = [
  "The Lands Between will remember this path.",
  "Fate has spoken. The rest is up to you.",
  "A worthy challenge for any Tarnished.",
];

function pickFrom(pool: string[], rng: SeededRng): string {
  return pool[rng.randomInt(pool.length)];
}

export function generateFlavorText(
  identity: CombatIdentity,
  _stance: WeaponStance,
  family: WeaponFamily,
  school: MagicSchool | null,
  statusEffect: StatusEffect | null,
  rng: SeededRng,
  primarySubGroup: WeaponSubGroup,
): string {
  const noun = SUB_GROUP_NOUNS[primarySubGroup];
  const statusPool = statusEffect ? STATUS_OPENERS[statusEffect] : undefined;
  let opener: string;
  if (statusPool && rng.next() < 0.4) {
    opener = resolveNoun(pickFrom(statusPool, rng), noun);
  } else {
    opener = resolveNoun(pickFrom(OPENERS[identity], rng), noun);
  }
  const weaponFrag = resolveNoun(pickFrom(WEAPON_FRAGMENTS[family], rng), noun);

  if (school) {
    const magicFrag = pickFrom(MAGIC_FRAGMENTS[school], rng);
    return `${opener} ${weaponFrag} ${magicFrag}`;
  }

  const useCloser = rng.next() < 0.4;
  if (useCloser) {
    return `${opener} ${weaponFrag} ${pickFrom(CLOSERS, rng)}`;
  }
  return `${opener} ${weaponFrag}`;
}
