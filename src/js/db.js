// NEXORA IndexedDB wrapper (Dexie-equivalent, zero dependencies)
const DB_NAME='nexora-db', DB_VER=1;
export const STORES=['notes','tasks','events','docs','transactions','budgets','files','focusSessions','meta'];
let _db=null;
export function openDB(){return new Promise((res,rej)=>{if(_db)return res(_db);const r=indexedDB.open(DB_NAME,DB_VER);r.onupgradeneeded=()=>{const d=r.result;STORES.forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:'id'})})};r.onsuccess=()=>{_db=r.result;res(_db)};r.onerror=()=>rej(r.error)})}
function tx(store,mode){return openDB().then(d=>d.transaction(store,mode).objectStore(store))}
function reqP(r){return new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
export const db={
  async put(store,val){const s=await tx(store,'readwrite');return reqP(s.put(val))},
  async get(store,id){const s=await tx(store,'readonly');return reqP(s.get(id))},
  async getAll(store){const s=await tx(store,'readonly');return reqP(s.getAll())},
  async del(store,id){const s=await tx(store,'readwrite');return reqP(s.delete(id))},
  async clear(store){const s=await tx(store,'readwrite');return reqP(s.clear())},
  async clearAll(){for(const s of STORES)await db.clear(s)},
  async getMeta(key,fallback){const m=await db.get('meta',key);return m?m.value:fallback},
  async setMeta(key,value){return db.put('meta',{id:key,value})},
};
export function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,9)}
export const MAX_FILE_BYTES=25*1024*1024;
export async function blobToB64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob)})}
export function b64ToBlob(dataUrl){const[a,b]=dataUrl.split(',');const mime=(a.match(/:(.*?);/)||[])[1]||'application/octet-stream';const bin=atob(b);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new Blob([arr],{type:mime})}
