import path from "path";

const SHORTPIXEL_POST_REDUCER_URL = "https://api.shortpixel.com/v2/post-reducer.php";
const SHORTPIXEL_REDUCER_URL = "https://api.shortpixel.com/v2/reducer.php";

type ShortPixelResponse = {
  Status: {
    Code: number | string;
    Message: string;
  };
  OriginalURL?: string;
  LosslessURL?: string;
  LossyURL?: string;
};

function getShortPixelApiKey() {
  const apiKey = process.env.SHORTPIXEL_API_KEY;
  if (!apiKey) {
    throw new Error("La clé ShortPixel est absente de la configuration.");
  }

  return apiKey;
}

async function waitForShortPixel(originalUrl: string, timeoutSeconds = 30) {
  const startedAt = Date.now();

  while ((Date.now() - startedAt) / 1000 < timeoutSeconds) {
    const response = await fetch(SHORTPIXEL_REDUCER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: getShortPixelApiKey(),
        lossy: 0,
        wait: 20,
        urllist: [originalUrl],
      }),
    });

    const data = (await response.json()) as ShortPixelResponse[];
    const item = data[0];

    if (Number(item?.Status?.Code) === 2) {
      return item;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("ShortPixel n’a pas finalisé l’optimisation dans le temps imparti.");
}

export async function optimizeImageWithShortPixel(input: { buffer: Buffer; fileName: string; mimeType: string }) {
  const formData = new FormData();
  const formKey = "file1";
  formData.append("key", getShortPixelApiKey());
  formData.append("plugin_version", "GR101");
  formData.append("lossy", "0");
  formData.append("wait", "30");
  formData.append("resize", "3");
  formData.append("resize_width", "3840");
  formData.append("resize_height", "3840");
  formData.append("keep_exif", "0");
  formData.append("cmyk2rgb", "1");
  formData.append("file_paths", JSON.stringify({ [formKey]: path.join("/cms-upload", input.fileName) }));
  formData.append(formKey, new Blob([new Uint8Array(input.buffer)], { type: input.mimeType }), input.fileName);

  const response = await fetch(SHORTPIXEL_POST_REDUCER_URL, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as ShortPixelResponse[];
  const item = data[0];

  if (!response.ok || !item) {
    throw new Error("ShortPixel a renvoyé une réponse invalide.");
  }

  if (Number(item.Status.Code) < 0) {
    throw new Error(`ShortPixel : ${item.Status.Message}`);
  }

  const optimized = Number(item.Status.Code) === 2 ? item : item.OriginalURL ? await waitForShortPixel(item.OriginalURL) : null;

  if (!optimized?.LosslessURL) {
    throw new Error("ShortPixel n’a pas fourni d’URL de téléchargement lossless.");
  }

  const optimizedResponse = await fetch(optimized.LosslessURL);
  if (!optimizedResponse.ok) {
    throw new Error("Le téléchargement du fichier optimisé ShortPixel a échoué.");
  }

  return Buffer.from(await optimizedResponse.arrayBuffer());
}