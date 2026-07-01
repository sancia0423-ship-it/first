import "server-only";

import { decode } from "he";

export function textFromStructuredParts(input: unknown) {
  if (!Array.isArray(input)) {
    return "";
  }

  return input
    .map((item) => {
      if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
        return item.text;
      }

      return "";
    })
    .join("");
}

export function normalizeWhitespace(input: string) {
  return input
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function htmlToPlainText(input: string) {
  const withLineBreaks = input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ");

  const withoutTags = withLineBreaks.replace(/<[^>]+>/g, " ");

  return normalizeWhitespace(decode(withoutTags));
}

export function summarizeText(input: string, maxLength = 180) {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, maxLength).trim()}...`;
}

export function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeToLower(value: string) {
  return value.trim().toLowerCase();
}
