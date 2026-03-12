import { createHash, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import sharp from "sharp";

import { prisma } from "@/lib/db/prisma";
import { CMS_UPLOAD_PREFIX, CMS_UPLOAD_ROOT, OG_UPLOAD_PREFIX, OG_UPLOAD_ROOT } from "@/lib/media/config";
import { optimizeImageWithShortPixel } from "@/lib/media/shortpixel";

type ManagedUploadKind = "cms" | "og";

function getRootForKind(kind: ManagedUploadKind) {
  return kind === "cms" ? CMS_UPLOAD_ROOT : OG_UPLOAD_ROOT;
}

function getPrefixForKind(kind: ManagedUploadKind) {
  return kind === "cms" ? CMS_UPLOAD_PREFIX : OG_UPLOAD_PREFIX;
}

function slugifyFileName(name: string) {
  const extension = path.extname(name).toLowerCase() || ".jpg";
  const baseName = path.basename(name, extension).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  return { baseName, extension };
}

function extractManagedDirectoryKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.split("?")[0];
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length < 3 || parts[0] !== "uploads") {
    return null;
  }

  return `${parts[1]}/${parts[2]}`;
}

async function ensureRoot(kind: ManagedUploadKind) {
  await fs.mkdir(getRootForKind(kind), { recursive: true });
}

async function optimizeCmsImageBuffer(buffer: Buffer, fileName: string, mimeType: string) {
  try {
    return await optimizeImageWithShortPixel({ buffer, fileName, mimeType });
  } catch (error) {
    console.warn("ShortPixel indisponible, fallback local sharp activé.", error);

    const image = sharp(buffer, { failOn: "none" }).rotate().resize({
      width: 3840,
      height: 3840,
      fit: "inside",
      withoutEnlargement: true,
    });

    if (mimeType.includes("png")) {
      return image.png({ compressionLevel: 9, palette: true }).toBuffer();
    }

    if (mimeType.includes("webp")) {
      return image.webp({ lossless: true }).toBuffer();
    }

    return image.jpeg({ quality: 100, mozjpeg: true }).toBuffer();
  }
}

export async function saveManagedImage(input: { buffer: Buffer; fileName: string; mimeType: string; kind: ManagedUploadKind; preferredId?: string | null }) {
  await ensureRoot(input.kind);
  const assetId = input.preferredId || randomUUID();
  const { baseName, extension } = slugifyFileName(input.fileName);
  const targetDirectory = path.join(getRootForKind(input.kind), assetId);
  const targetFileName = `${baseName}${extension}`;
  const targetFilePath = path.join(targetDirectory, targetFileName);

  await fs.rm(targetDirectory, { recursive: true, force: true });
  await fs.mkdir(targetDirectory, { recursive: true });

  const optimizedBuffer = input.kind === "cms" ? await optimizeCmsImageBuffer(input.buffer, input.fileName, input.mimeType) : input.buffer;
  const metadata = await sharp(optimizedBuffer).metadata();

  await fs.writeFile(targetFilePath, optimizedBuffer);

  return {
    assetId,
    src: `${getPrefixForKind(input.kind)}/${assetId}/${targetFileName}`,
    width: String(metadata.width ?? ""),
    height: String(metadata.height ?? ""),
    extension,
  };
}

function collectImagePathsFromSections(sections: unknown) {
  if (!Array.isArray(sections)) {
    return [] as string[];
  }

  const paths: string[] = [];

  sections.forEach((section) => {
    if (!section || typeof section !== "object") {
      return;
    }

    const typedSection = section as { backgroundImage?: unknown; blocks?: Array<{ type?: unknown; content?: Record<string, unknown> }> };
    if (typeof typedSection.backgroundImage === "string") {
      paths.push(typedSection.backgroundImage);
    }

    typedSection.blocks?.forEach((block) => {
      if (block?.type === "image" && typeof block.content?.src === "string") {
        paths.push(block.content.src);
      }
    });
  });

  return paths;
}

async function listManagedDirectories(root: string) {
  await fs.mkdir(root, { recursive: true });
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

export async function cleanupOrphanedManagedImages() {
  const pages = await prisma.page.findMany({
    select: {
      sections: true,
      ogImageUrl: true,
      twitterImageUrl: true,
    },
  });

  const referencedDirectories = new Set<string>();
  pages.forEach((page) => {
    [...collectImagePathsFromSections(page.sections), page.ogImageUrl, page.twitterImageUrl]
      .map((value) => extractManagedDirectoryKey(value))
      .filter(Boolean)
      .forEach((value) => referencedDirectories.add(value as string));
  });

  for (const [kind, root] of [["cms", CMS_UPLOAD_ROOT], ["og", OG_UPLOAD_ROOT]] as const) {
    const directories = await listManagedDirectories(root);

    await Promise.all(
      directories.map(async (directory) => {
        const key = `${kind}/${directory}`;
        if (!referencedDirectories.has(key)) {
          await fs.rm(path.join(root, directory), { recursive: true, force: true });
        }
      }),
    );
  }
}

export function buildOgAssetId(slug: string) {
  return createHash("sha1").update(slug).digest("hex").slice(0, 16);
}