const assert = require('node:assert/strict');
const test = require('node:test');
const E = require('../app/src/main/assets/engine.js');
test('assembles HTML, CSS and JS into executable HTML', () => {
 const a=E.assemble('My app',[{name:'index.html',content:'<html><head></head><body><p>Original</p></body></html>'},{name:'style.css',content:'p{color:purple}'},{name:'app.js',content:'document.body.dataset.live="yes";'}]);
 assert.match(a.html, /Original/); assert.match(a.html,/p\{color:purple\}/); assert.match(a.html,/dataset.live/); assert.equal(a.report.sourceCount,3);
});
test('reports syntax errors and does not assemble invalid JS', () => {
 assert.equal(E.check([{name:'app.js',content:'const x = ;'}]).ok,false);
 assert.throws(()=>E.assemble('Bad',[{name:'app.js',content:'const x = ;'}]));
});
test('rejects paths, duplicates and unsupported files', () => {
 assert.throws(()=>E.check([{name:'../secret.js',content:'x'}]));
 assert.throws(()=>E.check([{name:'x.js',content:'a'},{name:'x.js',content:'b'}]));
 assert.throws(()=>E.check([{name:'evil.exe',content:'x'}]));
});
test('parses project exports and prevents malformed projects', () => {
 assert.equal(E.parseProject(JSON.stringify({schema:'cynthia.project.v1',title:'Example',files:[{name:'a.css',content:'body{}'}]})).title,'Example');
 assert.throws(()=>E.parseProject('{"files":[]}'));
});
test('escapes starter HTML title', () => {
 const a=E.assemble('<svg onload=alert(1)>',[]);
 assert.match(a.html,/&lt;svg/);
});
