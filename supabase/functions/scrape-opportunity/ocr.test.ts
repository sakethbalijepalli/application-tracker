import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { extractTextFromVisionResponse } from "./ocr.ts";

Deno.test("extracts fullTextAnnotation.text when present", () => {
  const text = extractTextFromVisionResponse({
    responses: [
      {
        fullTextAnnotation: { text: "AUDITIONS\nApplication due August 31" },
        textAnnotations: [{ description: "AUDITIONS Application due August 31" }],
      },
    ],
  });
  assertEquals(text, "AUDITIONS\nApplication due August 31");
});

Deno.test("falls back to the first textAnnotations entry when fullTextAnnotation is absent", () => {
  const text = extractTextFromVisionResponse({
    responses: [{ textAnnotations: [{ description: "AUDITIONS Application due August 31" }] }],
  });
  assertEquals(text, "AUDITIONS Application due August 31");
});

Deno.test("returns an empty string when no text was detected in the image", () => {
  const text = extractTextFromVisionResponse({ responses: [{}] });
  assertEquals(text, "");
});

Deno.test("returns an empty string when responses is empty", () => {
  const text = extractTextFromVisionResponse({ responses: [] });
  assertEquals(text, "");
});

Deno.test("throws when Vision returns a per-image error, e.g. a blocked image fetch", () => {
  assertThrows(
    () =>
      extractTextFromVisionResponse({
        responses: [{ error: { message: "We're not allowed to access the URL on your behalf." } }],
      }),
    Error,
    "Vision API error",
  );
});
