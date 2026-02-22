"use client";
import { useState, useEffect, useMemo, useCallback } from "react";

/* ══ SUPABASE CLIENT ═══ */
const SUPA_URL = "https://zkxwpkwlkbtzeocjvubc.supabase.co";
const SUPA_KEY = "sb_publishable_Bamzthf5K8VwgHV9P0vx_A_C_OG9tmQ";

async function supa(path, opts = {}) {
  const { method = "GET", body, single = false, headers: h2 = {} } = opts;
  const token = window._sbToken || SUPA_KEY;
  const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...h2 };
  if (single) headers["Accept"] = "application/vnd.pgrst.object+json";
  if (opts.prefer) headers["Prefer"] = opts.prefer;
  const res = await fetch(`${SUPA_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) { const err = await res.text().catch(() => "Unknown"); throw new Error(`${res.status}: ${err}`); }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function signIn(email, password) {
  const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: SUPA_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid email or password");
  return await res.json();
}

/* ══ LOOKUPS ═══ */
const VARIANTS = [["Standard","NV"],["DocBlock","DB"],["RPF In-house","RV"],["RPF Labs","RL"],["Grower's Choice","GC"],["Preorder","PR"],["Bundle","BN"],["Specimen","SM"]];
const SIZES = [['2.5" Sq',"2S"],['3.25" Sq',"3S"],['3.5" Tall',"3T"],['4.5" Rd',"4R"],['5" Rd',"5R"],['6.5" Rd',"6R"],['10" Rd',"10"],["Plug","PG"],["Cutting","CT"],["Rehab","RH"],["Quarantine","QR"],["Mother","MO"]];
const SUPPLIERS = [["RPF Nursery","00"],["RPF Labs","01"],["RPF Secondary","02"],["DocBlock","10"],["Agri-Starts","11"],["Xai Leggett","12"],["Wuhoo Tropicals","13"],["Rare Plants TC","20"],["Casa Botanica","30"],["Casa Flora","31"],["Green Circle","50"],["Other","99"]];
const PRODS = [["Tissue culture","T"],["Seed","S"],["Stem cutting","C"],["Leaf cutting","L"],["Division","D"],["Imported","I"],["Import plug","P"]];
const STATUSES = ["Growing","Quarantine","Rehab","Sellable","Reserved","Sold","Shipped","Mother","Divided"];
const ZONES = ["Greenhouse A","Greenhouse B","Showroom","Quarantine Bay","Fulfillment Zone","Staging","Pickup Zone"];
const STC = {Growing:"#4A7C59",Quarantine:"#C17817",Rehab:"#9B5DE5",Sellable:"#2D8F2D",Reserved:"#2563EB",Sold:"#0891B2",Shipped:"#6B7280",Mother:"#9333EA",Divided:"#4B5563"};

/* ══ QR CODE ═══ */
function makeQR(text) {
  const s=21,m=Array.from({length:s},()=>Array(s).fill(false));
  const fp=(ox,oy)=>{for(let i=0;i<7;i++)for(let j=0;j<7;j++)m[oy+i][ox+j]=i===0||i===6||j===0||j===6||(i>=2&&i<=4&&j>=2&&j<=4)};
  fp(0,0);fp(s-7,0);fp(0,s-7);
  for(let i=7;i<s-7;i++){m[6][i]=i%2===0;m[i][6]=i%2===0}
  let h=0;for(let i=0;i<text.length;i++)h=((h<<5)-h+text.charCodeAt(i))|0;
  let seed=Math.abs(h);
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){if(m[y][x])continue;if(y<7&&x<7)continue;if(y<7&&x>=s-7)continue;if(y>=s-7&&x<7)continue;seed=(seed*1103515245+12345)&0x7fffffff;m[y][x]=seed%3!==0}
  return m;
}
function QRCode({text,size=120}){const matrix=makeQR(text),n=matrix.length,cs=size/n;return<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:"block"}}>{matrix.map((row,y)=>row.map((cell,x)=>cell?<rect key={`${y}-${x}`} x={x*cs} y={y*cs} width={cs+.5} height={cs+.5} fill="#1a1a1a"/>:null))}</svg>}

/* ══ HELPERS ═══ */
const supName=c=>(SUPPLIERS.find(s=>s[1]===c)||["?"])[0];
const prodName=c=>(PRODS.find(s=>s[1]===c)||["?"])[0];
const Badge=({status})=>{const c=STC[status]||"#888";return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700,background:c+"1A",color:c,whiteSpace:"nowrap"}}>{status}</span>};
const Ic=({d,s:sz=15})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const ico={leaf:"M17 8C8 10 5.9 16.09 3.82 21.18M12.35 5.65A8 8 0 0 1 20 12c0 4-3 8-8 8s-8-4-8-8a8 8 0 0 1 5.65-7.65",flask:"M9 3h6v2H9zM10 5v6.5L5 21h14l-5-9.5V5",search:"M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5zM16 16l4.5 4.5",plus:"M12 5v14M5 12h14",box:"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",x:"M18 6L6 18M6 6l12 12",chk:"M20 6L9 17l-5-5",back:"M19 12H5M12 19l-7-7 7-7",print:"M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",tag:"M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",clock:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",out:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",refresh:"M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"};

/* ══ FONT LOADER ═══ */
const loadFonts=()=>{if(document.getElementById("rpf-f"))return;const l=document.createElement("link");l.id="rpf-f";l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@400;500;600&display=swap";document.head.appendChild(l)};

/* ══ STYLES ═══ */
const S={
  app:{display:"flex",height:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",color:"#1A1A18",fontSize:13},
  sb:{width:220,background:"#1B3D1B",color:"#fff",display:"flex",flexDirection:"column",flexShrink:0},
  ni:a=>({display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:5,cursor:"pointer",fontSize:12,fontWeight:a?600:500,color:a?"#fff":"rgba(255,255,255,.5)",background:a?"#2D5F2D":"transparent",border:"none",width:"100%",textAlign:"left",fontFamily:"inherit"}),
  niBg:{marginLeft:"auto",background:"rgba(255,255,255,.12)",padding:"1px 6px",borderRadius:10,fontSize:10,fontWeight:600},
  main:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#F5F4EF"},
  top:{height:50,background:"#fff",borderBottom:"1px solid #E0DED6",display:"flex",alignItems:"center",padding:"0 18px",gap:10,flexShrink:0},
  cnt:{flex:1,overflowY:"auto",padding:18},
  sg:n=>({display:"grid",gridTemplateColumns:`repeat(${n},1fr)`,gap:8,marginBottom:16}),
  sc:{background:"#fff",borderRadius:8,padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,.05)",cursor:"pointer"},
  scL:{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,color:"#8A8A84"},
  scV:c=>({fontSize:24,fontWeight:800,letterSpacing:-1,marginTop:2,color:c||"#1A1A18"}),
  scS:{fontSize:10,color:"#8A8A84",marginTop:1},
  cd:{background:"#fff",borderRadius:8,boxShadow:"0 1px 3px rgba(0,0,0,.05)",overflow:"hidden",marginBottom:12},
  ch:{padding:"10px 14px",borderBottom:"1px solid #ECEAE3",display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,flexWrap:"wrap"},
  fb:{display:"flex",gap:4,flexWrap:"wrap",marginTop:6},
  ft:a=>({padding:"3px 8px",borderRadius:10,fontSize:10,fontWeight:600,border:`1px solid ${a?"#2D5F2D":"#E0DED6"}`,background:a?"#2D5F2D":"#fff",color:a?"#fff":"#4A4A46",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}),
  btn:v=>({display:"inline-flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:5,fontSize:11,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit",...(v==="p"?{background:"#2D5F2D",color:"#fff"}:v==="o"?{background:"transparent",border:"1px solid #E0DED6",color:"#4A4A46"}:v==="a"?{background:"#C17817",color:"#fff"}:{background:"#2D5F2D",color:"#fff"})}),
  th:{textAlign:"left",padding:"7px 12px",fontSize:9.5,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,color:"#8A8A84",background:"#F5F4EF",borderBottom:"1px solid #E0DED6",cursor:"pointer",whiteSpace:"nowrap"},
  td:{padding:"7px 12px",borderBottom:"1px solid #ECEAE3",verticalAlign:"middle"},
  sku:{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,fontWeight:500,color:"#1B3D1B",letterSpacing:.3},
  fi:{width:"100%",padding:"7px 9px",border:"1px solid #E0DED6",borderRadius:5,fontSize:11,fontFamily:"inherit",outline:"none",background:"#fff"},
  mo:{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100},
  md:{background:"#fff",borderRadius:12,width:"92%",maxWidth:520,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.18)"},
  skp:{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:"#1B3D1B",background:"#E5EFE5",padding:"9px 12px",borderRadius:5,textAlign:"center",letterSpacing:1,marginBottom:12},
  dg:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14},
  ds:{background:"#F5F4EF",borderRadius:5,padding:12},
  dsH:{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,color:"#8A8A84",marginBottom:7},
  dr:{display:"flex",justifyContent:"space-between",padding:"2.5px 0",fontSize:11},
  qrs:{display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:"#fff",border:"2px dashed #E0DED6",borderRadius:8,padding:14},
  ai:{display:"flex",gap:9,padding:"9px 12px",borderBottom:"1px solid #ECEAE3",fontSize:11},
  login:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#F5F4EF",fontFamily:"'DM Sans',system-ui,sans-serif"},
  loginBox:{background:"#fff",borderRadius:12,padding:32,width:360,boxShadow:"0 4px 24px rgba(0,0,0,.08)"},
  err:{background:"#FEE2E2",color:"#DC2626",padding:"8px 12px",borderRadius:5,fontSize:11,fontWeight:600,marginBottom:12},
  loading:{display:"flex",alignItems:"center",justifyContent:"center",padding:40,color:"#8A8A84",fontSize:13},
};

/* ══ LOGIN ═══ */
function Login({onLogin}){
  const[email,setEmail]=useState("");const[pw,setPw]=useState("");const[err,setErr]=useState("");const[loading,setLoading]=useState(false);
  const submit=async()=>{setErr("");setLoading(true);try{const d=await signIn(email,pw);onLogin(d)}catch(e){setErr(e.message)}setLoading(false)};
  return(
    <div style={S.login}><div style={S.loginBox}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:28,fontWeight:800,color:"#1B3D1B"}}>🌿 Rare Plant Fairy</div>
        <div style={{fontSize:12,color:"#8A8A84",marginTop:4}}>Inventory System</div>
      </div>
      {err&&<div style={S.err}>{err}</div>}
      <div style={{marginBottom:12}}><label style={{display:"block",fontSize:10,fontWeight:600,color:"#4A4A46",marginBottom:2}}>Email</label><input style={S.fi} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@rareplantfairy.com" onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
      <div style={{marginBottom:16}}><label style={{display:"block",fontSize:10,fontWeight:600,color:"#4A4A46",marginBottom:2}}>Password</label><input style={S.fi} type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
      <button style={{...S.btn("p"),width:"100%",justifyContent:"center",padding:"10px 16px",fontSize:13}} onClick={submit} disabled={loading}>{loading?"Signing in…":"Sign In"}</button>
      <div style={{textAlign:"center",marginTop:16,fontSize:10,color:"#8A8A84"}}>Admin creates accounts in Supabase → Authentication → Users</div>
    </div></div>
  );
}

/* ══ SORTABLE TABLE ═══ */
function FTable({items,cols,onRow,stF,setStF,znF,setZnF,searchQ}){
  const[sCol,setSCol]=useState(null);const[sDir,setSDir]=useState("asc");
  const data=useMemo(()=>{let f=items;if(searchQ){const q=searchQ.toLowerCase();f=f.filter(i=>i.sku?.toLowerCase().includes(q)||i.name?.toLowerCase().includes(q)||(i.zone||"").toLowerCase().includes(q))}if(stF)f=f.filter(i=>i.status===stF);if(znF)f=f.filter(i=>i.zone===znF);if(sCol)f=[...f].sort((a,b)=>{let va=a[sCol],vb=b[sCol];if(typeof va==="number"&&typeof vb==="number")return sDir==="asc"?va-vb:vb-va;return sDir==="asc"?String(va||"").localeCompare(String(vb||"")):String(vb||"").localeCompare(String(va||""))});return f},[items,searchQ,stF,znF,sCol,sDir]);
  const stCounts=useMemo(()=>{let b=items;if(searchQ){const q=searchQ.toLowerCase();b=b.filter(i=>i.sku?.toLowerCase().includes(q)||i.name?.toLowerCase().includes(q))}if(znF)b=b.filter(i=>i.zone===znF);const c={};b.forEach(i=>{c[i.status]=(c[i.status]||0)+1});return c},[items,searchQ,znF]);
  const zones=useMemo(()=>[...new Set(items.map(i=>i.zone).filter(Boolean))].sort(),[items]);
  const arrow=sDir==="asc"?" ↑":" ↓";
  return(<div>
    <div style={{...S.ch,flexDirection:"column",alignItems:"stretch",gap:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,fontWeight:800}}>{data.length} records</span>
        <select style={{...S.fi,width:"auto",padding:"3px 6px",fontSize:10}} value={znF} onChange={e=>setZnF(e.target.value)}><option value="">All Zones</option>{zones.map(z=><option key={z} value={z}>{z}</option>)}</select>
      </div>
      <div style={S.fb}>
        <button style={S.ft(!stF)} onClick={()=>setStF("")}>All <b style={{marginLeft:2}}>{items.length}</b></button>
        {Object.entries(stCounts).sort((a,b)=>b[1]-a[1]).map(([s,c])=>(<button key={s} style={S.ft(stF===s)} onClick={()=>setStF(stF===s?"":s)}><span style={{display:"inline-block",width:5,height:5,borderRadius:3,background:STC[s]||"#999",marginRight:3}}/>{s} <b style={{marginLeft:2}}>{c}</b></button>))}
      </div>
    </div>
    <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr>{cols.map(c=><th key={c.k} style={S.th} onClick={()=>{if(sCol===c.k)setSDir(d=>d==="asc"?"desc":"asc");else{setSCol(c.k);setSDir("asc")}}}>{c.l}{sCol===c.k?arrow:""}</th>)}</tr></thead><tbody>
      {data.map(it=><tr key={it.id} onClick={()=>onRow(it)} style={{cursor:"pointer"}}>{cols.map(c=><td key={c.k} style={S.td}>{c.r?c.r(it):it[c.k]}</td>)}</tr>)}
      {data.length===0&&<tr><td colSpan={cols.length} style={{...S.td,textAlign:"center",padding:24,color:"#8A8A84"}}>No items match.</td></tr>}
    </tbody></table></div>
  </div>);
}

/* ══ DETAIL ═══ */
function Detail({item,onBack,onStatusChange}){
  const[ns,setNs]=useState("");const[saving,setSaving]=useState(false);
  const doSave=async()=>{setSaving(true);try{await onStatusChange(item.id,item.sku,item.status,ns);setNs("")}catch(e){alert("Error: "+e.message)}setSaving(false)};
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
      <button style={S.btn("o")} onClick={onBack}><Ic d={ico.back} s={13}/> Back</button>
      <span style={{fontSize:16,fontWeight:800}}>{item.name}</span><Badge status={item.status}/>
    </div>
    <div style={S.dg}>
      <div>
        <div style={S.ds}><div style={S.dsH}>Identification</div>
          {[["SKU",<span style={S.sku}>{item.sku}</span>],["PLANT",item.plant_code],["Variant",(VARIANTS.find(v=>v[1]===item.variant)||[])[0]||item.variant],["Size",item.size],["Source",supName(item.source)],["Production",prodName(item.production)],["Batch",item.batch]].map(([k,v],i)=><div key={i} style={S.dr}><span style={{color:"#8A8A84"}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>)}
        </div>
        <div style={{...S.ds,marginTop:8}}><div style={S.dsH}>Location</div>
          {[["Zone",item.zone],["Station",item.station||"—"],["Qty",<span style={{fontWeight:800,fontSize:14}}>{item.qty}</span>],["Created",new Date(item.created_at).toLocaleDateString()]].map(([k,v],i)=><div key={i} style={S.dr}><span style={{color:"#8A8A84"}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>)}
          {item.notes&&<div style={S.dr}><span style={{color:"#8A8A84"}}>Notes</span><span style={{maxWidth:180,textAlign:"right"}}>{item.notes}</span></div>}
        </div>
      </div>
      <div>
        <div style={S.qrs}><QRCode text={`app.rareplantfairy.com/inv/${item.sku}`} size={130}/><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#8A8A84"}}>{item.sku}</div><button style={S.btn("o")}><Ic d={ico.print} s={12}/> Print Label</button></div>
        <div style={{...S.ds,marginTop:8}}><div style={S.dsH}>Update Status</div>
          <div style={{display:"flex",gap:5}}>
            <select style={{...S.fi,flex:1}} value={ns} onChange={e=>setNs(e.target.value)}><option value="">Select…</option>{STATUSES.filter(s=>s!==item.status).map(s=><option key={s} value={s}>{s}</option>)}</select>
            <button style={{...S.btn("p"),opacity:(!ns||saving)?.4:1}} disabled={!ns||saving} onClick={doSave}>{saving?"…":"Save"}</button>
          </div>
        </div>
      </div>
    </div>
  </div>);
}

/* ══ SKU MODAL ═══ */
function SKUModal({plants,onClose,onAdd}){
  const[f,sF]=useState({plant_code:"",vr:"NV",sz:"",src:"00",p:"C",bt:"01",name:"",qty:1,zone:"",station:"",notes:""});
  const[saving,setSaving]=useState(false);const[err,setErr]=useState("");
  const u=(k,v)=>sF(p=>({...p,[k]:v}));
  const sku=f.plant_code.length===5&&f.vr&&f.sz&&f.src&&f.p&&f.bt?`${f.plant_code}${f.vr}${f.sz}${f.src}${f.p}${f.bt.padStart(2,"0")}`:"";
  const pickPlant=code=>{const pl=plants.find(p=>p.plant_code===code);u("plant_code",code);if(pl)u("name",pl.marketing_name)};
  const Fl=({label,children})=><div style={{marginBottom:10}}><label style={{display:"block",fontSize:10,fontWeight:600,color:"#4A4A46",marginBottom:2}}>{label}</label>{children}</div>;
  const doCreate=async()=>{setSaving(true);setErr("");try{await onAdd({sku,plant_code:f.plant_code,name:f.name,variant:f.vr,size:f.sz,source:f.src,production:f.p,batch:f.bt.padStart(2,"0"),status:"Growing",qty:parseInt(f.qty)||1,zone:f.zone,station:f.station||null,notes:f.notes||null});onClose()}catch(e){setErr(e.message)}setSaving(false)};
  return(
    <div style={S.mo} onClick={onClose}><div style={S.md} onClick={e=>e.stopPropagation()}>
      <div style={{padding:"14px 18px",borderBottom:"1px solid #ECEAE3",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:14,fontWeight:800}}>New Plant</span><button style={S.btn("o")} onClick={onClose}><Ic d={ico.x} s={12}/></button></div>
      <div style={{padding:18}}>
        <div style={S.skp}>{sku||"Fill fields…"}</div>
        {err&&<div style={S.err}>{err}</div>}
        <Fl label="Species / Name"><input style={S.fi} value={f.name} onChange={e=>u("name",e.target.value)} placeholder="A. crystallinum"/></Fl>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Fl label="PLANT Code">{plants.length>0?<select style={S.fi} value={f.plant_code} onChange={e=>pickPlant(e.target.value)}><option value="">Select…</option>{plants.map(p=><option key={p.plant_code} value={p.plant_code}>{p.plant_code} — {p.marketing_name}</option>)}</select>:<input style={{...S.fi,fontFamily:"'JetBrains Mono',monospace"}} value={f.plant_code} onChange={e=>u("plant_code",e.target.value.toUpperCase())} maxLength={5}/>}</Fl>
          <Fl label="Variant"><select style={S.fi} value={f.vr} onChange={e=>u("vr",e.target.value)}>{VARIANTS.map(v=><option key={v[1]} value={v[1]}>{v[1]} — {v[0]}</option>)}</select></Fl>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Fl label="Size"><select style={S.fi} value={f.sz} onChange={e=>u("sz",e.target.value)}><option value="">Select…</option>{SIZES.map(s=><option key={s[1]} value={s[1]}>{s[1]} — {s[0]}</option>)}</select></Fl>
          <Fl label="Source"><select style={S.fi} value={f.src} onChange={e=>u("src",e.target.value)}>{SUPPLIERS.map(s=><option key={s[1]} value={s[1]}>{s[1]} — {s[0]}</option>)}</select></Fl>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Fl label="Production"><select style={S.fi} value={f.p} onChange={e=>u("p",e.target.value)}>{PRODS.map(p=><option key={p[1]} value={p[1]}>{p[1]} — {p[0]}</option>)}</select></Fl>
          <Fl label="Batch #"><input style={{...S.fi,fontFamily:"'JetBrains Mono',monospace"}} value={f.bt} onChange={e=>u("bt",e.target.value)} maxLength={2}/></Fl>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <Fl label="Qty"><input style={S.fi} type="number" min="1" value={f.qty} onChange={e=>u("qty",e.target.value)}/></Fl>
          <Fl label="Zone"><select style={S.fi} value={f.zone} onChange={e=>u("zone",e.target.value)}><option value="">Select…</option>{ZONES.map(z=><option key={z} value={z}>{z}</option>)}</select></Fl>
          <Fl label="Station"><input style={S.fi} value={f.station} onChange={e=>u("station",e.target.value)} placeholder="Bench 2"/></Fl>
        </div>
        <Fl label="Notes (optional)"><input style={S.fi} value={f.notes} onChange={e=>u("notes",e.target.value)} placeholder="Import notes…"/></Fl>
      </div>
      <div style={{padding:"12px 18px",borderTop:"1px solid #ECEAE3",display:"flex",justifyContent:"flex-end",gap:6}}>
        <button style={S.btn("o")} onClick={onClose}>Cancel</button>
        <button style={{...S.btn("p"),opacity:(!sku||!f.name||!f.zone||saving)?.4:1}} disabled={!sku||!f.name||!f.zone||saving} onClick={doCreate}><Ic d={ico.plus} s={12}/> {saving?"Creating…":"Create"}</button>
      </div>
    </div></div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* MAIN APP                                                                   */
/* ════════════════════════════════════════════════════════════════════════════ */
export default function App(){
  useEffect(()=>{loadFonts()},[]);
  const[auth,setAuth]=useState(null);
  const[inv,setInv]=useState([]);const[logData,setLogData]=useState([]);const[plants,setPlants]=useState([]);
  const[loading,setLoading]=useState(false);const[dash,setDash]=useState("grow");
  const[sel,setSel]=useState(null);const[modal,setModal]=useState(false);
  const[sq,setSq]=useState("");const[stF,setStF]=useState("");const[znF,setZnF]=useState("");
  const[toast,setToast]=useState("");
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),3000)};
  const handleLogin=data=>{setAuth(data);window._sbToken=data.access_token};
  const handleLogout=()=>{setAuth(null);window._sbToken=null};

  const loadData=useCallback(async()=>{if(!auth)return;setLoading(true);try{const[i,l,p]=await Promise.all([supa("/rest/v1/inventory?select=*&order=name.asc"),supa("/rest/v1/activity_log?select=*&order=created_at.desc&limit=50"),supa("/rest/v1/plant_registry?select=*&order=marketing_name.asc")]);setInv(i||[]);setLogData(l||[]);setPlants(p||[])}catch(e){showToast("Error: "+e.message)}setLoading(false)},[auth]);
  useEffect(()=>{if(auth)loadData()},[auth,loadData]);

  const onStatusChange=async(id,sku,oldSt,newSt)=>{await supa(`/rest/v1/inventory?id=eq.${id}`,{method:"PATCH",body:{status:newSt},prefer:"return=representation"});await supa("/rest/v1/activity_log",{method:"POST",body:{inventory_id:id,sku,action:"status_change",old_value:oldSt,new_value:newSt,detail:`${oldSt} → ${newSt}`},prefer:"return=minimal"});showToast(`${sku} → ${newSt}`);await loadData();if(sel&&sel.id===id)setSel(p=>({...p,status:newSt}))};
  const onAdd=async record=>{await supa("/rest/v1/inventory",{method:"POST",body:record,prefer:"return=minimal"});await supa("/rest/v1/activity_log",{method:"POST",body:{sku:record.sku,action:"created",new_value:record.status,detail:`${record.name} · Qty: ${record.qty} · ${record.zone}`},prefer:"return=minimal"});showToast(`Created ${record.sku}`);await loadData()};

  if(!auth)return<Login onLogin={handleLogin}/>;

  const nSt={sellable:inv.filter(i=>i.status==="Sellable").reduce((a,b)=>a+b.qty,0),growing:inv.filter(i=>i.status==="Growing").reduce((a,b)=>a+b.qty,0),mothers:inv.filter(i=>i.status==="Mother").length,rehab:inv.filter(i=>i.status==="Rehab").reduce((a,b)=>a+b.qty,0),quar:inv.filter(i=>i.status==="Quarantine").reduce((a,b)=>a+b.qty,0),reserved:inv.filter(i=>i.status==="Reserved").reduce((a,b)=>a+b.qty,0),total:inv.reduce((a,b)=>a+b.qty,0)};

  const nurseCols=[{k:"sku",l:"SKU",r:it=><span style={S.sku}>{it.sku}</span>},{k:"name",l:"Name",r:it=><b>{it.name}</b>},{k:"status",l:"Status",r:it=><Badge status={it.status}/>},{k:"qty",l:"Qty",r:it=><b style={{fontSize:12}}>{it.qty}</b>},{k:"size",l:"Size"},{k:"zone",l:"Zone",r:it=><span style={{fontSize:10,color:"#8A8A84"}}>{it.zone}</span>}];
  const fulfillCols=[{k:"sku",l:"SKU",r:it=><span style={S.sku}>{it.sku}</span>},{k:"name",l:"Name",r:it=><b>{it.name}</b>},{k:"qty",l:"Qty",r:it=><b>{it.qty}</b>},{k:"zone",l:"Zone"},{k:"station",l:"Station",r:it=>it.station||"—"},{k:"_",l:"Action",r:it=><button style={S.btn("p")} onClick={e=>{e.stopPropagation();onStatusChange(it.id,it.sku,it.status,"Shipped")}}><Ic d={ico.chk} s={11}/> Ship</button>}];

  const navs=[{sec:"Team Dashboards"},{k:"grow",l:"Grow Team",ic:ico.leaf,bg:inv.filter(i=>["Growing","Rehab","Quarantine","Mother"].includes(i.status)).length},{k:"sales",l:"Sales & Marketing",ic:ico.tag,bg:inv.filter(i=>i.status==="Sellable").length},{k:"fulfill",l:"Fulfillment",ic:ico.box,bg:inv.filter(i=>i.status==="Sold").length},{sec:"Operations"},{k:"all",l:"All Inventory",ic:ico.leaf},{k:"log",l:"Activity Log",ic:ico.clock}];
  const dashLabel=navs.find(n=>n.k===dash)?.l||dash;

  const renderContent=()=>{
    if(loading&&inv.length===0)return<div style={S.loading}>Loading inventory…</div>;
    if(sel)return<Detail item={sel} onBack={()=>setSel(null)} onStatusChange={onStatusChange}/>;
    switch(dash){
      case"grow":{const items=inv.filter(i=>["Growing","Rehab","Quarantine","Mother","Reserved"].includes(i.status));return<div><div style={S.sg(5)}>{[["Growing",nSt.growing,"#4A7C59","in pipeline"],["Mothers",nSt.mothers,"#9333EA","stock plants"],["Quarantine",nSt.quar,"#C17817","awaiting clear"],["Rehab",nSt.rehab,"#9B5DE5","recovering"],["Total",nSt.total,"#1A1A18","all plants"]].map(([l,v,c,s],i)=><div key={i} style={S.sc} onClick={()=>{if(i<4)setStF(["Growing","Mother","Quarantine","Rehab"][i])}}><div style={S.scL}>{l}</div><div style={S.scV(c)}>{v}</div><div style={S.scS}>{s}</div></div>)}</div><div style={S.cd}><FTable items={items} cols={nurseCols} onRow={setSel} stF={stF} setStF={setStF} znF={znF} setZnF={setZnF} searchQ={sq}/></div></div>}
      case"sales":{const sellable=inv.filter(i=>["Sellable","Reserved","Sold"].includes(i.status));return<div><div style={S.sg(3)}>{[["Sellable",nSt.sellable,"#2D8F2D","ready to list"],["Reserved",nSt.reserved,"#2563EB","holds"],["Pipeline",nSt.growing,"#C17817","growing → sellable"]].map(([l,v,c,s],i)=><div key={i} style={S.sc}><div style={S.scL}>{l}</div><div style={S.scV(c)}>{v}</div><div style={S.scS}>{s}</div></div>)}</div><div style={S.cd}><FTable items={sellable} cols={nurseCols} onRow={setSel} stF={stF} setStF={setStF} znF={znF} setZnF={setZnF} searchQ={sq}/></div></div>}
      case"fulfill":{const sold=inv.filter(i=>i.status==="Sold");return<div><div style={S.sg(2)}><div style={S.sc}><div style={S.scL}>To Ship</div><div style={S.scV("#2563EB")}>{sold.reduce((a,b)=>a+b.qty,0)}</div><div style={S.scS}>{sold.length} batches</div></div><div style={S.sc}><div style={S.scL}>Shipped</div><div style={S.scV("#6B7280")}>{inv.filter(i=>i.status==="Shipped").length}</div></div></div><div style={S.cd}>{sold.length===0?<div style={{padding:30,textAlign:"center",color:"#8A8A84"}}>No items awaiting fulfillment.</div>:<FTable items={sold} cols={fulfillCols} onRow={setSel} stF={stF} setStF={setStF} znF={znF} setZnF={setZnF} searchQ={sq}/>}</div></div>}
      case"all":return<div style={S.cd}><FTable items={inv} cols={nurseCols} onRow={setSel} stF={stF} setStF={setStF} znF={znF} setZnF={setZnF} searchQ={sq}/></div>;
      case"log":return<div style={S.cd}>{logData.length===0?<div style={{padding:30,textAlign:"center",color:"#8A8A84"}}>No activity yet. Create your first plant!</div>:logData.map(a=><div key={a.id} style={S.ai}><div style={{width:6,height:6,borderRadius:"50%",marginTop:5,flexShrink:0,background:a.action==="status_change"?"#2563EB":a.action==="created"?"#4A7C59":"#8A8A84"}}/><div style={{flex:1}}><div><b>{a.action}</b> <span style={{...S.sku,fontSize:9}}>{a.sku}</span></div>{a.detail&&<div style={{color:"#4A4A46"}}>{a.detail}</div>}</div><div style={{fontSize:9,color:"#8A8A84",whiteSpace:"nowrap"}}>{new Date(a.created_at).toLocaleString()}</div></div>)}</div>;
      default:return null;
    }
  };

  return(
    <div style={S.app}>
      <div style={S.sb}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,.08)"}}><div style={{fontSize:13,fontWeight:800}}>🌿 Rare Plant Fairy</div><div style={{fontSize:10,opacity:.4,marginTop:1}}>Inventory System</div></div>
        <div style={{flex:1,padding:"4px 6px",overflowY:"auto"}}>
          {navs.map((n,i)=>n.sec?<div key={i} style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,opacity:.28,padding:"14px 10px 4px"}}>{n.sec}</div>:<button key={n.k} style={S.ni(dash===n.k)} onClick={()=>{setDash(n.k);setSel(null);setStF("");setZnF("")}}><Ic d={n.ic} s={14}/><span>{n.l}</span>{n.bg?<span style={S.niBg}>{n.bg}</span>:null}</button>)}
        </div>
        <div style={{padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{fontSize:10,color:"rgba(255,255,255,.4)",marginBottom:4}}>{auth.user?.email}</div>
          <button style={{...S.ni(false),fontSize:11,padding:"5px 8px"}} onClick={handleLogout}><Ic d={ico.out} s={12}/> Sign Out</button>
        </div>
      </div>
      <div style={S.main}>
        <div style={S.top}>
          <span style={{fontSize:14,fontWeight:800,letterSpacing:-.3}}>{sel?sel.name:dashLabel}</span>
          <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:16,background:"#E5EFE5",color:"#2D5F2D"}}>RPF Nursery</span>
          <div style={{flex:1,maxWidth:300,position:"relative"}}><div style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",opacity:.3}}><Ic d={ico.search} s={13}/></div><input style={{width:"100%",padding:"6px 10px 6px 30px",border:"1px solid #E0DED6",borderRadius:5,fontSize:11,fontFamily:"inherit",background:"#F5F4EF",outline:"none"}} placeholder="Search SKU, name, zone…" value={sq} onChange={e=>setSq(e.target.value)}/></div>
          <button style={S.btn("o")} onClick={loadData}><Ic d={ico.refresh} s={12}/></button>
          <button style={S.btn("p")} onClick={()=>setModal(true)}><Ic d={ico.plus} s={12}/> New Plant</button>
        </div>
        <div style={S.cnt}>{renderContent()}</div>
      </div>
      {modal&&<SKUModal plants={plants} onClose={()=>setModal(false)} onAdd={onAdd}/>}
      {toast&&<div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#1B3D1B",color:"#fff",padding:"8px 20px",borderRadius:8,fontSize:12,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,.2)",zIndex:200}}>{toast}</div>}
    </div>
  );
}
