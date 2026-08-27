import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import type { Page } from "../src/lib/types";

const imageDirectory = fileURLToPath(
  new URL("../public/images/", import.meta.url),
);
const imageUrlPattern = /^https?:\/\//i;

export async function prepareImageDirectory(): Promise<void> {
  await rm(imageDirectory, { recursive: true, force: true });
  await mkdir(imageDirectory, { recursive: true });
}

async function toWebp(source: string): Promise<string> {
  if (!imageUrlPattern.test(source)) return source;

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(
      `Não foi possível baixar a imagem ${source}: ${response.status} ${response.statusText}`,
    );
  }

  const input = Buffer.from(await response.arrayBuffer());
  const filename = `${createHash("sha256").update(source).digest("hex").slice(0, 16)}.webp`;
  await writeFile(
    join(imageDirectory, filename),
    await sharp(input).webp({ quality: 85 }).toBuffer(),
  );
  return `/images/${filename}`;
}

export async function materializePageImages(page: Page): Promise<Page> {
  const blocks = await Promise.all(
    page.blocks.map(async (block) => {
      if (block.type === "header" && block.logo) {
        return { ...block, logo: await toWebp(block.logo) };
      }
      if (block.type === "footer" && block.logo) {
        return { ...block, logo: await toWebp(block.logo) };
      }
      if (block.type === "hero" && block.image) {
        return { ...block, image: await toWebp(block.image) };
      }
      if (block.type === "news-banner" && block.image) {
        return { ...block, image: await toWebp(block.image) };
      }
      if (block.type === "news-image" && block.image) {
        return { ...block, image: await toWebp(block.image) };
      }
      return block;
    }),
  );
  return { ...page, blocks };
}
