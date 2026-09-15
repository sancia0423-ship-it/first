import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToolsPage } from "@/components/tools-page";
import { personalSiteContent } from "@/lib/personal-site-content";

describe("portfolio links", () => {
  it("keeps the shared YouTube anchor and the direct tool link valid", () => {
    const html = renderToStaticMarkup(createElement(ToolsPage));

    expect(html).toContain('id="youtube-tool"');
    expect(html).toContain('href="/tools/youtube"');
    expect(personalSiteContent.tools.cards[0].href).toBe("/tools/youtube");
  });

  it("links LinkedIn to a public profile rather than the feed", () => {
    const linkedin = personalSiteContent.home.contact.links.find(
      (item) => item.label === "LinkedIn"
    );

    expect(linkedin).toBeDefined();

    const url = new URL(linkedin!.href);
    expect(url.hostname).toMatch(/(^|\.)linkedin\.com$/);
    expect(url.pathname).toMatch(/^\/in\/[^/]+\/?$/);
  });
});
