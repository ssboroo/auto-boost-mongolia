'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Bot,
  Copy,
  FileImage,
  Globe2,
  ImageIcon,
  MessageSquareText,
  Plus,
  Radar,
  Save,
  ScanSearch,
  Sparkles,
  Trash2,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { useUi } from '../../components/ui/UiProvider'
import { apiFetch } from '../../lib/api'
import styles from './page.module.css'

type Tool='scanner'|'assistant'|'creative'|'optimization'|'assets'|'tracking'
type MetaSources={pages:Array<{id:string;name:string;category?:string;picture?:string|null;instagram?:{id:string;username:string;profilePicture?:string|null}|null}>}
type BusinessScan={
 businessName:string;category:string;tone:string;keywords:string[];highlights:string[];contentPillars:string[];
 suggestedObjective:string;suggestedChannels:string[];audience:{country:string;ageMin:number;ageMax:number;interests:string[]};
 campaignSeed:{headline:string;primaryText:string;callToAction:string};sources:any;sourceCount:number;scannedAt:string;engine:string
}
type Asset={id:string;type:'copy'|'image_url'|'video_url'|'prompt';title:string;value:string;tags:string[];createdAt:string}

const TOOLS:Array<{id:Tool;mn:string;en:string;icon:any}>=[
 {id:'scanner',mn:'Business AI Scanner',en:'Business AI Scanner',icon:ScanSearch},
 {id:'assistant',mn:'AI Marketing Assistant',en:'AI Marketing Assistant',icon:Bot},
 {id:'creative',mn:'Creative Studio',en:'Creative Studio',icon:Sparkles},
 {id:'optimization',mn:'Optimization Center',en:'Optimization Center',icon:BarChart3},
 {id:'assets',mn:'Asset Library',en:'Asset Library',icon:FileImage},
 {id:'tracking',mn:'Tracking Center',en:'Tracking Center',icon:Radar},
]

