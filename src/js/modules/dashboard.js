import {db} from '../db.js';import {esc,fmtDate,fmtTime,fmtMoney,productivityScore,isToday} from '../utils.js';import {toast,emptyState} from '../ui.js';
export async function render(el,ctx){
 const [tasks,notes,events,txs,files,sessions]=await Promise.all([db.getAll('tasks'),db.getAll('notes'),db.getAll('events'),db.getAll('transactions'),db.getAll('files'),db.getAll('focusSessions')]);
 const vis=await db.getMeta('widgets',{score:1,chart:1,events:1,notes:1,files:1,finance:1,focus:1});
 const h=new Date().getHours();const greet=h<12?'Good morning':h<18?'Good afternoon':'Good evening';
 const name=await db.getMeta('profileName','Friend');
 const doneToday=tasks.filter(t=>t.done&&t.completedAt&&isToday(t.completedAt)).length;
 const totalToday=tasks.filter(t=>!t.trashed).length;
 const focusMin=sessions.filter(s=>isToday(s.at)).reduce((a,s)=>a+(s.minutes||0),0);
 const goal=await db.getMeta('focusGoal',60);
 const score=productivityScore({tasksDoneToday:doneToday,tasksTotalToday:Math.max(totalToday,1),focusMin,focusGoalMin:goal});
 const pending=tasks.filter(t=>!t.done&&!t.trashed).length;
 const inc=txs.filter(t=>t.type==='income').reduce((a,t)=>a+ +t.amount,0),exp=txs.filter(t=>t.type==='expense').reduce((a,t)=>a+ +t.amount,0);
 const cur=await db.getMeta('currency','$');
 const up=events.filter(e=>e.start>=Date.now()-36e5).sort((a,b)=>a.start-b.start).slice(0,5);
 const rn=notes.filter(n=>!n.trashed&&!n.archived).sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,4);
 const rf=[...files].sort((a,b)=>b.addedAt-a.addedAt).slice(0,4);
 // weekly chart from real data: tasks completed per day, last 7 days
 const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const k=d.toISOString().slice(0,10);return{label:d.toLocaleDateString(undefined,{weekday:'short'}),n:tasks.filter(t=>t.completedAt&&new Date(t.completedAt).toISOString().slice(0,10)===k).length,f:sessions.filter(s=>new Date(s.at).toISOString().slice(0,10)===k).reduce((a,s)=>a+(s.minutes||0),0)}});
 const mx=Math.max(1,...days.map(d=>d.n));
 const bars=days.map(d=>`<div style="text-align:center;flex:1"><div style="height:${Math.round(d.n/mx*90)+4}px;background:linear-gradient(180deg,#8B5CF6,#6366F1);border-radius:6px 6px 0 0" title="${d.n} tasks, ${d.f} focus min"></div><small class="muted">${d.label}</small><div>${d.n}</div></div>`).join('');
 el.innerHTML=`<h1>${greet}, ${esc(name)}</h1><p class="muted">${fmtDate(Date.now(),{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · <span id="clock">${fmtTime(Date.now())}</span></p>
 <div class="toolbar"><button class="btn primary" data-go="notes" data-act="new">+ New Note</button><button class="btn" data-go="tasks" data-act="new">+ New Task</button><button class="btn" data-go="calendar" data-act="new">+ New Event</button><button class="btn" data-go="focus">Start Focus</button><button class="btn" data-go="finance" data-act="new">+ Transaction</button><label class="muted" style="margin-left:auto">Widgets: ${Object.keys(vis).map(k=>`<label style="margin-left:6px"><input type="checkbox" class="wgt" value="${k}" ${vis[k]?'checked':''}> ${k}</label>`).join('')}</label></div>
 <div class="grid2">
 ${vis.score?`<div class="card"><h3>Productivity Score</h3><div class="big">${score}%</div><p class="muted">${doneToday} tasks done today · ${pending} pending</p><div class="progress"><div style="width:${score}%"></div></div></div>`:''}
 <div class="card"><h3>Tasks</h3><div class="big">${pending}</div><p class="muted">pending · ${tasks.filter(t=>t.done).length} completed overall</p></div>
 ${vis.focus?`<div class="card"><h3>Focus Today</h3><div class="big">${focusMin} min</div><p class="muted">Goal: ${goal} min</p><button class="btn small primary" data-go="focus">Open Focus</button></div>`:''}
 ${vis.finance?`<div class="card"><h3>Finance</h3><div class="big">${fmtMoney(inc-exp,cur)}</div><p class="muted">Income ${fmtMoney(inc,cur)} · Expenses ${fmtMoney(exp,cur)}</p></div>`:''}
 </div>
 ${vis.chart?`<div class="card" style="margin-top:14px"><h3>Weekly Productivity (tasks completed)</h3><div style="display:flex;gap:8px;align-items:flex-end;height:130px">${bars}</div></div>`:''}
 <div class="grid" style="margin-top:14px">
 ${vis.events?`<div class="card"><h3>Upcoming Events</h3>${up.length?up.map(e=>`<div class="item"><span style="width:10px;height:10px;border-radius:50%;background:${esc(e.color||'#8B5CF6')}"></span><div class="grow"><b>${esc(e.title)}</b><br><small class="muted">${fmtDate(e.start)} ${fmtTime(e.start)}</small></div></div>`).join(''):'<p class="muted">No upcoming events.</p>'}</div>`:''}
 ${vis.notes?`<div class="card"><h3>Recent Notes</h3>${rn.length?rn.map(n=>`<div class="item"><div class="grow"><b>${esc(n.title||'Untitled')}</b><br><small class="muted">${fmtDate(n.updatedAt)}</small></div></div>`).join(''):'<p class="muted">No notes yet.</p>'}</div>`:''}
 ${vis.files?`<div class="card"><h3>Recent Files</h3>${rf.length?rf.map(f=>`<div class="item"><div class="grow"><b>${esc(f.name)}</b><br><small class="muted">${fmtDate(f.addedAt)}</small></div></div>`).join(''):'<p class="muted">No files yet.</p>'}</div>`:''}
 </div>`;
 const iv=setInterval(()=>{const c=document.getElementById('clock');if(!c){clearInterval(iv);return}c.textContent=fmtTime(Date.now())},1000);
 el.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{sessionStorage.setItem('nexora-act',b.dataset.act||'');location.hash='#/'+b.dataset.go});
 el.querySelectorAll('.wgt').forEach(c=>c.onchange=async()=>{vis[c.value]=c.checked?1:0;await db.setMeta('widgets',vis);render(el,ctx)});
}
