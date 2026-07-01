import { describe, expect, it } from "vitest";
import {
  htmlToPlainText,
  normalizeToLower,
  normalizeWhitespace,
  summarizeText,
  uniqueStrings
} from "../lib/pipeline/text";

describe("normalizeToLower", () => {
  it("trims and lowercases", () => {
    expect(normalizeToLower("  Hello World  ")).toBe("hello world");
  });
});

describe("normalizeWhitespace", () => {
  it("collapses multiple blank lines", () => {
    expect(normalizeWhitespace("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("trims leading spaces on lines", () => {
    expect(normalizeWhitespace("hello\n   world")).toBe("hello\nworld");
  });
});

describe("htmlToPlainText", () => {
  it("converts br tags to newlines", () => {
    expect(htmlToPlainText("hello<br/>world")).toBe("hello\nworld");
  });

  it("strips tags and decodes entities", () => {
    expect(htmlToPlainText("<p>A &amp; B</p>")).toBe("A & B");
  });
});

describe("summarizeText", () => {
  it("returns short text unchanged", () => {
    expect(summarizeText("short", 100)).toBe("short");
  });

  it("truncates long text with ellipsis", () => {
    const long = "a".repeat(200);
    const result = summarizeText(long, 50);
    expect(result.length).toBeLessThanOrEqual(54); // 50 + "..."
    expect(result.endsWith("...")).toBe(true);
  });
});

describe("uniqueStrings", () => {
  it("deduplicates and filters empty strings", () => {
    expect(uniqueStrings(["a", "", "b", "a", ""])).toEqual(["a", "b"]);
  });
});
