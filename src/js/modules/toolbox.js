import {esc,b64encode,b64decode,caseConvert,convertUnit,hexToRgb,rgbToHex,rgbToHsl,renderMarkdown,wordCount} from '../utils.js';import {toast} from '../ui.js';
const TOOLS=[['json','JSON Formatter'],['jsonv','JSON Validator'],['b64','Base64 Enc/Dec'],['url','URL Enc/Dec'],['uuid','UUID Generator'],['pass','Password Generator'],['qr','QR Generator'],['words','Word Counter'],['chars','Character Counter'],['case','Case Converter'],['color','Color Picker / Converter'],['ts','Timestamp Converter'],['unit','Unit Converter'],['md','Markdown Previewer'],['regex','Regex Tester'],['hash','Hash Generator']];
let cur='json';
function wrap(title,inner){return `<div class="card" style="margin-top:14px"><h3>${title}</h3>${inner}<div class="row" style="margin-top:10px"><button class="btn small" onclick="navigator.clipboard&&document.querySelector('#toolOut')&&navigator.clipboard.writeText(document.querySelector('#toolOut').value??document.querySelector('#toolOut').textContent)">Copy Output</button></div></div>`}
const io=(ph='Input…')=>`<textarea id="toolIn" rows="6" placeholder="${ph}"></textarea><pre id="toolOut" style="margin-top:10px"></pre>`;
function out(v){const o=document.getElementById('toolOut');if(o)o.textContent=typeof v==='string'?v:JSON.stringify(v,null,2)}
function run(el){const v=()=>document.getElementById('toolIn')?.value||'';try{
 if(cur==='json')out(JSON.stringify(JSON.parse(v()),null,2));
 if(cur==='jsonv'){JSON.parse(v());out('Valid JSON ✓')}
 if(cur==='b64')out(document.getElementById('b64mode').value==='enc'?b64encode(v()):b64decode(v()));
 if(cur==='url')out(document.getElementById('urlmode').value==='enc'?encodeURIComponent(v()):decodeURIComponent(v()));
 if(cur==='words'){const t=v();out({words:wordCount(t),sentences:(t.match(/[.!?]+/g)||[]).length,paragraphs:t.split(/\n\s*\n/).filter(Boolean).length,readingMinutes:Math.max(1,Math.round(wordCount(t)/200))||0})}
 if(cur==='chars'){const t=v();out({characters:t.length,withoutSpaces:t.replace(/\s/g,'').length,lines:t.split('\n').length})}
 if(cur==='case')out(caseConvert(v(),document.getElementById('casemode').value));
 if(cur==='regex'){const pat=document.getElementById('rxPat').value,flags=document.getElementById('rxFlags').value||'g';const re=new RegExp(pat,flags);const ms=[...v().matchAll(re.includes('g')?re:new RegExp(pat,flags+'g'))];out('Matches: '+ms.length+'\n'+ms.map(m=>m[0]).join('\n'))}
 if(cur==='md'){document.getElementById('toolOut').innerHTML=renderMarkdown(v())}
 if(cur==='ts'){const s=v().trim();if(/^\d+$/.test(s))out(new Date(+s*(s.length<=10?1000:1)).toISOString()+'\n'+new Date(+s*(s.length<=10?1000:1)).toLocaleString());else out(Math.floor(new Date(s).getTime()/1000)+' (seconds)\n'+new Date(s).getTime()+' (ms)')}
 }catch(e){out('Error: '+e.message)}}
