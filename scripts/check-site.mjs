import {readFile,readdir,stat,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist'),base=process.env.BASE_PATH??'/';
const files=[];async function walk(d){for(const e of await readdir(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())await walk(p);else if(p.endsWith('.html'))files.push(p);}}await walk(root);
const errors=[],seen={title:new Set(),description:new Set()},pages=[];
for(const f of files){const html=await readFile(f,'utf8'),name=path.relative(root,f).replaceAll(path.sep,'/');
 const item={file:name};
 for(const [key,re] of [['title',/<title>(.*?)<\/title>/gs],['description',/<meta name="description" content="([^"]*)"/g]]){const m=[...html.matchAll(re)];if(m.length!==1||!m[0][1])errors.push(`${name} missing ${key}`);else{item[key]=m[0][1];if(seen[key].has(m[0][1]))errors.push(`${name} duplicate ${key}`);seen[key].add(m[0][1]);}}
 if((html.match(/<h1(?:\s|>)/g)||[]).length!==1)errors.push(`${name} H1 count`);
 if(!html.includes('rel="canonical"'))errors.push(`${name} canonical missing`);
 for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){try{JSON.parse(m[1]);}catch{errors.push(`${name} invalid JSON-LD`);}}
 for(const m of html.matchAll(/(?:href|src)="([^"\s]+)"/g)){const v=m[1].replaceAll('&amp;','&');if(/^(https?:|mailto:|data:)/.test(v))continue;const u=new URL(v,'https://local'+base+name);let p=decodeURIComponent(u.pathname);if(base!=='/'&&p.startsWith(base))p=p.slice(base.length-1);let target=path.resolve(root,'.'+p);try{if((await stat(target)).isDirectory())target=path.join(target,'index.html');await stat(target);}catch{errors.push(`${name}: missing ${v}`);}}
 if(/未上线|待补充|素材示例|写作测试/.test(html))errors.push(`${name}: draft copy`);pages.push(item);
}
await mkdir('reports',{recursive:true});await writeFile('reports/structure.json',JSON.stringify({pages:pages.length,errors,detail:pages},null,2));if(errors.length)throw Error(errors.join('\n'));console.log(`PASS ${pages.length} HTML pages: metadata, H1, canonical, internal links, copy`);
