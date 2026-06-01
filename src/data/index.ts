import type {
  ArmorPiece,
  AshOfWar,
  Catalyst,
  Shield,
  Spell,
  Talisman,
  Weapon,
} from "../types/items";

import weaponsData from "./weapons.json";
import shieldsData from "./shields.json";
import catalystsData from "./catalysts.json";
import armorHeadData from "./armor-head.json";
import armorBodyData from "./armor-body.json";
import armorArmsData from "./armor-arms.json";
import armorLegsData from "./armor-legs.json";
import talismansData from "./talismans.json";
import sorceriesData from "./sorceries.json";
import incantationsData from "./incantations.json";
import ashesOfWarData from "./ashes-of-war.json";

export const weapons = weaponsData as unknown as Weapon[];
export const shields = shieldsData as unknown as Shield[];
export const catalysts = catalystsData as unknown as Catalyst[];
export const armorHead = armorHeadData as ArmorPiece[];
export const armorBody = armorBodyData as ArmorPiece[];
export const armorArms = armorArmsData as ArmorPiece[];
export const armorLegs = armorLegsData as ArmorPiece[];
export const talismans = talismansData as Talisman[];
export const sorceries = sorceriesData as unknown as Spell[];
export const incantations = incantationsData as unknown as Spell[];
export const ashesOfWar = ashesOfWarData as unknown as AshOfWar[];

import coOccurrenceData from "./co-occurrence.json";

export const coOccurrence = coOccurrenceData as Record<string, Record<string, number>>;

import type { CommunityBuild } from "../types/community";
import communityBuildsData from "./community-builds.json";

export const communityBuilds = communityBuildsData as CommunityBuild[];