export async function render(el){
 el.innerHTML=`<h1>Developer Toolbox</h1><p class="muted">All tools process data locally — nothing is uploaded.</p><div class="tool-grid">${TOOLS.map(([k,l])=>`<button class="tool-btn" data-t="${k}"><b>${l}</b></button>`).join('')}</div><div id="toolArea"></div>`;
 const area=el.querySelector('#toolArea');
 const show=()=>{let h='';
  if(cur==='json'||cur==='jsonv')h=wrap(TOOLS.find(t=>t[0]===cur)[1],io('{"hello":"world"}')+'<button class="btn primary" id="tRun">Run</button>');
  else if(cur==='b64')h=wrap('Base64',`<select id="b64mode"><option value="enc">Encode</option><option value="dec">Decode</option></select>`+io()+'<button class="btn primary" id="tRun">Convert</button> <button class="btn" id="tClear">Clear</button>');
  else if(cur==='url')h=wrap('URL',`<select id="urlmode"><option value="enc">Encode</option><option value="dec">Decode</option></select>`+io()+'<button class="btn primary" id="tRun">Convert</button>');
  else if(cur==='uuid')h=wrap('UUID Generator','<button class="btn primary" id="tUuid">Generate 5 UUIDs</button><pre id="toolOut"></pre>');
  else if(cur==='pass')h=wrap('Password Generator',`<label>Length <input type="number" id="pwLen" value="16" style="width:70px"></label> <label><input type="checkbox" id="pwSym" checked> Symbols</label> <label><input type="checkbox" id="pwNum" checked> Numbers</label> <button class="btn primary" id="tPw">Generate</button><pre id="toolOut"></pre>`);
  else if(cur==='qr')h=wrap('QR Generator',io('Text or URL…')+'<button class="btn primary" id="tQr">Generate QR</button><div id="toolOut" style="margin-top:10px"></div>');
  else if(cur==='words'||cur==='chars')h=wrap(TOOLS.find(t=>t[0]===cur)[1],io()+'<button class="btn primary" id="tRun">Count</button>');
  else if(cur==='case')h=wrap('Case Converter',`<select id="casemode"><option value="upper">UPPERCASE</option><option value="lower">lowercase</option><option value="title">Title Case</option><option value="camel">camelCase</option><option value="snake">snake_case</option><option value="kebab">kebab-case</option></select>`+io()+'<button class="btn primary" id="tRun">Convert</button>');
  else if(cur==='color')h=wrap('Color Converter',`<input type="color" id="colPick" value="#8B5CF6"><input id="colHex" value="#8B5CF6"><pre id="toolOut"></pre>`);
  else if(cur==='ts')h=wrap('Unix Timestamp',io('1710000000 or 2024-03-09')+'<button class="btn primary" id="tRun">Convert</button>');
  else if(cur==='unit')h=wrap('Unit Converter',`<input type="number" id="uVal" value="1"> <select id="uFrom"><option value="m">m</option><option value="km">km</option><option value="mi">mi</option><option value="ft">ft</option><option value="kg">kg</option><option value="g">g</option><option value="lb">lb</option><option value="c">°C</option><option value="f">°F</option><option value="k">K</option><option value="b">Bytes</option><option value="kb">KB</option><option value="mb">MB</option><option value="gb">GB</option></select> → <select id="uTo"><option value="km">km</option><option value="m">m</option><option value="mi">mi</option><option value="ft">ft</option><option value="kg">kg</option><option value="g">g</option><option value="lb">lb</option><option value="f">°F</option><option value="c">°C</option><option value="k">K</option><option value="kb">KB</option><option value="b">Bytes</option><option value="mb">MB</option><option value="gb">GB</option></select> <button class="btn primary" id="tUnit">Convert</button><pre id="toolOut"></pre>`);
  else if(cur==='md')h=wrap('Markdown Previewer (HTML escaped first)',io('# Hello\n\n**bold** text')+'<button class="btn primary" id="tRun">Preview</button><div id="toolOut"></div>');
  else if(cur==='regex')h=wrap('Regex Tester',`<input id="rxPat" placeholder="Pattern, e.g. \\d+"><input id="rxFlags" placeholder="Flags" value="g" style="width:80px">`+io('Text to test…')+'<button class="btn primary" id="tRun">Test</button>');
  else if(cur==='hash')h=wrap('Hash Generator (SHA via WebCrypto; MD5 not available in WebCrypto)',io()+'<button class="btn primary" id="tHash">Generate Hashes</button><pre id="toolOut"></pre>');
  area.innerHTML=h;
  const on=(id,fn)=>{const n=area.querySelector(id);if(n)n.onclick=fn};
  on('#tRun',()=>run(el));on('#tClear',()=>{document.getElementById('toolIn').value='';out('')});
  on('#tUuid',()=>out([...Array(5)].map(()=>crypto.randomUUID()).join('\n')));
  on('#tPw',()=>{let chars='abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';if(document.getElementById('pwNum').checked)chars+='23456789';if(document.getElementById('pwSym').checked)chars+='!@#$%^&*';const len=+document.getElementById('pwLen').value||16;const arr=new Uint32Array(len);crypto.getRandomValues(arr);out([...arr].map(n=>chars[n%chars.length]).join(''))});
  on('#tQr',()=>{try{const qr=qrcode(0,'M');qr.addData(document.getElementById('toolIn').value||'NEXORA');qr.make();document.getElementById('toolOut').innerHTML=qr.createSvgTag({cellSize:5,margin:8})}catch(e){out('Error: '+e.message)}});
  on('#tUnit',()=>{try{out(convertUnit(+document.getElementById('uVal').value,document.getElementById('uFrom').value,document.getElementById('uTo').value))}catch(e){out('Error: '+e.message)}});
  on('#tHash',async()=>{const data=new TextEncoder().encode(document.getElementById('toolIn').value);let s='';for(const a of['SHA-1','SHA-256','SHA-384','SHA-512']){const b=await crypto.subtle.digest(a,data);s+=a+': '+[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')+'\n'}out(s)});
  const cp=area.querySelector('#colPick');if(cp){const upd=()=>{const hex=cp.value;const{r,g,b}=hexToRgb(hex);const hsl=rgbToHsl(r,g,b);area.querySelector('#colHex').value=hex;out(`HEX ${hex}\nRGB rgb(${r}, ${g}, ${b})\nHSL hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)};cp.oninput=upd;area.querySelector('#colHex').onchange=e=>{if(/^#?[0-9a-fA-F]{6}$/.test(e.target.value)){cp.value=e.target.value.startsWith('#')?e.target.value:'#'+e.target.value;upd()}else toast('Invalid HEX','err')};upd()}
 };
 el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{cur=b.dataset.t;show()});show();
}
