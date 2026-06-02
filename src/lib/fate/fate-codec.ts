import type { PlaystyleCard } from "../../types/fate";
import {
  ALL_IDENTITIES,
  ALL_STANCES,
  ALL_FAMILIES,
  ALL_SCHOOLS,
  ALL_STATUS_EFFECTS,
} from "./taxonomy";
import { deriveDynamicFields } from "./playstyle-generator";

const CODEC_VERSION = 1;
const ARMOR_CLASSES = ["light", "medium", "heavy"] as const;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array | null {
  try {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function encodeFate(card: PlaystyleCard): string {
  const bytes: number[] = [];
  bytes.push(CODEC_VERSION);

  bytes.push(ALL_IDENTITIES.indexOf(card.identity));
  bytes.push(ALL_STANCES.indexOf(card.stance));
  bytes.push(ALL_FAMILIES.indexOf(card.family));

  const schoolIdx = card.school ? ALL_SCHOOLS.indexOf(card.school) + 1 : 0;
  bytes.push(schoolIdx);

  const statusIdx = card.statusEffect ? ALL_STATUS_EFFECTS.indexOf(card.statusEffect) + 1 : 0;
  bytes.push(statusIdx);

  bytes.push(ARMOR_CLASSES.indexOf(card.armorClass as (typeof ARMOR_CLASSES)[number]));

  bytes.push((card.seed >>> 24) & 0xff);
  bytes.push((card.seed >>> 16) & 0xff);
  bytes.push((card.seed >>> 8) & 0xff);
  bytes.push(card.seed & 0xff);

  return toBase64Url(new Uint8Array(bytes));
}

export function decodeFate(encoded: string): PlaystyleCard | null {
  const bytes = fromBase64Url(encoded);
  if (!bytes || bytes.length < 10) return null;

  try {
    let offset = 0;
    const version = bytes[offset++];
    if (version !== CODEC_VERSION) return null;

    const identity = ALL_IDENTITIES[bytes[offset++]];
    const stance = ALL_STANCES[bytes[offset++]];
    const family = ALL_FAMILIES[bytes[offset++]];

    const schoolByte = bytes[offset++];
    const school = schoolByte > 0 ? ALL_SCHOOLS[schoolByte - 1] : null;

    const statusByte = bytes[offset++];
    const statusEffect = statusByte > 0 ? ALL_STATUS_EFFECTS[statusByte - 1] : null;

    const armorClass = ARMOR_CLASSES[bytes[offset++]];

    const seed =
      ((bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3]) >>>
      0;

    if (!identity || !stance || !family || !armorClass) return null;

    const { primaryStats, subGroups, name, flavor } = deriveDynamicFields(
      identity,
      stance,
      family,
      school,
      statusEffect,
      seed,
    );

    return {
      identity,
      stance,
      family,
      subGroups,
      school,
      statusEffect,
      armorClass,
      primaryStats,
      name,
      flavor,
      seed,
    };
  } catch {
    return null;
  }
}
