/** Export the pre-workbench interface without checking out or changing today's app. */
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const revision = 'c3caa2fcdca0f7959df4c064ad6cc8519519627c';
const files = ['cardbot-preview.ts', 'cardbot-preview.css', 'text-art.ts', 'shanghai-greeting.ts', 'preview-store.ts'];
const staging = await mkdtemp(path.join(tmpdir(), 'cardbot-visual-archive-'));
const output = path.join(root, 'archives', 'cardbot-visual-v2.html');
const show = (file) => execFileSync('git', ['show', `${revision}:frontend/src/${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });

try {
  for (const file of files) {
    // Separate archive preferences/tasks from the current preview, even if hosted together.
    let source = show(file).replaceAll('cardbot_', 'cardbot_archive_v2_');
    if (file === 'cardbot-preview.ts') {
      source = source.replaceAll('href="/"', 'href="#" data-action="workspace"')
        .replaceAll('href="/crm.html?intro=0"', 'href="#" data-archive-unavailable="true"');
    }
    await writeFile(path.join(staging, file), source);
  }
  const result = await build({
    absWorkingDir: staging,
    entryPoints: ['cardbot-preview.ts'],
    outdir: path.join(staging, 'bundle'),
    nodePaths: [path.join(root, 'node_modules'), path.join(root, 'frontend', 'node_modules')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2022'],
    minify: true,
    legalComments: 'inline',
    write: false,
  });
  const js = result.outputFiles.find(file => file.path.endsWith('.js'))?.text;
  const css = result.outputFiles.find(file => file.path.endsWith('.css'))?.text;
  if (!js || !css) throw new Error('Archive build did not produce both JS and CSS');
  const licenses = [{ package: 'CardBot', text: await readFile(path.join(root, 'LICENSE'), 'utf8') }];
  for (const name of ['d3-geo', 'd3-array', 'internmap', 'topojson-client', 'world-atlas']) {
    licenses.push({ package: name, text: await readFile(path.join(root, 'node_modules', name, 'LICENSE'), 'utf8') });
  }
  const html = `<!doctype html>
<!-- CardBot visual v2 archive. Source: ${revision}.
     Single-file offline preview: scripts, styles and Earth geometry embedded.
     Fictional data only. No OKKI API, model call, email send or real CRM included.
     Storage uses the cardbot_archive_v2_ prefix, separate from the current workbench.
     Original application: Apache-2.0; dependency notices: THIRD_PARTY_NOTICES.md. -->
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CardBot · 旧版界面留底 / Visual v2 archive</title>
<style>${css}</style></head><body><div id="cardbot"></div>
<script id="archive-licenses" type="application/json">${JSON.stringify(licenses).replaceAll('<', '\\u003c')}</script>
<script>
document.addEventListener('click', function(event) {
  if (event.target.closest('[data-archive-unavailable]')) {
    event.preventDefault();
    alert('这是旧版界面离线留底，不包含真实 CRM。 / This offline archive does not include the authenticated CRM.');
  }
});
${js.replace(/<\/script/gi, '<\\/script')}
</script></body></html>
`;
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, html, 'utf8');
  console.log(`Saved ${output} (${Buffer.byteLength(html)} bytes), source ${revision}`);
} finally {
  // Only remove the unique temporary directory created by this build.
  const resolved = path.resolve(staging);
  if (path.dirname(resolved) !== path.resolve(tmpdir()) || !path.basename(resolved).startsWith('cardbot-visual-archive-')) {
    throw new Error('Unexpected archive staging path; refusing cleanup');
  }
  await rm(resolved, { recursive: true, force: true });
}
