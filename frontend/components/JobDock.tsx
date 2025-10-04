import React, { useEffect, useState } from 'react';
import { subscribe, list, TrackedJob, remove } from '../services/jobTracker';

const ProgressDot: React.FC<{status: string}> = ({ status }) => {
  const color = status === 'done' ? '#16a34a' : status === 'error' ? '#ef4444' : '#f59e0b';
  return <span style={{ display:'inline-block', width:8, height:8, borderRadius:999, background:color, marginRight:8 }} />;
};

const JobDock: React.FC = () => {
  const [jobs, setJobs] = useState<TrackedJob[]>(list());
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => subscribe(setJobs), []);

  if (jobs.length === 0) return null;

  return (
    <div style={{ position:'fixed', left:0, right:0, bottom:0, zIndex:50 }}>
      <div style={{ margin:'0 auto', maxWidth:1100, borderTop:'1px solid rgba(255,255,255,0.08)', background:'rgba(15,15,15,0.9)', backdropFilter:'blur(6px)' }} className="px-4 py-2">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <strong>İşlem Merkezi</strong>
            <span style={{ opacity:0.7, fontSize:12 }}>{jobs.length} aktif iş</span>
          </div>
          <button onClick={()=>setOpen(!open)} className="text-sm opacity-80 hover:opacity-100">{open?'Kapat':'Aç'}</button>
        </div>
        {open && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            {jobs.map(j => (
              <div key={j.id} className="flex items-center justify-between rounded-xl p-3" style={{ background:'rgba(255,255,255,0.04)' }}>
                <div style={{ display:'flex', alignItems:'center' }}>
                  <ProgressDot status={j.status} />
                  <div>
                    <div className="text-sm font-medium">Job #{j.id.slice(0,8)}</div>
                    <div className="text-xs opacity-70">{j.status}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {j.status==='done' && j.video_path && (
                    <a className="text-sm underline" href={j.video_path.startsWith('http') ? j.video_path : (location.origin + j.video_path)} target="_blank">Aç</a>
                  )}
                  {(j.status==='done' || j.status==='error') && (
                    <button className="text-xs opacity-70 hover:opacity-100" onClick={()=>remove(j.id)}>Kaldır</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDock;
