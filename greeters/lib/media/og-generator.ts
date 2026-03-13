import { execFile } from "child_process";
import { promisify } from "util";

import sharp from "sharp";

import { buildOgAssetId, saveManagedImage } from "@/lib/media/managed-images";
import type { PageInput, PageResponse } from "@/lib/services/pages";

const execFileAsync = promisify(execFile);

function buildOgPrompt(page: Pick<PageInput, "title" | "metaDescription" | "slug" | "locale">) {
  return [
    "Create a hyper realistic editorial photograph for an Open Graph image.",
    `Topic: ${page.title}.`,
    `Description: ${page.metaDescription || page.title}.`,
    "Style: authentic Paris atmosphere, natural light, premium travel photography, no text, no logo, no collage, no watermark.",
    "Composition: cinematic wide frame suitable for 1200x630 social sharing.",
    `Locale context: ${page.locale}.`,
    `Slug context: ${page.slug}.`,
  ].join(" ");
}

export async function generateOgImageForPage(page: Pick<PageResponse, "title" | "metaDescription" | "slug" | "locale">) {
  const assetId = buildOgAssetId(`${page.locale}:${page.slug}`);
  const tempOutput = `/tmp/${assetId}.png`;
  const scriptPath = `${process.cwd()}/scripts/generate_og_image.py`;

  await execFileAsync("python", [scriptPath, buildOgPrompt(page), tempOutput], {
    cwd: process.cwd(),
    env: process.env,
    timeout: 300000,
    maxBuffer: 1024 * 1024,
  });

  const ogBuffer = await sharp(tempOutput).resize(1200, 630, { fit: "cover", position: "center" }).png().toBuffer();
  return saveManagedImage({
    buffer: ogBuffer,
    fileName: `${page.slug === "/" ? "home" : page.slug}-og.png`,
    mimeType: "image/png",
    kind: "og",
    preferredId: assetId,
  });
}