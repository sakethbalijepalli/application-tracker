import { encodeBase64 } from "jsr:@std/encoding@1/base64";

interface VisionApiResponse {
  responses: {
    fullTextAnnotation?: { text: string };
    textAnnotations?: { description: string }[];
    error?: { message: string };
  }[];
}

export function extractTextFromVisionResponse(response: VisionApiResponse): string {
  const first = response.responses[0];
  if (!first) return "";
  if (first.error) {
    throw new Error(`Vision API error: ${first.error.message}`);
  }
  return first.fullTextAnnotation?.text ?? first.textAnnotations?.[0]?.description ?? "";
}

const GOOGLE_VISION_API_KEY = Deno.env.get("GOOGLE_VISION_API_KEY");

/**
 * Reads any text visible in the image (e.g. a flyer's "Applications due August 31") via
 * Google Cloud Vision OCR. Best-effort: the caller should treat failures as "no text found"
 * rather than failing the whole scrape over a flyer that couldn't be read.
 *
 * The image is downloaded here and sent as raw bytes rather than passing the URL to Vision's
 * own fetcher (`image.source.imageUri`) — Instagram's CDN rejects Google's server-to-server
 * fetch with "We're not allowed to access the URL on your behalf", so Vision has to receive
 * the content directly.
 */
export async function detectTextInImage(imageUrl: string): Promise<string> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status}`);
  }
  const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: encodeBase64(imageBytes) },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Vision API request failed: ${response.status} ${await response.text()}`);
  }
  return extractTextFromVisionResponse(await response.json());
}
