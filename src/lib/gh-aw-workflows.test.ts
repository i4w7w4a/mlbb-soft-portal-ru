import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const dormantWorkflowIds = [
  "issue-monster",
  "issue-arborist",
  "sub-issue-closer",
];

for (const workflowId of dormantWorkflowIds) {
  test(`${workflowId} stays manual-only without schedule triggers`, () => {
    const workflowPath = path.join(
      process.cwd(),
      ".github",
      "workflows",
      `${workflowId}.md`,
    );
    const workflow = fs.readFileSync(workflowPath, "utf8");

    assert.match(workflow, /workflow_dispatch:/);
    assert.doesNotMatch(workflow, /^\s*schedule:/m);
  });
}
