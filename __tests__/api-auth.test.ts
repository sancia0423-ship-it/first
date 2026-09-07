import { afterEach, describe, expect, it } from "vitest";
import { apiKeyGuard, isAuthEnabled } from "../lib/api/auth";

function request(headers: Record<string, string> = {}) {
  return { headers: new Headers(headers) };
}

afterEach(() => {
  delete process.env.API_KEYS;
});

describe("apiKeyGuard", () => {
  it("stays open when no keys are configured", () => {
    expect(isAuthEnabled()).toBe(false);
    expect(apiKeyGuard(request())).toBeNull();
  });

  it("rejects a missing key once keys are configured", () => {
    process.env.API_KEYS = "alpha,beta";

    expect(isAuthEnabled()).toBe(true);
    expect(apiKeyGuard(request())?.status).toBe(401);
  });

  it("rejects a wrong key", () => {
    process.env.API_KEYS = "alpha";
    expect(apiKeyGuard(request({ authorization: "Bearer nope" }))?.status).toBe(401);
  });

  it("accepts any configured key, via either header", () => {
    process.env.API_KEYS = "alpha,beta";

    expect(apiKeyGuard(request({ authorization: "Bearer alpha" }))).toBeNull();
    expect(apiKeyGuard(request({ authorization: "bearer beta" }))).toBeNull();
    expect(apiKeyGuard(request({ "x-api-key": "beta" }))).toBeNull();
  });

  it("does not let a length mismatch throw", () => {
    process.env.API_KEYS = "alpha";
    expect(apiKeyGuard(request({ "x-api-key": "a-much-longer-value" }))?.status).toBe(401);
  });
});
