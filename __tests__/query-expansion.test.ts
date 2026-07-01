import { describe, expect, it } from "vitest";
import { expandQuery } from "../lib/pipeline/query-expansion";

describe("expandQuery", () => {
  it("expands a known company with aliases", () => {
    const result = expandQuery({ company: "字节跳动", role: "产品经理实习", direction: "增长" });

    expect(result.companyAliases).toContain("字节跳动");
    expect(result.companyAliases).toContain("字节");
    expect(result.roleAliases).toContain("产品经理实习");
    expect(result.roleAliases).toContain("产品实习");
    expect(result.directionTerms).toContain("增长");
    expect(result.queries.length).toBeGreaterThan(0);
    expect(result.queries.every((q) => q.includes("面经"))).toBe(true);
  });

  it("still works for unknown companies (generic expansion)", () => {
    const result = expandQuery({ company: "某创业公司", role: "后端开发实习", direction: "" });

    expect(result.companyAliases).toContain("某创业公司");
    expect(result.roleAliases).toContain("后端开发实习");
    expect(result.roleAliases).toContain("后端实习");
    expect(result.directionTerms).toEqual([]);
    expect(result.queries.length).toBeGreaterThan(0);
  });

  it("strips common company suffixes for short form", () => {
    const result = expandQuery({ company: "蚂蚁科技", role: "产品经理实习", direction: "" });

    expect(result.companyAliases).toContain("蚂蚁科技");
    expect(result.companyAliases).toContain("蚂蚁");
  });

  it("limits total queries to 8", () => {
    const result = expandQuery({ company: "字节跳动", role: "产品经理实习", direction: "增长" });
    expect(result.queries.length).toBeLessThanOrEqual(8);
  });
});
