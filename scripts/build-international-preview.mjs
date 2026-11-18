import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeReviewProductRoutes } from "./review-routes.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// No inherited application/provider secrets enter this build or prerender.
const env = Object.fromEntries(["PATH", "HOME", "TMPDIR", "TEMP", "SystemRoot"].filter((key) => process.env[key]).map((key) => [key, process.env[key]]));
env.NODE_ENV = "production";
env.VITE_REVIEW_PREVIEW = "true";
env.VITE_AUTH_ENABLED = "false";
// Await Vite's complete multi-environment build, then exit. Server imports used
// for prerender may leave idle timers alive; these must not hold a static build
// open after its build hooks have successfully finished.
const build = `import {createBuilder} from 'vite';
try { const builder = await createBuilder({configFile:'vite.review.config.ts'}, null); await builder.buildApp(); process.exit(0); }
catch (error) {console.error(error); process.exit(1);}`;
const result = spawnSync(process.execPath, ["--input-type=module", "-e", build], {cwd:root,env,stdio:"inherit"});
if (result.status !== 0) process.exit(result.status ?? 1);

const output = resolve(root, "dist-review");
await rm(output, {recursive:true,force:true});
await mkdir(output, {recursive:true});
await cp(resolve(root, ".review-build/client"), output, {recursive:true});
const shell = await readFile(resolve(output, "index.html"), "utf8");
if (!shell.includes("<html")) throw new Error("Review SPA shell is missing");
// Explicit SPA fallbacks for static hosts and refreshes on the reviewed paths.
for (const route of ["shop", "customize", "cart", "checkout", "orders", "order-success", "shipping", "brand", "terms", "privacy", "faq", "contact", "review-admin-order"]) {
  await mkdir(resolve(output, route), {recursive:true});
  await writeFile(resolve(output, route, "index.html"), shell);
}
await writeFile(resolve(output, "404.html"), shell);
await writeReviewProductRoutes(output);
await writeFile(resolve(output, "review-mobile.html"), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>지도칸 · 모바일 390px 검토</title><style>*{box-sizing:border-box}body{margin:0;padding:24px 12px;background:#191b1b;color:#f4eee1;font:14px system-ui,sans-serif;text-align:center}h1{font-size:20px;font-weight:500}p{color:#c4beb1;line-height:1.6}a{color:#e4cca0}iframe{display:block;width:390px;max-width:100%;height:844px;margin:24px auto 0;border:1px solid #666;border-radius:18px;background:#050606}small{display:block;margin-top:16px;color:#aaa}</style></head><body><h1>모바일 390px 검토</h1><p>같은 테스트 사이트를 모바일 화면 너비로 보여줍니다.<br>실제 주문·결제·알림은 실행되지 않습니다.</p><a href="/">전체 화면으로 돌아가기 →</a><iframe src="/?lang=en" title="지도칸 모바일 390px 테스트 화면"></iframe><small>화면 너비 검토용입니다. 실제 휴대폰의 터치·키보드 동작 검증은 별도로 필요합니다.</small></body></html>`);
await writeFile(resolve(output, "_redirects"), "/* /index.html 200\n");
await writeFile(resolve(output, "robots.txt"), "User-agent: *\nDisallow: /\n");
await writeFile(resolve(output, "_headers"), "/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  Content-Security-Policy: connect-src 'self'; form-action 'none'; object-src 'none'; base-uri 'self'\n");
await writeFile(resolve(output, "review-manifest.json"), JSON.stringify({purpose:"Owner review only",production:false,realPayments:false,customerNotifications:false,database:false,orderLookup:"Synthetic PREVIEW-ONLY-001 / demo@example.com only",builtAt:new Date().toISOString()},null,2));
console.log(`Static owner-review output: ${output}`);
