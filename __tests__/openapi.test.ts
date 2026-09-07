import { describe, expect, it } from "vitest";
import { buildOpenApiDocument } from "../lib/api/openapi";

describe("buildOpenApiDocument", () => {
  const document = buildOpenApiDocument("https://example.test");

  it("documents every public endpoint", () => {
    expect(Object.keys(document.paths).sort()).toEqual([
      "/api/v1/health",
      "/api/v1/interview/briefing",
      "/api/v1/interview/mock",
      "/api/v1/youtube/translate"
    ]);
  });

  it("derives request bodies from the zod schemas the routes validate with", () => {
    const translate = document.paths["/api/v1/youtube/translate"].post;
    const schema = translate.requestBody.content["application/json"].schema as Record<
      string,
      unknown
    >;
    const properties = schema.properties as Record<string, unknown>;

    expect(Object.keys(properties)).toContain("url");
    expect(Object.keys(properties)).toContain("sourceLanguage");
  });

  it("keeps the three mock-interview actions in the request union", () => {
    const mock = document.paths["/api/v1/interview/mock"].post;
    const schema = mock.requestBody.content["application/json"].schema as {
      oneOf?: unknown[];
      anyOf?: unknown[];
    };

    expect((schema.oneOf ?? schema.anyOf ?? []).length).toBe(3);
  });

  it("strips the nested $schema key that breaks OpenAPI tooling", () => {
    expect(JSON.stringify(document)).not.toContain("$schema");
  });

  it("uses the configured server url", () => {
    expect(document.servers[0].url).toBe("https://example.test");
  });
});
