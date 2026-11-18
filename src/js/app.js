// NEXORA shell — routing, nav, command palette, theme, lock, PWA (all paths relative for subpath hosting)
import {db,uid} from './db.js';
import {esc,sha256Hex} from './utils.js';
import {t,setLang} from './i18n.js';
import {icon,toast} from './ui.js';
const ROUTES=['overview','notes','tasks','calendar','library','focus','finance','toolbox','files','settings'];
const loaders={overview:()=>import('./modules/dashboard.js'),notes:()=>import('./modules/notes.js'),tasks:()=>import('./modules/tasks.js'),calendar:()=>import('./modules/calendar.js'),library:()=>import('./modules/library.js'),focus:()=>import('./modules/focus.js'),finance:()=>import('./modules/finance.js'),toolbox:()=>import('./modules/toolbox.js'),files:()=>import('./modules/files.js'),settings:()=>import('./modules/settings.js')};
let deferredInstall=null;
const ctx={applyTheme,refreshChrome};
function applyTheme(){db.getMeta('theme','system').then(th=>{let dark=th==='dark'||(th==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(th==='light')dark=false;document.documentElement.dataset.theme=dark?'dark':'light'})}
async function refreshChrome(){const name=await db.getMeta('profileName','');document.getElementById('avatar').textContent=(name||'N').trim().charAt(0).toUpperCase()||'N';buildNav()}
function buildNav(){const cur=(location.hash.replace('#/','')||'overview');const html=ROUTES.map(r=>`<a data-r="${r}" class="${r===cur?'active':''}">${icon(r)}<span class="nav-label">${t(r)}</span></a>`).join('');document.getElementById('mainNav').innerHTML=html;document.getElementById('bottomNav').innerHTML=ROUTES.slice(0,5).concat(['settings']).map(r=>`<a data-r="${r}" class="${r===cur?'active':''}">${icon(r)}<span>${t(r)}</span></a>`).join('');document.querySelectorAll('[data-r]').forEach(a=>a.onclick=()=>{location.hash='#/'+a.dataset.r})}
async function route(){const r=(location.hash.replace('#/','')||'overview').split('?')[0];const name=ROUTES.includes(r)?r:'overview';buildNav();const view=document.getElementById('view');view.innerHTML='<div class="skeleton"></div><div class="skeleton"></div>';try{const mod=await loaders[name]();await mod.render(view,ctx)}catch(e){view.innerHTML='<div class="empty"><h3>Something went wrong</h3><p>'+esc(e.message)+'</p></div>';console.error(e)}}
function setNet(){const on=navigator.onLine;document.getElementById('netText').textContent=on?'Online':'Offline';document.getElementById('netBadge').textContent=on?'Online':'Offline — working locally';document.getElementById('netDot').className='dot '+(on?'online':'off')}
async function seed(){const done=await db.getMeta('seeded',false);if(done)return;await db.put('notes',{id:uid(),title:'Welcome to NEXORA',body:'<h1>Welcome to NEXORA</h1><p>Your premium offline-first workspace. Everything you create here is stored locally in IndexedDB on this device — no account, no server.</p><p><b>Try:</b> create a task, start a focus session, add a transaction, import a PDF into the Library, and press <b>Ctrl+K</b> for the command palette.</p><p>You can delete this note at any time.</p>',tags:['welcome'],folder:'General',fav:false,pinned:true,archived:false,trashed:false,createdAt:Date.now(),updatedAt:Date.now()});await db.setMeta('seeded',true)}
async function checkLock(){const hash=await db.getMeta('pinHash',null);if(!hash)return;const ov=document.getElementById('lockOverlay');ov.classList.remove('hidden');document.getElementById('lockBtn').onclick=async()=>{const v=document.getElementById('lockPin').value;if(await sha256Hex(v)===hash){ov.classList.add('hidden')}else{document.getElementById('lockErr').textContent='Incorrect PIN'}}}
// Command palette
async function openPalette(){const p=document.getElementById('palette');p.classList.remove('hidden');const inp=document.getElementById('paletteInput');inp.value='';inp.focus();const res=document.getElementById('paletteResults');
 const renderList=async q=>{q=(q||'').toLowerCase();let items=ROUTES.map(r=>({label:'Go to '+t(r),act:()=>{location.hash='#/'+r}}));items.push({label:'New Note',act:()=>{sessionStorage.setItem('nexora-act','new');location.hash='#/notes'}},{label:'New Task',act:()=>{sessionStorage.setItem('nexora-act','new');location.hash='#/tasks'}},{label:'New Event',act:()=>{sessionStorage.setItem('nexora-act','new');location.hash='#/calendar'}});
  if(q){const [notes,tasks,events]=await Promise.all([db.getAll('notes'),db.getAll('tasks'),db.getAll('events')]);notes.filter(n=>(n.title||'').toLowerCase().includes(q)).slice(0,4).forEach(n=>items.push({label:'Note: '+(n.title||'Untitled'),act:()=>{location.hash='#/notes'}}));tasks.filter(x=>x.title.toLowerCase().includes(q)).slice(0,4).forEach(x=>items.push({label:'Task: '+x.title,act:()=>{location.hash='#/tasks'}}));events.filter(x=>x.title.toLowerCase().includes(q)).slice(0,4).forEach(x=>items.push({label:'Event: '+x.title,act:()=>{location.hash='#/calendar'}}))}
  items=items.filter(i=>!q||i.label.toLowerCase().includes(q)||i.label.startsWith('Note')||i.label.startsWith('Task')||i.label.startsWith('Event'));
  res.innerHTML=items.slice(0,12).map((i,ix)=>`<div class="palette-item" data-ix="${ix}">${esc(i.label)}</div>`).join('')||'<div class="palette-item">No results</div>';
  res.querySelectorAll('.palette-item').forEach(el=>el.onclick=()=>{const it=items[+el.dataset.ix];p.classList.add('hidden');if(it)it.act()})};
 renderList('');inp.oninput=()=>renderList(inp.value);inp.onkeydown=e=>{if(e.key==='Enter'){const f=res.querySelector('.palette-item');if(f)f.click()}}}
async function init(){
 await db.getAll('meta').catch(()=>{});
 const lang=await db.getMeta('lang','en');setLang(lang);applyTheme();await seed();await checkLock();refreshChrome();setNet();route();
 window.addEventListener('hashchange',route);window.addEventListener('online',setNet);window.addEventListener('offline',setNet);
 document.getElementById('menuBtn').onclick=()=>document.getElementById('sidebar').classList.toggle('collapsed');
 document.getElementById('themeBtn').onclick=async()=>{const cur=document.documentElement.dataset.theme;const next=cur==='dark'?'light':'dark';await db.setMeta('theme',next);document.documentElement.dataset.theme=next;toast('Theme: '+next)};
 document.getElementById('globalSearch').addEventListener('focus',e=>{e.target.blur();openPalette()});
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()}if(e.key==='Escape')document.getElementById('palette').classList.add('hidden')});
 document.getElementById('palette').addEventListener('click',e=>{if(e.target.id==='palette')e.target.classList.add('hidden')});
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;document.getElementById('installBtn').classList.remove('hidden')});
 document.getElementById('installBtn').onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;document.getElementById('installBtn').classList.add('hidden')};
 // Reminder check every minute (local only)
 setInterval(async()=>{if(!(await db.getMeta('notifications',true)))return;const evs=await db.getAll('events');const now=Date.now();for(const e of evs){if(e.reminder&&Math.abs(e.start-e.reminder*60000-now)<60000&&'Notification' in window&&Notification.permission==='granted')new Notification('NEXORA Reminder',{body:e.title})}},60000);
 // Service Worker — relative registration so it works under any subpath (e.g. /nexora/)
 if('serviceWorker' in navigator){try{const reg=await navigator.serviceWorker.register('./sw.js');reg.addEventListener('updatefound',()=>{const nw=reg.installing;if(nw)nw.addEventListener('statechange',()=>{if(nw.state==='installed'&&navigator.serviceWorker.controller)toast('NEXORA update ready — reload to apply')})});if(!localStorage.getItem('nexora-sw-seen')){localStorage.setItem('nexora-sw-seen','1');setTimeout(()=>toast('NEXORA is ready to work offline'),1200)}}catch(e){console.warn('SW registration failed',e)}}
}
init();
