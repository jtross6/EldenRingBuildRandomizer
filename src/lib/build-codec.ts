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
      parts.push(tag & 0x03);
      parts.push(ref.index & 0xff);
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

  parts.push(...encodeHandSlots(build.rightHand));
  parts.push(...encodeHandSlots(build.leftHand));

  function writeIndex(idx: number) {
    parts.push((idx >> 8) & 0xff);
    parts.push(idx & 0xff);
  }

  writeIndex(build.helm);
  writeIndex(build.chest);
  writeIndex(build.gauntlets);
  writeIndex(build.legs);

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
