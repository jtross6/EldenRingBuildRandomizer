import { use } from "react";

interface ImageMapEntry {
  image_url: string;
  source: string;
}

type ImageMap = Record<string, ImageMapEntry>;

const imageMapPromise: Promise<ImageMap> = import("../../data/image-map.json").then(
  (mod) => mod.default as ImageMap,
);

let cachedMap: ImageMap | null = null;

imageMapPromise.then((map) => {
  cachedMap = map;
});

export function useImageMap(): ImageMap {
  return use(imageMapPromise);
}

export function getImageUrl(itemName: string): string | undefined {
  return cachedMap?.[itemName]?.image_url;
}
