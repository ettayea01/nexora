import {db,uid} from '../db.js';import {esc,fmtDate,stripHtml,wordCount,download} from '../utils.js';import {toast,emptyState,confirmModal} from '../ui.js';
let cur=null,filter='all',query='',sortBy='date';
export async function render(el){
 const notes=(await db.getAll('notes')).sort((a,b)=>sortBy==='title'?(a.title||'').localeCompare(b.title||''):(b.pinned-a.pinned)||(b.updatedAt-a.updatedAt));
 const list=notes.filter(n=>{if(filter==='all')return !n.trashed&&!n.archived;if(filter==='fav')return n.fav&&!n.trashed;if(filter==='archived')return n.archived&&!n.trashed;if(filter==='trash')return n.trashed;return true}).filter(n=>!query||(n.title+' '+stripHtml(n.body)).toLowerCase().includes(query));
 el.innerHTML=`<h1>Notes</h1><div class="toolbar"><button class="btn primary" id="nNew">+ New Note</button><input id="nQ" placeholder="Search notes…" value="${esc(query)}"><select id="nF"><option value="all">All</option><option value="fav">Favorites</option><option value="archived">Archived</option><option value="trash">Trash</option></select><select id="nS"><option value="date">Sort: Date</option><option value="title">Sort: Title</option></select><label class="btn">Import .md<input type="file" id="nImp" accept=".md,.txt" hidden></label></div>
 <div style="display:grid;grid-template-columns:300px 1fr;gap:14px" class="notes-layout"><div class="list" id="nList">${list.length?list.map(n=>`<div class="item" data-id="${n.id}" style="cursor:pointer;${cur===n.id?'border-color:#8B5CF6':''}"><div class="grow"><b>${n.pinned?'📌 ':''}${esc(n.title||'Untitled')}</b><br><small class="muted">${fmtDate(n.updatedAt)} · ${wordCount(stripHtml(n.body))} words ${(n.tags||[]).map(t=>'<span class=pill>'+esc(t)+'</span>').join(' ')}</small></div></div>`).join(''):emptyState('No notes here','Create your first note.')}</div><div id="nEd">${cur?'':'<div class="empty"><h3>Select a note</h3><p>Or create a new one.</p></div>'}</div></div>`;
 el.querySelector('#nF').value=filter;el.querySelector('#nS').value=sortBy;
 el.querySelector('#nNew').onclick=async()=>{const n={id:uid(),title:'',body:'',tags:[],folder:'General',fav:false,pinned:false,archived:false,trashed:false,createdAt:Date.now(),updatedAt:Date.now()};await db.put('notes',n);cur=n.id;render(el)};
 el.querySelector('#nQ').oninput=e=>{query=e.target.value.toLowerCase();render(el);const q=document.querySelector('#nQ');q.focus();q.setSelectionRange(q.value.length,q.value.length)};
 el.querySelector('#nF').onchange=e=>{filter=e.target.value;render(el)};el.querySelector('#nS').onchange=e=>{sortBy=e.target.value;render(el)};
 el.querySelector('#nImp').onchange=async e=>{const f=e.target.files[0];if(!f)return;const txt=await f.text();await db.put('notes',{id:uid(),title:f.name.replace(/\.(md|txt)$/i,''),body:'<pre>'+esc(txt)+'</pre>',tags:[],folder:'Imported',fav:false,pinned:false,archived:false,trashed:false,createdAt:Date.now(),updatedAt:Date.now()});toast('Note imported');render(el)};
 el.querySelectorAll('#nList .item').forEach(i=>i.onclick=()=>{cur=i.dataset.id;openEditor(el)});
 if(cur)openEditor(el,true);
 async function openEditor(root,keep){const n=await db.get('notes',cur);if(!n)return;const ed=root.querySelector('#nEd');
  ed.innerHTML=`<input id="eTitle" placeholder="Note title" value="${esc(n.title)}" style="width:100%;font-size:20px;font-weight:700"><div class="toolbar"><button class="btn small" data-cmd="bold"><b>B</b></button><button class="btn small" data-cmd="italic"><i>I</i></button><button class="btn small" data-cmd2="h1">H1</button><button class="btn small" data-cmd2="h2">H2</button><button class="btn small" data-cmd="insertUnorderedList">• List</button><button class="btn small" data-cmd="insertOrderedList">1. List</button><button class="btn small" id="eCheck">☑ Checklist</button><button class="btn small" id="eCode">&lt;/&gt; Code</button><button class="btn small" id="eLink">Link</button></div>
  <div class="row"><input id="eTags" placeholder="tags, comma separated" value="${esc((n.tags||[]).join(', '))}"><input id="eFolder" placeholder="Folder" value="${esc(n.folder||'General')}"><span class="muted" id="eMeta"></span></div>
  <div id="eBody" class="editor" contenteditable="true"></div>
  <div class="toolbar"><button class="btn small" id="ePin">${n.pinned?'Unpin':'Pin'}</button><button class="btn small" id="eFav">${n.fav?'Unfavorite':'Favorite'}</button><button class="btn small" id="eArch">${n.archived?'Unarchive':'Archive'}</button><button class="btn small" id="eMd">Export .md</button><button class="btn small" id="eTxt">Export .txt</button>${n.trashed?'<button class="btn small" id="eRestore">Restore</button><button class="btn small danger" id="ePerm">Delete forever</button>':'<button class="btn small danger" id="eDel">Move to Trash</button>'}</div>`;
  const body=ed.querySelector('#eBody');body.innerHTML=n.body||''; // user's own editor content, set via DOM from IDB record
  const meta=()=>{ed.querySelector('#eMeta').textContent=wordCount(body.innerText)+' words · edited '+new Date(n.updatedAt).toLocaleString()};
  meta();let deb;const save=async()=>{n.title=ed.querySelector('#eTitle').value;n.body=body.innerHTML;n.tags=ed.querySelector('#eTags').value.split(',').map(s=>s.trim()).filter(Boolean);n.folder=ed.querySelector('#eFolder').value;n.updatedAt=Date.now();await db.put('notes',n);meta()};
  [body,ed.querySelector('#eTitle'),ed.querySelector('#eTags'),ed.querySelector('#eFolder')].forEach(x=>x.addEventListener('input',()=>{clearTimeout(deb);deb=setTimeout(save,500)}));
  ed.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>{document.execCommand(b.dataset.cmd);body.focus()});
  ed.querySelectorAll('[data-cmd2]').forEach(b=>b.onclick=()=>{document.execCommand('formatBlock',false,b.dataset.cmd2.toUpperCase());body.focus()});
  ed.querySelector('#eCheck').onclick=()=>{document.execCommand('insertHTML',false,'<div><input type="checkbox"> New item</div>');save()};
  ed.querySelector('#eCode').onclick=()=>{document.execCommand('insertHTML',false,'<pre><code>code</code></pre>');save()};
  ed.querySelector('#eLink').onclick=()=>{const u=prompt('URL:','https://');if(u)document.execCommand('createLink',false,u)};
  ed.querySelector('#ePin').onclick=async()=>{n.pinned=!n.pinned;await db.put('notes',n);render(el)};
  ed.querySelector('#eFav').onclick=async()=>{n.fav=!n.fav;await db.put('notes',n);render(el)};
  ed.querySelector('#eArch').onclick=async()=>{n.archived=!n.archived;await db.put('notes',n);cur=null;render(el)};
  ed.querySelector('#eMd').onclick=()=>download((n.title||'note')+'.md',stripHtml(n.body));
  ed.querySelector('#eTxt').onclick=()=>download((n.title||'note')+'.txt',stripHtml(n.body));
  const del=ed.querySelector('#eDel');if(del)del.onclick=async()=>{n.trashed=true;await db.put('notes',n);cur=null;toast('Moved to trash');render(el)};
  const rs=ed.querySelector('#eRestore');if(rs)rs.onclick=async()=>{n.trashed=false;await db.put('notes',n);render(el)};
  const pm=ed.querySelector('#ePerm');if(pm)pm.onclick=async()=>{if(await confirmModal('Delete forever?','This note will be permanently deleted.')){await db.del('notes',n.id);cur=null;render(el)}};
 }
 if(sessionStorage.getItem('nexora-act')==='new'){sessionStorage.removeItem('nexora-act');el.querySelector('#nNew').click()}
}
