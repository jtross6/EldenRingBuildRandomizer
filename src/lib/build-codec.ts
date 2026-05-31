import type { Build } from "../types/build";

const CODEC_VERSION = 1;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

export function encodeBuild(build: Build): string {
  const parts: number[] = [];

  const flags = (build.buildName ? 0x01 : 0) | (build.buildImage ? 0x02 : 0);

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

  function writeArray(arr: number[]) {
    parts.push(arr.length);
    for (const idx of arr) {
      parts.push((idx >> 8) & 0xff);
      parts.push(idx & 0xff);
    }
  }

  function writeIndex(idx: number) {
    parts.push((idx >> 8) & 0xff);
    parts.push(idx & 0xff);
  }

  writeArray(build.weaponsRight);
  writeArray(build.weaponsLeft);
  writeIndex(build.helm);
  writeIndex(build.chest);
  writeIndex(build.gauntlets);
  writeIndex(build.legs);
  writeIndex(build.shield);
  writeIndex(build.catalyst);
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

    const weaponsRight = readArray();
    const weaponsLeft = readArray();
    const helm = readUint16();
    const chest = readUint16();
    const gauntlets = readUint16();
    const legs = readUint16();
    const shield = readUint16();
    const catalyst = readUint16();
    const talismans = readArray();
    const ashesOfWar = readArray();
    const sorceries = readArray();
    const incantations = readArray();

    return {
      buildName,
      buildImage,
      weaponsRight,
      weaponsLeft,
      helm,
      chest,
      gauntlets,
      legs,
      shield,
      catalyst,
      talismans,
      ashesOfWar,
      sorceries,
      incantations,
    };
  } catch {
    return null;
  }
}
