import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { CURRENT_RELEASE_VERSION } from "../../apps/web/src/PatchNotes";
import manifest from "../../apps/web/src/rendering/mastery-vfx.json";

const web = process.env.TEST_WEB;
assert.ok(web, "Set TEST_WEB to the deployment being verified");
const dir = process.env.TEST_REPORT_DIR || "reports/deployment-assets";
mkdirSync(dir, { recursive: true });
const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const index = readFileSync("dist/web/index.html");
const entry = index
  .toString()
  .match(/src="\/?(assets\/index-[^\"]+\.js)"/)?.[1];
assert.ok(entry, "Production entry bundle must exist");
const paths = [
  "index.html",
  "release.json",
  entry,
  ...manifest.pages,
  manifest.projectiles,
];
const checked = await Promise.all(
  paths.map(async (path) => {
    const response = await fetch(
      new URL(path, web.endsWith("/") ? web : web + "/"),
    );
    assert.equal(response.status, 200, path);
    const bytes = Buffer.from(await response.arrayBuffer());
    const digest = sha(bytes);
    assert.equal(
      digest,
      sha(readFileSync(`dist/web/${path}`)),
      `${path} must match the built artifact`,
    );
    if (path === "release.json")
      assert.equal(
        JSON.parse(bytes.toString()).version,
        CURRENT_RELEASE_VERSION,
      );
    return {
      path,
      bytes: bytes.length,
      sha256: digest,
      contentType: response.headers.get("content-type"),
    };
  }),
);
writeFileSync(
  `${dir}/assets.json`,
  JSON.stringify(
    {
      time: new Date().toISOString(),
      web,
      release: CURRENT_RELEASE_VERSION,
      checked,
      status: "PASS",
    },
    null,
    2,
  ),
);
console.log(
  `PASS: ${CURRENT_RELEASE_VERSION}, index, production JS and all four mastery VFX atlases exactly match the built artifact.`,
);
