import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function request(ip = "1.2.3.4") {
  return { headers: new Headers({ "x-forwarded-for": ip }) };
}

/** 配额是模块级状态，每个用例都要拿到全新的模块。 */
async function loadTrial(env: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
  return import("../lib/api/trial");
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("trial quota", () => {
  it("is unavailable without a server key, so nothing can be spent", async () => {
    const trial = await loadTrial({ OPENAI_API_KEY: "" });

    expect(trial.isTrialAvailable()).toBe(false);
    expect(trial.consumeTrial(request())).toBe(false);
  });

  it("limits a single client per day", async () => {
    const trial = await loadTrial({ OPENAI_API_KEY: "k", TRIAL_PER_IP_DAILY: "2" });

    expect(trial.consumeTrial(request())).toBe(true);
    expect(trial.consumeTrial(request())).toBe(true);
    expect(trial.consumeTrial(request())).toBe(false);
    expect(trial.getTrialStatus(request()).remaining).toBe(0);
  });

  it("keeps clients independent of each other", async () => {
    const trial = await loadTrial({ OPENAI_API_KEY: "k", TRIAL_PER_IP_DAILY: "1" });

    expect(trial.consumeTrial(request("1.1.1.1"))).toBe(true);
    expect(trial.consumeTrial(request("1.1.1.1"))).toBe(false);
    // 另一个访客不该被前一个人用完的额度影响。
    expect(trial.consumeTrial(request("2.2.2.2"))).toBe(true);
  });

  it("caps total spend across every client", async () => {
    // 这一条才是真正封住账单的：单 IP 限额挡不住很多不同 IP。
    const trial = await loadTrial({
      OPENAI_API_KEY: "k",
      TRIAL_PER_IP_DAILY: "5",
      TRIAL_TOTAL_DAILY: "3"
    });

    expect(trial.consumeTrial(request("1.1.1.1"))).toBe(true);
    expect(trial.consumeTrial(request("2.2.2.2"))).toBe(true);
    expect(trial.consumeTrial(request("3.3.3.3"))).toBe(true);
    expect(trial.consumeTrial(request("4.4.4.4"))).toBe(false);
  });

  it("reports the smaller of the two remaining budgets", async () => {
    const trial = await loadTrial({
      OPENAI_API_KEY: "k",
      TRIAL_PER_IP_DAILY: "10",
      TRIAL_TOTAL_DAILY: "2"
    });

    expect(trial.getTrialStatus(request()).remaining).toBe(2);
  });

  it("can be switched off entirely with a zero budget", async () => {
    const trial = await loadTrial({ OPENAI_API_KEY: "k", TRIAL_TOTAL_DAILY: "0" });

    expect(trial.isTrialAvailable()).toBe(false);
    expect(trial.consumeTrial(request())).toBe(false);
  });

  it("separates 'not offered here' from 'used up today'", async () => {
    // 两种情况都不能用，但提示语完全不同：说成用完，用户会以为等一天就好。
    const off = await loadTrial({ OPENAI_API_KEY: "" });
    expect(off.getTrialStatus(request()).enabled).toBe(false);

    const on = await loadTrial({ OPENAI_API_KEY: "k", TRIAL_PER_IP_DAILY: "1" });
    on.consumeTrial(request());
    const status = on.getTrialStatus(request());
    expect(status.enabled).toBe(true);
    expect(status.available).toBe(false);
  });
});
