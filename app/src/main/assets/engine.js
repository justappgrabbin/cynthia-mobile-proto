/* Cynthia Self-Assembler — deterministic, local assembly engine. */
(function (root, factory) {
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  root.CynthiaEngine = engine;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const MAX_FILES = 40;
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  const EXT = /\.(html?|css|m?js|json|txt|md|svg)$/i;

  function cleanName(value) {
    return String(value || 'untitled').trim().replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 72) || 'untitled';
  }
  function validName(name) {
    return typeof name === 'string' && !!name && !name.includes('..') && !name.startsWith('/') && !name.includes('\\') && EXT.test(name);
  }
  function normalizeFiles(files) {
    if (!Array.isArray(files) || files.length > MAX_FILES) throw new Error('Select 1–40 supported files.');
    const output = [];
    const seen = new Set();
    for (const file of files) {
      const name = String(file.name || '');
      const content = String(file.content ?? '');
      if (!validName(name)) throw new Error('Unsupported or unsafe file name: ' + name);
      if (new TextEncoder().encode(content).length > MAX_FILE_SIZE) throw new Error(name + ' exceeds the 2 MB limit.');
      if (seen.has(name)) throw new Error('Duplicate file: ' + name);
      seen.add(name);
      output.push({ name, content });
    }
    return output;
  }
  function check(files) {
    const issues = [], warnings = [];
    const normalized = normalizeFiles(files);
    for (const file of normalized) {
      if (/\.json$/i.test(file.name)) {
        try { JSON.parse(file.content); } catch (error) { issues.push(file.name + ': JSON ' + error.message); }
      }
      if (/\.m?js$/i.test(file.name)) {
        if (/\b(?:import|export)\s/m.test(file.content)) {
          warnings.push(file.name + ': ES module imports/exports need bundling and are preserved but not executed.');
        } else {
          try { new Function(file.content); } catch (error) { issues.push(file.name + ': JavaScript ' + error.message); }
        }
      }
    }
    if (!normalized.some(f => /\.html?$/i.test(f.name))) warnings.push('No HTML supplied; Cynthia creates a minimal starter page.');
    if (normalized.some(f => /\.(?:py|ts|tsx|jsx)$/i.test(f.name))) warnings.push('Non-browser sources need an external compiler.');
    return { files: normalized, issues, warnings, ok: issues.length === 0 };
  }
  function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function assemble(title, input) {
    const report = check(input);
    if (!report.ok) throw new Error(report.issues.join('\n'));
    const html = report.files.find(f => f.name === 'index.html') || report.files.find(f => /\.html?$/i.test(f.name));
    let body = html ? html.content : '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><h1>' + escapeHtml(title) + '</h1></body></html>';
    const css = report.files.filter(f => /\.css$/i.test(f.name)).map(f => '\n/* ' + f.name.replace(/\*\//g,'') + ' */\n' + f.content.replace(/<\/style/gi,'<\\/style')).join('\n');
    const js = report.files.filter(f => /\.m?js$/i.test(f.name) && !/\b(?:import|export)\s/m.test(f.content)).map(f => '\n// ' + f.name.replace(/[\r\n]/g,' ') + '\n' + f.content.replace(/<\/script/gi,'<\\/script')).join('\n');
    const csp = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; font-src data:;">';
    const head = csp + (css ? '<style>' + css + '</style>' : '');
    if (/<\/head\s*>/i.test(body)) body = body.replace(/<\/head\s*>/i, head + '</head>');
    else body = body.replace(/<body([^>]*)>/i, '<head>' + head + '</head><body$1>');
    if (!body.includes(csp)) body = '<!doctype html><html><head>' + head + '</head><body>' + body + '</body></html>';
    const script = js ? '<script>' + js + '<\/script>' : '';
    if (/<\/body\s*>/i.test(body)) body = body.replace(/<\/body\s*>/i, script + '</body>');
    else body += script;
    return { html: body, report: { ...report, included: report.files.filter(f => /\.(html?|css|m?js)$/i.test(f.name)).map(f => f.name), sourceCount: report.files.length } };
  }
  function parseProject(text) {
    const p = JSON.parse(text);
    if (!p || p.schema !== 'cynthia.project.v1' || !p.title) throw new Error('Not a Cynthia project v1 export.');
    return { title: String(p.title).slice(0, 100), files: normalizeFiles(p.files || []) };
  }
  return { cleanName, normalizeFiles, check, assemble, parseProject, MAX_FILES, MAX_FILE_SIZE };
});
