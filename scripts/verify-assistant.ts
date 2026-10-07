import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyAssistantChanges,
  validateAssistantContent,
} from "../lib/assistant-changes";
import type { SiteContent } from "../types/site";

const content: SiteContent = {
  ...JSON.parse(readFileSync("content/site-content.json", "utf8")),
  github: { enabled: true, username: "angelopol", repository: "angelopol" },
};
validateAssistantContent(content);
const initial = JSON.stringify(content);
const next = applyAssistantChanges(content, [
  { path: "home.title", value: "Nuevo título" },
  { path: "about.toolset", value: [...content.about.toolset, "Docker"] },
  {
    path: "workExperience",
    value: [
      ...content.workExperience,
      {
        id: "assistant-test-entry",
        title: "Developer",
        organization: "Company",
        location: "Remote",
        startDate: "2026",
        endDate: "",
        description: "New experience",
        references: [],
      },
    ],
  },
  { path: "github.enabled", value: false },
]);
assert.equal(next.home.title, "Nuevo título");
assert.equal(next.about.toolset.at(-1), "Docker");
assert.equal(next.workExperience.at(-1)?.id, "assistant-test-entry");
assert.equal(next.github.enabled, false);
assert.equal(
  JSON.stringify(content),
  initial,
  "The original draft must remain unchanged.",
);
for (const change of [
  { path: "__proto__.polluted", value: true },
  { path: "home.constructor.polluted", value: true },
  { path: "home.unknown", value: "invalid" },
  { path: "home.toString", value: {} },
  { path: "home.title", value: 1 },
  { path: "theme.accent", value: "url(javascript:alert(1))" },
  { path: "home.primaryCta.href", value: "javascript:alert(1)" },
  { path: "github.username", value: "../invalid" },
  { path: "about.summary.999", value: "invalid" },
  { path: "workExperience", value: [{ id: "incomplete" }] },
  { path: "projects", value: [content.projects[0], content.projects[0]] },
])
  assert.throws(
    () => applyAssistantChanges(content, [change]),
    `Must reject ${change.path}`,
  );
assert.equal(({} as Record<string, unknown>).polluted, undefined);
console.log(
  "Assistant checks passed: edits, data additions, unchanged source, schema validation, unsafe URLs, duplicate IDs and prototype protection.",
);
