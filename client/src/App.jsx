import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownLeft, Bell, Braces, Check, ChevronDown, Clock3, Copy, FileJson, FlaskConical, Globe2, History, Link2, LoaderCircle, Plus, RefreshCw, Search, Send, ShieldCheck, Trash2, Webhook, X, Zap } from 'lucide-react';
import { api } from './lib/api';

const time = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }); };
const json = (v) => { if (v == null || v === '') return 'No request body'; if (typeof v === 'string') { try { return JSON.stringify(JSON.parse(v), null, 2); } catch { return v; } } try { return JSON.stringify(v,null,2); } catch { return String(v); } };
const short = (v) => (v || '').slice(0,8);

export default function App() {
  const [data,setData] = useState({endpoints:[],requests:[]});
  const [endpointId,setEndpointId] = useState('');
  const [requestId,setRequestId] = useState('');
  const [error,setError] = useState('');
  const [toast,setToast] = useState('');
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState('');
  const [search,setSearch] = useState('');
  const [newOpen,setNewOpen] = useState(false);
  const [name,setName] = useState('');
  const [tab,setTab] = useState('body');
  const [destination,setDestination] = useState('');

  const refresh = useCallback(async (quiet=false) => {
    if (!quiet) setLoading(true);
    try {
      const next = await api.dashboard();
      setData(next); setError('');
      setEndpointId(cur => next.endpoints.some(e => e.id === cur) ? cur : next.endpoints[0]?.id || '');
      setRequestId(cur => next.requests.some(r => r.id === cur) ? cur : next.requests[0]?.id || '');
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  },[]);
  useEffect(() => { refresh(); const timer = setInterval(() => refresh(true),4000); return () => clearInterval(timer); },[refresh]);

  const endpoints = data.endpoints || [];
  const requests = data.requests || [];
  const endpoint = endpoints.find(e => e.id === endpointId);
  const currentRequests = useMemo(() => requests.filter(r => r.endpointId === endpointId),[requests,endpointId]);
  const filtered = useMemo(() => currentRequests.filter(r => {
    const q = search.trim().toLowerCase();
    return !q || [r.method,r.path,r.id,r.eventName,r.bodyText].some(v => String(v || '').toLowerCase().includes(q));
  }),[currentRequests,search]);
  const request = requests.find(r => r.id === requestId && r.endpointId === endpointId) || filtered[0] || currentRequests[0] || null;
  useEffect(() => { if (request && request.id !== requestId) setRequestId(request.id); },[request,requestId]);
  const showToast = (s) => { setToast(s); setTimeout(() => setToast(''),2600); };
  async function copy(value) { try { await navigator.clipboard.writeText(value); showToast('Copied to clipboard'); } catch { showToast('Clipboard unavailable — copy manually'); } }
  async function create(e) {
    e.preventDefault(); if (!name.trim()) return;
    setBusy('create');
    try { const result = await api.create(name.trim()); setName(''); setNewOpen(false); await refresh(true); setEndpointId(result.endpoint.id); showToast('Endpoint created'); }
    catch(e) { setError(e.message); } finally { setBusy(''); }
  }
  async function sample() {
    if (!endpoint) return;
    setBusy('sample');
    try { await api.sample(endpoint.id); await refresh(true); showToast('Sample event captured'); }
    catch(e) { setError(e.message); } finally { setBusy(''); }
  }
  async function remove() {
    if (!endpoint || !confirm(`Delete "${endpoint.name}" and its request history?`)) return;
    try { await api.remove(endpoint.id); setEndpointId(''); setRequestId(''); await refresh(true); showToast('Endpoint deleted'); }
    catch(e) { setError(e.message); }
  }
  async function clear() {
    if (!endpoint || !confirm('Clear all requests for this endpoint?')) return;
    try { await api.clear(endpoint.id); setRequestId(''); await refresh(true); showToast('History cleared'); }
    catch(e) { setError(e.message); }
  }
  async function replay(e) {
    e.preventDefault(); if (!request || !destination.trim()) return;
    setBusy('replay');
    try { const result = await api.replay(request.id,destination.trim()); showToast(`Replay finished · HTTP ${result.status}`); }
    catch(e) { setError(e.message); } finally { setBusy(''); }
  }
  const detail = tab === 'body' ? json(request?.body) : tab === 'headers' ? json(request?.headers || {}) : tab === 'query' ? json(request?.query || {}) : json({id:request?.id,receivedAt:request?.receivedAt,sourceIp:request?.sourceIp,contentLength:request?.contentLength});

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Webhook size={22}/></div><div><b>hooklab<span>.</span></b><small>WEBHOOK WORKSPACE</small></div></div>
      <button className="workspace"><span className="workspace-logo">HL</span><span><b>Personal workspace</b><small>Local development</small></span><ChevronDown size={15}/></button>
      <div className="nav-label">WORKSPACE</div>
      <button className="nav active"><Activity size={17}/> Overview <span className="count">{requests.length}</span></button>
      <button className="nav" onClick={() => setNewOpen(true)}><Webhook size={17}/> Endpoints</button>
      <button className="nav" onClick={() => showToast('Select an endpoint to browse its history')}><History size={17}/> Request history</button>
      <div className="endpoint-title"><span className="nav-label">YOUR ENDPOINTS</span><button className="mini-add" onClick={() => setNewOpen(true)} title="Create endpoint"><Plus size={15}/></button></div>
      <div className="endpoint-list">{endpoints.map(e=><button key={e.id} className={`endpoint-link ${endpointId===e.id?'chosen':''}`} onClick={()=>{setEndpointId(e.id);setSearch('')}}><i/>{e.name}<span>{requests.filter(r=>r.endpointId===e.id).length}</span></button>)}{!endpoints.length&&!loading&&<small className="muted pad">No endpoints yet</small>}</div>
      <div className="sidebar-bottom"><div className="connection"><i/><span>API connection</span><b>{error?'Offline':'Connected'}</b></div><div className="profile"><div className="avatar">D</div><span><b>Developer</b><small>Free workspace</small></span><i/></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> <b>Overview</b></div><div className="top-actions"><span className="environment"><i/> Local environment</span><button className="icon-btn" title="Refresh" onClick={()=>refresh()}><RefreshCw size={16}/></button><button className="icon-btn" title="Notifications" onClick={()=>showToast('You are all caught up')}><Bell size={16}/></button></div></header>
      <div className="content">
        <section className="hero"><div><div className="eyebrow"><i/> DEVELOPER TOOLKIT</div><h1>Webhook <em>Overview</em></h1><p>Inspect incoming events, debug payloads, and replay requests with confidence.</p></div><div className="hero-actions"><button className="btn secondary" disabled={!endpoint||busy==='sample'} onClick={sample}>{busy==='sample'?<LoaderCircle className="spin" size={16}/>:<FlaskConical size={16}/>} Send test event</button><button className="btn primary" onClick={()=>setNewOpen(true)}><Plus size={17}/> New endpoint</button></div></section>
        {error&&<div className="alert"><X size={17}/><div><b>Connection issue</b><span>{error}</span></div><button onClick={()=>setError('')}><X size={15}/></button></div>}
        {toast&&<div className="toast"><Check size={16}/>{toast}</div>}
        <section className="stats">
          <Stat icon={<ArrowDownLeft size={17}/>} tone="purple" label="Total requests" value={requests.length} foot="All captured events"/>
          <Stat icon={<Clock3 size={17}/>} tone="blue" label="Last hour" value={requests.filter(r=>Date.now()-new Date(r.receivedAt).getTime()<3600000).length} foot="Requests received"/>
          <Stat icon={<Webhook size={17}/>} tone="green" label="Active endpoints" value={endpoints.length} foot="Ready to receive"/>
          <Stat icon={<Zap size={17}/>} tone="amber" label="POST requests" value={requests.filter(r=>r.method==='POST').length} foot="Across all endpoints"/>
        </section>

        <section className="panel endpoint-panel">
          <div className="panel-head"><div><div className="kicker">RECEIVING ENDPOINT</div><h2>{endpoint?.name||'Create your first endpoint'}</h2><p>{endpoint?'Send a webhook to this URL to capture it in HookLab.':'Create a unique URL to start inspecting incoming requests.'}</p></div><div className="head-actions">{endpoint&&<><span className="live"><i/> Listening</span><button className="icon-btn danger" title="Delete endpoint" onClick={remove}><Trash2 size={16}/></button></>}</div></div>
          {endpoint?<><div className="url-box"><span className="url-symbol"><Link2 size={17}/></span><code>{api.base}/hooks/{endpoint.id}</code><button onClick={()=>copy(`${api.base}/hooks/${endpoint.id}`)}><Copy size={15}/> Copy URL</button></div><div className="meta"><span><ShieldCheck size={14}/> Public test URL</span><span><Clock3 size={14}/> Created {time(endpoint.createdAt)}</span><span><Activity size={14}/> {currentRequests.length} captured requests</span></div></>:<button className="btn primary" onClick={()=>setNewOpen(true)}><Plus size={16}/> Create endpoint</button>}
        </section>

        <section className="panel">
          <div className="panel-head requests-head"><div><div className="kicker">EVENT STREAM</div><h2>Recent requests <span className="number">{currentRequests.length}</span></h2><p>Incoming webhook traffic for the selected endpoint.</p></div><div className="tools"><label className="search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search requests..."/></label><button className="icon-btn" title="Clear history" disabled={!endpoint||!currentRequests.length} onClick={clear}><Trash2 size={15}/></button></div></div>
          <div className="table-wrap"><table><thead><tr><th>METHOD</th><th>EVENT / PATH</th><th>RECEIVED</th><th>BODY</th><th/></tr></thead><tbody>{filtered.map(r=><tr key={r.id} className={request?.id===r.id?'selected':''} onClick={()=>{setRequestId(r.id);setDestination('')}}><td><span className={`method ${r.method.toLowerCase()}`}>{r.method}</span></td><td><div className="event"><b>{r.eventName||r.path||'/'}</b><small>#{short(r.id)}</small></div></td><td className="muted">{time(r.receivedAt)}</td><td><span className="body-type"><FileJson size={14}/>{r.body==null?'Empty':'JSON / text'}</span></td><td><ChevronDown className="chev" size={15}/></td></tr>)}</tbody></table>
            {!filtered.length&&<div className="empty"><div className="empty-icon"><ArrowDownLeft size={22}/></div><h3>{loading?'Loading requests…':search?'No matching requests':'Waiting for your first event'}</h3><p>{search?'Try another search term.':'Send a test event or POST JSON to the endpoint URL above.'}</p>{!search&&endpoint&&<button className="btn secondary" onClick={sample}><FlaskConical size={15}/> Send sample event</button>}</div>}
          </div>
        </section>

        {request&&<section className="panel inspector">
          <div className="panel-head"><div><div className="kicker">REQUEST INSPECTOR</div><h2>Request details <span className="request-id">#{short(request.id)}</span></h2><p>Received {time(request.receivedAt)} · Source {request.sourceIp||'unknown'}</p></div><button className="btn secondary small" onClick={()=>copy(json(request))}><Copy size={14}/> Copy request</button></div>
          <div className="summary">{[['Method',<span className={`method ${request.method.toLowerCase()}`}>{request.method}</span>],['Path',request.path||'/'],['Content length',`${request.contentLength??0} B`],['Event',request.eventName||'Unspecified']].map(([label,value])=><div key={label}><span>{label}</span><b>{value}</b></div>)}</div>
          <div className="tabs">{[['body','Body',Braces],['headers','Headers',Globe2],['query','Query',Search],['meta','Metadata',ShieldCheck]].map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={15}/>{label}</button>)}<button className="copy-tab" onClick={()=>copy(detail)}><Copy size={14}/> Copy</button></div>
          <pre className="code"><code>{detail}</code></pre>
          <form className="replay" onSubmit={replay}><div className="replay-title"><RefreshCw size={16}/><span><b>Replay this request</b><small>Send captured body to a test destination.</small></span></div><div className="replay-controls"><input type="url" required value={destination} onChange={e=>setDestination(e.target.value)} placeholder="https://your-test-endpoint.example/webhook"/><button className="btn secondary" disabled={busy==='replay'}>{busy==='replay'?<LoaderCircle size={15} className="spin"/>:<Send size={15}/>} Replay</button></div></form>
        </section>}
        <footer><span>© 2026 HookLab</span><span><i/> Built for developers, by developers</span><span>Local-first · Security-aware</span></footer>
      </div>
    </main>

    {newOpen&&<div className="backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setNewOpen(false)}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><div className="modal-top"><div className="modal-icon"><Webhook size={20}/></div><button className="icon-btn" onClick={()=>setNewOpen(false)}><X size={17}/></button></div><h2 id="create-title">Create endpoint</h2><p>Give this endpoint a recognizable name. HookLab will generate a unique receiving URL.</p><form onSubmit={create}><label htmlFor="endpoint-name">Endpoint name</label><input id="endpoint-name" autoFocus required maxLength={60} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Payment webhook"/><div className="security-note"><ShieldCheck size={15}/> Use test events only. Avoid real secrets or sensitive data.</div><div className="modal-actions"><button type="button" className="btn secondary" onClick={()=>setNewOpen(false)}>Cancel</button><button className="btn primary" disabled={busy==='create'||!name.trim()}>{busy==='create'?<LoaderCircle size={15} className="spin"/>:<Plus size={16}/>} Create endpoint</button></div></form></div></div>}
  </div>;
}
function Stat({icon,tone,label,value,foot}) { return <div className="stat"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}>{icon}</span></div><strong>{Number(value).toLocaleString()}</strong><div className="stat-foot">{foot}</div></div>; }