export default function AiStudioPage(){
 const {locale,text}=useUi()
 const [tool,setTool]=useState<Tool>('scanner')
 const [sources,setSources]=useState<MetaSources>({pages:[]}),[sourcesError,setSourcesError]=useState('')
 const [websiteUrl,setWebsiteUrl]=useState(''),[pageId,setPageId]=useState(''),[instagramId,setInstagramId]=useState('')
 const [scan,setScan]=useState<BusinessScan|null>(null),[loadingScan,setLoadingScan]=useState(false),[error,setError]=useState('')
 const [assistantInput,setAssistantInput]=useState(''),[chat,setChat]=useState<Array<{role:'user'|'assistant';text:string}>>([])
 const [strategy,setStrategy]=useState<any>(null),[assistantBusy,setAssistantBusy]=useState(false)
 const [tone,setTone]=useState<'professional'|'friendly'|'bold'|'premium'>('professional'),[offer,setOffer]=useState(''),[creative,setCreative]=useState<any>(null),[creativeBusy,setCreativeBusy]=useState(false)
 const [metrics,setMetrics]=useState({spend:100000,impressions:50000,clicks:650,conversions:12,leads:0,revenue:250000}),[optimization,setOptimization]=useState<any>(null),[optimizationBusy,setOptimizationBusy]=useState(false)
 const [assets,setAssets]=useState<Asset[]>([]),[assetTitle,setAssetTitle]=useState(''),[assetValue,setAssetValue]=useState(''),[assetType,setAssetType]=useState<Asset['type']>('copy')
 const [tracking,setTracking]=useState<any>(null),[trackingBusy,setTrackingBusy]=useState(false),[copied,setCopied]=useState('')

 useEffect(()=>{
   const query=new URLSearchParams(window.location.search).get('tool') as Tool|null
   if(query&&TOOLS.some(x=>x.id===query))setTool(query)
   try{
     const saved=JSON.parse(localStorage.getItem('boost_business_scan')||'null')
     if(saved)setScan(saved)
     const savedAssets=JSON.parse(localStorage.getItem('boost_assets')||'[]')
     if(Array.isArray(savedAssets))setAssets(savedAssets)
   }catch{}
   apiFetch<MetaSources>('/marketing/meta-sources').then(setSources).catch(()=>setSourcesError(text('Meta холбоогүй эсвэл Page permission бэлэн биш байна.','Meta is not connected or Page permissions are not ready.')))
 },[])

 const selectedPage=useMemo(()=>sources.pages.find(p=>p.id===pageId),[sources,pageId])
 useEffect(()=>{if(selectedPage?.instagram?.id)setInstagramId(selectedPage.instagram.id);else if(pageId)setInstagramId('')},[pageId,selectedPage])

 function persistAssets(next:Asset[]){setAssets(next);localStorage.setItem('boost_assets',JSON.stringify(next.slice(0,100)))}
 function addAsset(asset:Omit<Asset,'id'|'createdAt'>){const next=[{...asset,id:crypto.randomUUID(),createdAt:new Date().toISOString()},...assets];persistAssets(next)}
 function removeAsset(id:string){persistAssets(assets.filter(x=>x.id!==id))}
 async function copy(value:string,label='copy'){await navigator.clipboard.writeText(value);setCopied(label);setTimeout(()=>setCopied(''),1400)}

 async function runScan(){
   setLoadingScan(true);setError('')
   try{
     const result=await apiFetch<BusinessScan>('/marketing/scan-business',{method:'POST',body:JSON.stringify({locale,websiteUrl:websiteUrl.trim()||undefined,facebookPageId:pageId||undefined,instagramId:instagramId||undefined})})
     setScan(result)
     setTone((['professional','friendly','bold','premium'].includes(result.tone)?result.tone:'professional') as any)
     setOffer(result.highlights?.[0]||'')
     localStorage.setItem('boost_business_scan',JSON.stringify(result))
   }catch(e:any){setError(e?.message||text('Business scan амжилтгүй.','Business scan failed.'))}finally{setLoadingScan(false)}
 }

 function useForCampaign(){
   if(!scan)return
   localStorage.setItem('boost_ai_campaign_seed',JSON.stringify({
     name:scan.businessName+' campaign',
     channels:scan.suggestedChannels,
     objective:scan.suggestedObjective,
     websiteUrl:scan.sources?.website?.finalUrl||scan.sources?.facebook?.website||scan.sources?.instagram?.website||'',
     headline:scan.campaignSeed.headline,
     primaryText:scan.campaignSeed.primaryText,
     city:'Улаанбаатар',
     ageMin:scan.audience.ageMin,
     ageMax:scan.audience.ageMax,
     interests:scan.audience.interests.join(', '),
   }))
   window.location.assign('/campaigns/new?from=ai')
 }

 async function askAssistant(){
   const message=assistantInput.trim();if(!message)return
   setAssistantInput('');setChat(c=>[...c,{role:'user',text:message}]);setAssistantBusy(true)
   try{
     const r=await apiFetch<any>('/marketing/assistant',{method:'POST',body:JSON.stringify({locale,message,businessScan:scan})})
     setChat(c=>[...c,{role:'assistant',text:r.answer}])
   }catch(e:any){setChat(c=>[...c,{role:'assistant',text:e?.message||text('Assistant хариулж чадсангүй.','Assistant could not respond.')}])}finally{setAssistantBusy(false)}
 }
 async function generateStrategy(){
   setAssistantBusy(true)
   try{setStrategy(await apiFetch('/marketing/strategy',{method:'POST',body:JSON.stringify({locale,businessScan:scan,budgetMnt:300000,durationDays:7})}))}catch(e:any){setError(e?.message||'Strategy failed')}finally{setAssistantBusy(false)}
 }
 async function generateCreative(){
   setCreativeBusy(true);setError('')
   try{setCreative(await apiFetch('/marketing/creative',{method:'POST',body:JSON.stringify({locale,businessScan:scan,offer,tone,channels:scan?.suggestedChannels})}))}catch(e:any){setError(e?.message||text('Creative үүсгэж чадсангүй.','Could not generate creative.'))}finally{setCreativeBusy(false)}
 }
 async function analyzeOptimization(){
   setOptimizationBusy(true);setError('')
   try{setOptimization(await apiFetch('/marketing/optimize',{method:'POST',body:JSON.stringify({locale,...metrics,objective:scan?.suggestedObjective})}))}catch(e:any){setError(e?.message||text('Optimization analysis амжилтгүй.','Optimization analysis failed.'))}finally{setOptimizationBusy(false)}
 }
 async function loadTracking(){
   setTrackingBusy(true);setError('')
   try{setTracking(await apiFetch('/marketing/tracking'))}catch(e:any){setError(e?.message||text('Tracking мэдээлэл авч чадсангүй.','Could not load tracking information.'))}finally{setTrackingBusy(false)}
 }

 return <AppShell title={text('AI Marketing Studio','AI Marketing Studio')} subtitle={text('Website, Facebook Page, Instagram-аа AI-аар scan хийгээд campaign strategy, creative, optimization, asset, tracking-аа нэг дор бэлтгэнэ.','Scan your website, Facebook Page and Instagram, then prepare strategy, creative, optimization, assets and tracking in one workspace.')}>
  <div className={styles.toolTabs}>{TOOLS.map(item=>{const Icon=item.icon;return <button key={item.id} className={tool===item.id?styles.activeTool:''} onClick={()=>setTool(item.id)}><Icon size={16}/><span>{locale==='mn'?item.mn:item.en}</span></button>})}</div>
  {error&&<div className={styles.error}>{error}</div>}

  {tool==='scanner'&&<section className={styles.scannerGrid}>
    <div className={styles.card}>
      <div className={styles.cardHead}><div className={styles.icon}><ScanSearch size={20}/></div><div><span>BUSINESS AI SCANNER</span><h2>{text('Бүх эх сурвалжаа нэг scan-д','Combine every business source')}</h2></div></div>
      <p className={styles.muted}>{text('Website заавал биш. Website, Facebook Page, Instagram professional account-оос аль нэгийг эсвэл бүгдийг нь сонгож болно.','Website is optional. Scan any one or all of your website, Facebook Page and Instagram professional account.')}</p>
      <div className={styles.sourceFields}>
        <label><span><Globe2 size={14}/> Website</span><input value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} placeholder="https://example.mn"/></label>
        <label><span><MessageSquareText size={14}/> Facebook Page</span><select value={pageId} onChange={e=>setPageId(e.target.value)}><option value="">{text('Сонгоогүй','Not selected')}</option>{sources.pages.map(p=><option key={p.id} value={p.id}>{p.name}{p.category?' · '+p.category:''}</option>)}</select></label>
        <label><span><ImageIcon size={14}/> Instagram</span><select value={instagramId} onChange={e=>setInstagramId(e.target.value)}><option value="">{text('Сонгоогүй','Not selected')}</option>{sources.pages.filter(p=>p.instagram).map(p=><option key={p.instagram!.id} value={p.instagram!.id}>@{p.instagram!.username} · {p.name}</option>)}</select></label>
      </div>
      {sourcesError&&<div className={styles.softNotice}>{sourcesError} <a href="/connections">{text('Meta холбох','Connect Meta')} →</a></div>}
      <button className={styles.primary} onClick={runScan} disabled={loadingScan||(!websiteUrl.trim()&&!pageId&&!instagramId)}><Radar size={16}/>{loadingScan?text('Scan хийж байна…','Scanning…'):text('Бизнесээ AI-аар scan хийх','Scan business with AI')}</button>
      <div className={styles.scanInfo}><span>✓ Website metadata + content</span><span>✓ Facebook Page profile + recent posts</span><span>✓ Instagram bio + recent media captions</span><span>✓ Audience + channels + campaign seed</span></div>
    </div>

    <div className={styles.card}>
      {!scan?<Empty icon={<Radar size={26}/>} title={text('Scan үр дүн энд гарна','Scan results appear here')} text={text('3 эх сурвалжийг нийлүүлээд нэг business intelligence profile үүсгэнэ.','Multiple sources are merged into one business intelligence profile.')}/>:<div className={styles.result}>
       <div className={styles.resultTop}><div><span>{scan.engine}</span><h2>{scan.businessName}</h2><p>{scan.category.replace('_',' ')} · {scan.tone} · {scan.sourceCount} {text('эх сурвалж','sources')}</p></div><span className={styles.score}>{scan.suggestedObjective}</span></div>
       <div className={styles.sourceBadges}>{scan.sources?.website&&<span>🌐 Website</span>}{scan.sources?.facebook&&<span>f Facebook</span>}{scan.sources?.instagram&&<span>◎ Instagram</span>}</div>
       <ResultRow label={text('Санал болгох сувгууд','Recommended channels')} value={scan.suggestedChannels.join(' · ')}/>
       <ResultRow label={text('Аудитори','Audience')} value={scan.audience.ageMin+'–'+scan.audience.ageMax+' · '+scan.audience.interests.join(', ')}/>
       <ResultRow label="Tone" value={scan.tone}/>
       <div className={styles.pills}>{scan.keywords.slice(0,8).map(x=><span key={x}>{x}</span>)}</div>
       <div className={styles.seed}><small>CAMPAIGN SEED</small><b>{scan.campaignSeed.headline}</b><p>{scan.campaignSeed.primaryText}</p></div>
       <div className={styles.actions}><button className={styles.primary} onClick={useForCampaign}>{text('Campaign болгон ашиглах','Use in campaign')} →</button><button className={styles.secondary} onClick={()=>setTool('creative')}>{text('Creative үүсгэх','Generate creative')}</button></div>
      </div>}
    </div>
  </section>}

  {tool==='assistant'&&<section className={styles.twoCol}>
    <div className={styles.card}>
      <div className={styles.cardHead}><div className={styles.icon}><Bot size={20}/></div><div><span>AI MARKETING ASSISTANT</span><h2>{scan?.businessName||text('Business context сонгоогүй','No business context yet')}</h2></div></div>
      {!scan&&<div className={styles.softNotice}>{text('Эхлээд Business Scanner ажиллуулбал assistant таны бизнесийн бодит context-оор зөвлөнө.','Run Business Scanner first for context-aware recommendations.')}</div>}
      <div className={styles.quickPrompts}>{[
        text('Ямар сувгаас эхлэх вэ?','Which channels should I start with?'),
        text('Төсвөө яаж хуваах вэ?','How should I split my budget?'),
        text('Ямар creative тестлэх вэ?','What creative should I test?'),
        text('Audience-аа яаж сонгох вэ?','How should I choose an audience?'),
      ].map(q=><button key={q} onClick={()=>setAssistantInput(q)}>{q}</button>)}</div>
      <div className={styles.chat}>{chat.length?chat.map((m,i)=><div key={i} data-role={m.role}>{m.text}</div>):<Empty icon={<MessageSquareText size={24}/>} title={text('Маркетингийн асуултаа асуу','Ask a marketing question')} text={text('Scanner-ийн context, category, channel, audience дээр тулгуурлан хариулна.','Answers use your scanner context, category, channels and audience.')}/>}</div>
      <div className={styles.chatInput}><input value={assistantInput} onChange={e=>setAssistantInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')askAssistant()}} placeholder={text('Жишээ: TikTok дээр ямар видео хийх вэ?','Example: What video should I make for TikTok?')}/><button onClick={askAssistant} disabled={assistantBusy}><Bot size={16}/></button></div>
    </div>
    <div className={styles.card}><div className={styles.cardHead}><div className={styles.icon}><Radar size={20}/></div><div><span>STRATEGY</span><h2>{text('7 хоногийн эхний plan','Initial 7-day plan')}</h2></div></div><button className={styles.primary} onClick={generateStrategy} disabled={assistantBusy}>{text('Strategy үүсгэх','Generate strategy')}</button>{strategy&&<div className={styles.strategy}><h3>{strategy.summary}</h3><ResultRow label={text('Зорилго','Objective')} value={strategy.objective}/><ResultRow label={text('Сувгууд','Channels')} value={strategy.channels.join(' · ')}/><ResultRow label={text('Өдрийн төсөв','Daily budget')} value={Number(strategy.dailyBudgetMnt).toLocaleString('mn-MN')+'₮'}/><ol>{strategy.actions.map((x:string)=><li key={x}>{x}</li>)}</ol></div>}</div>
  </section>}

  {tool==='creative'&&<section className={styles.twoCol}>
    <div className={styles.card}><div className={styles.cardHead}><div className={styles.icon}><Sparkles size={20}/></div><div><span>CREATIVE STUDIO</span><h2>{text('Copy + visual concept','Copy + visual concept')}</h2></div></div>
      <label className={styles.field}><span>{text('Offer / гол санал','Offer / key message')}</span><textarea rows={4} value={offer} onChange={e=>setOffer(e.target.value)} placeholder={scan?.highlights?.[0]||text('Гол саналаа бичнэ үү','Enter your main offer')}/></label>
      <label className={styles.field}><span>Tone</span><select value={tone} onChange={e=>setTone(e.target.value as any)}><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="bold">Bold</option><option value="premium">Premium</option></select></label>
      <button className={styles.primary} onClick={generateCreative} disabled={creativeBusy}>{creativeBusy?text('Үүсгэж байна…','Generating…'):text('3 creative variation үүсгэх','Generate 3 creative variations')}</button>
    </div>
    <div className={styles.stack}>{creative?.variants?.map((v:any,i:number)=><article className={styles.creativeCard} key={i}><span>{v.name}</span><h3>{v.headline}</h3><p>{v.primaryText}</p><div className={styles.actions}><button className={styles.secondary} onClick={()=>copy(v.headline+'\n\n'+v.primaryText,'creative'+i)}><Copy size={13}/>{copied==='creative'+i?text('Хууллаа','Copied'):text('Хуулах','Copy')}</button><button className={styles.secondary} onClick={()=>addAsset({type:'copy',title:v.headline,value:v.primaryText,tags:[v.name,scan?.category||'creative']})}><Save size={13}/>{text('Asset-д хадгалах','Save asset')}</button></div></article>)}{creative?.visualPrompts?.length>0&&<article className={styles.card}><h3>{text('Visual prompts','Visual prompts')}</h3>{creative.visualPrompts.map((p:string,i:number)=><div className={styles.prompt} key={i}><p>{p}</p><button onClick={()=>{addAsset({type:'prompt',title:'Visual prompt '+(i+1),value:p,tags:['visual',scan?.category||'creative']});copy(p,'prompt'+i)}}><Copy size={13}/></button></div>)}</article>}{!creative&&<div className={styles.card}><Empty icon={<Sparkles size={24}/>} title={text('Creative set энд гарна','Creative set appears here')} text={text('Scanner-ийн business context-ийг автоматаар ашиглана.','Automatically uses your scanner business context.')}/></div>}</div>
  </section>}

  {tool==='optimization'&&<section className={styles.twoCol}>
   <div className={styles.card}><div className={styles.cardHead}><div className={styles.icon}><BarChart3 size={20}/></div><div><span>OPTIMIZATION CENTER</span><h2>{text('Campaign metrics анализ','Analyze campaign metrics')}</h2></div></div><div className={styles.metricInputs}>{Object.entries(metrics).map(([key,value])=><label key={key}><span>{key}</span><input type="number" min="0" value={value} onChange={e=>setMetrics({...metrics,[key]:Number(e.target.value)})}/></label>)}</div><button className={styles.primary} onClick={analyzeOptimization} disabled={optimizationBusy}>{text('Optimization зөвлөмж авах','Analyze & recommend')}</button></div>
   <div className={styles.card}>{optimization?<><div className={styles.metricSummary}><Metric l="CTR" v={optimization.metrics.ctr+'%'}/><Metric l="CPC" v={Number(optimization.metrics.cpc).toLocaleString()}/><Metric l="CVR" v={optimization.metrics.conversionRate+'%'}/><Metric l="ROAS" v={String(optimization.metrics.roas)}/></div><div className={styles.suggestions}>{optimization.suggestions.map((s:any,i:number)=><article key={i} data-priority={s.priority}><span>{s.priority}</span><h3>{s.title}</h3><p>{s.detail}</p><b>→ {s.action}</b></article>)}</div><div className={styles.softNotice}>{optimization.note}</div></>:<Empty icon={<BarChart3 size={24}/>} title={text('Suggestion mode','Suggestion mode')} text={text('Live campaign-ийг автоматаар өөрчлөхгүй. Тоон үзүүлэлт дээр зөвлөмж гаргана.','Does not modify live campaigns. It produces recommendations from performance metrics.')}/>}</div>
  </section>}

  {tool==='assets'&&<section className={styles.twoCol}>
   <div className={styles.card}><div className={styles.cardHead}><div className={styles.icon}><FileImage size={20}/></div><div><span>ASSET LIBRARY</span><h2>{text('Creative материалаа хадгал','Save creative assets')}</h2></div></div><label className={styles.field}><span>Type</span><select value={assetType} onChange={e=>setAssetType(e.target.value as Asset['type'])}><option value="copy">Copy</option><option value="image_url">Image URL</option><option value="video_url">Video URL</option><option value="prompt">Prompt</option></select></label><label className={styles.field}><span>{text('Нэр','Title')}</span><input value={assetTitle} onChange={e=>setAssetTitle(e.target.value)}/></label><label className={styles.field}><span>{text('Контент / URL','Content / URL')}</span><textarea rows={5} value={assetValue} onChange={e=>setAssetValue(e.target.value)}/></label><button className={styles.primary} disabled={!assetValue.trim()} onClick={()=>{addAsset({type:assetType,title:assetTitle||assetType,value:assetValue,tags:[]});setAssetTitle('');setAssetValue('')}}><Plus size={15}/>{text('Asset нэмэх','Add asset')}</button><div className={styles.softNotice}>{text('Supabase storage идэвхгүй байгаа тул одоогоор энэ browser/device дээр хадгална.','Until Supabase storage is active, assets are saved in this browser/device.')}</div></div>
   <div className={styles.assetGrid}>{assets.length?assets.map(a=><article className={styles.asset} key={a.id}><div><span>{a.type}</span><button onClick={()=>removeAsset(a.id)}><Trash2 size={13}/></button></div><h3>{a.title}</h3>{a.type==='image_url'&&/^https?:/.test(a.value)?<img src={a.value} alt={a.title}/>:<p>{a.value}</p>}<small>{new Date(a.createdAt).toLocaleString()}</small></article>):<div className={styles.card}><Empty icon={<FileImage size={24}/>} title={text('Asset алга','No assets yet')} text={text('Creative Studio-оос copy/prompt хадгалж эхлээрэй.','Save copy and prompts from Creative Studio.')}/></div>}</div>
  </section>}

  {tool==='tracking'&&<section className={styles.twoCol}>
   <div className={styles.card}><div className={styles.cardHead}><div className={styles.icon}><Radar size={20}/></div><div><span>TRACKING CENTER</span><h2>BOOST Pixel</h2></div></div><p className={styles.muted}>{text('PageView, ViewContent, Lead, Purchase event-ийн front-end model. Server-side collection нь durable analytics storage идэвхжсэний дараа асна.','Front-end event model for PageView, ViewContent, Lead and Purchase. Server-side collection activates after durable analytics storage is enabled.')}</p><button className={styles.primary} onClick={loadTracking} disabled={trackingBusy}>{text('Tracking setup үүсгэх','Generate tracking setup')}</button>{tracking&&<div className={styles.trackingInfo}><ResultRow label="Pixel ID" value={tracking.pixelId}/><ResultRow label="Events" value={tracking.events.join(' · ')}/><span className={styles.badge}>{tracking.status}</span></div>}</div>
   <div className={styles.card}>{tracking?<><div className={styles.codeHead}><b>{text('Суулгах код','Installation code')}</b><button className={styles.secondary} onClick={()=>copy(tracking.snippet,'tracking')}><Copy size={13}/>{copied==='tracking'?text('Хууллаа','Copied'):text('Хуулах','Copy')}</button></div><pre className={styles.code}>{tracking.snippet}</pre><div className={styles.softNotice}>{tracking.note}</div></>:<Empty icon={<Radar size={24}/>} title={text('Tracking code бэлэн биш','Tracking code not generated')} text={text('Workspace-д зориулсан unique Pixel ID үүсгэнэ.','Generates a unique Pixel ID for this workspace.')}/>}</div>
  </section>}
 </AppShell>
}

function ResultRow({label,value}:{label:string;value:string}){return <div className={styles.resultRow}><span>{label}</span><b>{value||'—'}</b></div>}
function Empty({icon,title,text}:{icon:any;title:string;text:string}){return <div className={styles.empty}>{icon}<b>{title}</b><span>{text}</span></div>}
function Metric({l,v}:{l:string;v:string}){return <div><span>{l}</span><b>{v}</b></div>}
