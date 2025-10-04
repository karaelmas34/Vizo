import { getJobStatus } from './apiService';
export type JobState = 'queued' | 'running' | 'done' | 'error';
export interface TrackedJob { id: string; status: JobState; video_path?: string|null; error?: string|null; startedAt: number; }
type Listener = (jobs: TrackedJob[]) => void;
const LS_KEY='activeJobs'; let jobs: TrackedJob[]=[]; let listeners:Listener[]=[]; let timer:number|null=null;
function load(){ try{ const raw=localStorage.getItem(LS_KEY); jobs=raw?JSON.parse(raw):[] }catch{ jobs=[] } }
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(jobs)); }
export function subscribe(fn:Listener){ listeners.push(fn); fn(jobs); return ()=>{ listeners=listeners.filter(l=>l!==fn) } }
function emit(){ listeners.forEach(l=>l(jobs)); }
export function add(jobId:string){ if(!jobs.find(j=>j.id===jobId)){ jobs.unshift({id:jobId,status:'queued',startedAt:Date.now()}); save(); emit(); ensurePolling(); } }
export function remove(jobId:string){ jobs=jobs.filter(j=>j.id!==jobId); save(); emit(); if(jobs.length===0) stopPolling(); }
export function list():TrackedJob[]{ return jobs.slice(); }
async function tickOnce(){ const updated:TrackedJob[]=[]; for(const j of jobs){ try{ const st=await getJobStatus(j.id); const nj:TrackedJob={...j,status:st.status as JobState,video_path:st.video_path,error:st.error}; updated.push(nj); const done=j.status!=='done'&&st.status==='done'; const err=j.status!=='error'&&st.status==='error'; if(done) notify('Video hazır 🎉',`Job #${j.id} tamamlandı`); if(err) notify('İşlem hatası', st.error||`Job #${j.id} failed`); }catch{ updated.push({...j,status:'error',error:'Status alınamadı'}) } } jobs=updated; save(); emit(); const now=Date.now(); jobs=jobs.filter(j=>!((j.status==='done'||j.status==='error')&&(now-j.startedAt)>=5*60*1000)); save(); emit(); }
function ensurePolling(){ if(timer!=null) return; timer=window.setInterval(()=>{ tickOnce(); },4000); }
function stopPolling(){ if(timer!=null){ window.clearInterval(timer); timer=null; } }
export function init(){ load(); emit(); if(jobs.length) ensurePolling(); }
function notify(title:string, body:string){ try{ if('Notification'in window){ if(Notification.permission==='granted'){ new Notification(title,{body}); return } else if(Notification.permission!=='denied'){ Notification.requestPermission().then(p=>{ if(p==='granted') new Notification(title,{body}) }) } } }catch{} try{ const el=document.createElement('div'); el.textContent=`${title} — ${body}`; el.style.cssText='position:fixed;right:16px;top:16px;background:#111;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:9999;font-size:14px;'; document.body.appendChild(el); setTimeout(()=>{ el.remove(); },4000); }catch{} }
init();
