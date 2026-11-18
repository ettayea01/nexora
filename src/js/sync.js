// Sync abstraction: local data is ALWAYS the source of truth.
// A future cloud adapter implements the same interface (push/pull/resolve)
// and is only invoked when the user explicitly enables sync in Settings.
export const LocalSyncAdapter={name:'local',enabled:false,async push(){return{ok:true,adapter:'local'}},async pull(){return{ok:true,adapter:'local'}},async status(){return{adapter:'local',synced:true,note:'Local-only mode. Cloud sync is not enabled.'}}};
export let syncAdapter=LocalSyncAdapter;
export function setSyncAdapter(a){syncAdapter=a}
