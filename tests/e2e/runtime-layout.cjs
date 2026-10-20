// AST-located snapshot edits only. Production layout and footer are never written.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
function edit(source,changes) {return changes.sort((a,b)=>b.start-a.start).reduce((text,e)=>text.slice(0,e.start)+e.text+text.slice(e.end),source);}
function containLayout(destination) {
  const layoutFile=path.join(destination,'app/layout.tsx'),footerFile=path.join(destination,'components/layout/Footer.tsx');
  const source=fs.readFileSync(layoutFile,'utf8'),layout=ts.createSourceFile('layout.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),changes=[];
  function visit(node) {
    if(ts.isJsxElement(node)||ts.isJsxSelfClosingElement(node)) {
      const opening=ts.isJsxElement(node)?node.openingElement:node;
      const tag=opening.tagName.getText(layout);
      const hasSrc=opening.attributes.properties.some(p=>ts.isJsxAttribute(p)&&p.name.getText(layout)==='src');
      if(tag==='Script'||tag==='PublicAnalytics'||(tag==='script'&&hasSrc)) {changes.push({start:node.getStart(layout),end:node.end,text:'{/* C01 local snapshot: external layout asset suppressed */}'});return;}
    }
    ts.forEachChild(node,visit);
  }
  visit(layout);assert.equal(changes.length,4,'Layout source changed; review snapshot adapter');
  fs.writeFileSync(layoutFile,edit(source,changes));
  const footerSource=fs.readFileSync(footerFile,'utf8'),footer=ts.createSourceFile('Footer.tsx',footerSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),badges=[];
  const hosts=new Set(['www.truetier.app','launchbuff.com','launchnest.io','daniellaunches.com','launchstag.com','findly.tools','statics.startupbase.io','sellwithboost.com']);
  function badge(node) {
    if(ts.isPropertyAssignment(node)&&node.name.getText(footer)==='src'&&ts.isStringLiteral(node.initializer)) {
      const value=node.initializer.text;
      if(value.startsWith('https://')) {assert.ok(hosts.has(new URL(value).hostname),'Unknown footer asset requires review');badges.push({start:node.initializer.getStart(footer),end:node.initializer.end,text:"'/c01-local-badge.svg'"});}
    }
    ts.forEachChild(node,badge);
  }
  badge(footer);assert.equal(badges.length,8,'Footer badge source changed; review snapshot adapter');
  fs.writeFileSync(footerFile,edit(footerSource,badges));
  fs.writeFileSync(path.join(destination,'public/c01-local-badge.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><rect width="160" height="40" fill="#222"/><text x="8" y="25" fill="white">Local test badge</text></svg>');
  return {snapshotOnly:true,suppressedLayoutNodes:changes.length,replacedBadgeSources:badges.length,productionSourcesWritten:false};
}
module.exports={containLayout};
