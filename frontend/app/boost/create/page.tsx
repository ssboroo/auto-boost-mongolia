'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Facebook, Image as ImageIcon, Rocket, ShieldCheck } from 'lucide-react'
import AppShell from '../../../components/layout/AppShell'
import { apiFetch } from '../../../lib/api'
import styles from '../../manager.module.css'

type Page = { id:string; name:string; picture?:{data?:{url?:string}} }
type AdAccount = { id:string; account_id:string; name:string; currency:string; timezone_name:string; account_status:number }
type Post = { id:string; message?:string; created_time?:string; full_picture?:string; permalink_url?:string }
type Readiness = { connected:boolean; ready:boolean; accounts:Array<{id:string;accountId:string;ready:boolean;paymentFailed:boolean;userMessage:string}> }

type Created = { campaignId:string; adSetId:string; creativeId:string; adId:string }

const objectives = [
  ['OUTCOME_AWARENESS','Таниулах'],['OUTCOME_TRAFFIC','Хандалт'],['OUTCOME_ENGAGEMENT','Оролцоо'],['OUTCOME_LEADS','Лийд'],['OUTCOME_SALES','Борлуулалт'],
]

export default function BoostCreatePage(){
  const [step,setStep]=useState(1)
  const [pages,setPages]=useState<Page[]>([]), [accounts,setAccounts]=useState<AdAccount[]>([]), [posts,setPosts]=useState<Post[]>([])
  const [pageId,setPageId]=useState(''), [accountId,setAccountId]=useState(''), [postId,setPostId]=useState('')
  const [objective,setObjective]=useState('OUTCOME_ENGAGEMENT'), [name,setName]=useState(`RAINY Boost ${new Date().toLocaleDateString('mn-MN')}`)
  const [country,setCountry]=useState('MN'), [ageMin,setAgeMin]=useState(18), [ageMax,setAgeMax]=useState(65), [gender,setGender]=useState('0')
  const [placement,setPlacement]=useState('AUTO'), [dailyBudget,setDailyBudget]=useState(10000), [days,setDays]=useState(7)
  const [loading,setLoading]=useState(true), [creating,setCreating]=useState(false), [error,setError]=useState(''), [created,setCreated]=useState<Created|null>(null)
  const [readiness,setReadiness]=useState<Readiness|null>(null)

  useEffect(()=>{(async()=>{try{
    const [p,a,r]=await Promise.all([apiFetch<any>('/meta/pages'),apiFetch<any>('/meta/ad-accounts'),apiFetch<Readiness>('/meta/readiness')])
    const pp=p?.data||[], aa=a?.data||[]; setPages(pp); setAccounts(aa); setReadiness(r)
    if(pp[0])setPageId(pp[0].id); if(aa[0])setAccountId(aa[0].account_id||aa[0].id)
  }catch(e:any){setError(e?.message||'Meta мэдээлэл ачаалж чадсангүй. Facebook холболтоо шалгана уу.')}finally{setLoading(false)}})()},[])

  useEffect(()=>{if(!pageId)return; setPosts([]); setPostId(''); apiFetch<any>(`/meta/pages/${encodeURIComponent(pageId)}/posts`).then(r=>{const data=r?.data||[];setPosts(data);if(data[0])setPostId(data[0].id)}).catch((e:any)=>setError(e?.message||'Постууд авч чадсангүй.'))},[pageId])

  const account=accounts.find(a=>(a.account_id||a.id)===accountId)
  const post=posts.find(p=>p.id===postId)
  const steps=['Пост','Зорилго','Аудитори','Төсөв','Хугацаа','Шалгах','Үүсгэх']
  const optimization=useMemo(()=>objective==='OUTCOME_TRAFFIC'?'LINK_CLICKS':objective==='OUTCOME_AWARENESS'?'REACH':objective==='OUTCOME_LEADS'?'LEAD_GENERATION':objective==='OUTCOME_SALES'?'OFFSITE_CONVERSIONS':'POST_ENGAGEMENT',[objective])

  function canNext(){ if(step===1)return Boolean(pageId&&accountId&&postId); if(step===2)return Boolean(name&&objective); if(step===3)return ageMin>=18&&ageMax>=ageMin; if(step===4)return dailyBudget>0; if(step===5)return days>=1; return true }
  function next(){if(canNext())setStep(s=>Math.min(7,s+1))}
  function back(){setStep(s=>Math.max(1,s-1))}

  async function createAll(){
    if(!readiness?.ready){setError('Meta Ad Account payment/readiness бэлэн биш байна. Facebook холболт хэсэгт эхлээд шалгана уу.');return}
    if(!account||!post){setError('Ad Account эсвэл пост сонгоогүй байна.');return}
    setCreating(true);setError('')
    try{
      const campaign=await apiFetch<any>(`/meta/ad-accounts/${encodeURIComponent(accountId)}/campaigns`,{method:'POST',body:JSON.stringify({name,objective,specialAdCategories:[]})})
      const targeting:any={geo_locations:{countries:[country]},age_min:ageMin,age_max:ageMax}
      if(gender!=='0')targeting.genders=[Number(gender)]
      if(placement!=='AUTO')targeting.publisher_platforms=placement==='FACEBOOK'?['facebook']:placement==='INSTAGRAM'?['instagram']:['facebook','instagram']
      const budgetMinor=account.currency==='MNT'?Math.round(dailyBudget):Math.round(dailyBudget*100)
      const start=new Date(Date.now()+5*60*1000), end=new Date(start.getTime()+days*86400000)
      const adset=await apiFetch<any>(`/meta/ad-accounts/${encodeURIComponent(accountId)}/adsets`,{method:'POST',body:JSON.stringify({name:`${name} · Ad Set`,campaignId:campaign.id,dailyBudget:budgetMinor,billingEvent:'IMPRESSIONS',optimizationGoal:optimization,bidStrategy:'LOWEST_COST_WITHOUT_CAP',targeting,startTime:start.toISOString(),endTime:end.toISOString()})})
      const creative=await apiFetch<any>(`/meta/ad-accounts/${encodeURIComponent(accountId)}/creatives/existing-post`,{method:'POST',body:JSON.stringify({name:`${name} · Creative`,objectStoryId:post.id})})
      const ad=await apiFetch<any>(`/meta/ad-accounts/${encodeURIComponent(accountId)}/ads`,{method:'POST',body:JSON.stringify({name:`${name} · Ad`,adSetId:adset.id,creativeId:creative.id})})
      setCreated({campaignId:campaign.id,adSetId:adset.id,creativeId:creative.id,adId:ad.id});setStep(7)
    }catch(e:any){setError(e?.message||'Meta campaign үүсгэх үед алдаа гарлаа.')}finally{setCreating(false)}
  }

  if(loading)return <AppShell title="Boost үүсгэх" subtitle="Meta Ads Manager workflow"><div className={styles.card}><div className={styles.spinner}/><p className={styles.muted}>Meta Page, Ad Account болон readiness шалгаж байна…</p></div></AppShell>

  return <AppShell title="Boost үүсгэх" subtitle="Facebook сурталчилгаагаа 7 алхмаар үүсгэнэ. Бүх объект эхлээд PAUSED төлөвтэй.">
    <div className={styles.steps}>{steps.map((x,i)=><div key={x} className={`${styles.step} ${step===i+1?styles.stepActive:''} ${step>i+1?styles.stepDone:''}`}><b>{step>i+1?'✓ ':''}{i+1}. {x}</b><small>{step===i+1?'Одоогийн алхам':step>i+1?'Дууссан':'Хүлээгдэж байна'}</small></div>)}</div>
    {error&&<div className={styles.error}>{error}</div>}
    {!readiness?.ready&&<div className={styles.warning}>Facebook/Ad Account/payment readiness бүрэн биш байна. <a href="/facebook">Facebook холболт →</a></div>}
    <div className={styles.grid2} style={{marginTop:14}}><section className={styles.card}>
      {step===1&&<div className={styles.grid}><h2>Пост болон Ad Account сонгох</h2><div className={styles.fields2}><label className={styles.field}><span>Facebook Page</span><select value={pageId} onChange={e=>setPageId(e.target.value)}>{pages.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className={styles.field}><span>Meta Ad Account</span><select value={accountId} onChange={e=>setAccountId(e.target.value)}>{accounts.map(a=><option key={a.id} value={a.account_id||a.id}>{a.name} · {a.currency}</option>)}</select></label></div>{posts.length?<div className={styles.postGrid}>{posts.map(p=><button key={p.id} className={`${styles.post} ${postId===p.id?styles.postSelected:''}`} onClick={()=>setPostId(p.id)}>{p.full_picture?<img src={p.full_picture} alt="Пост"/>:<div style={{height:125,display:'grid',placeItems:'center'}}><ImageIcon/></div>}<div><b>{(p.message||'Зурагт пост').slice(0,100)}</b><small>{p.created_time?new Date(p.created_time).toLocaleString('mn-MN'):''}</small></div></button>)}</div>:<div className={styles.empty}>Энэ Page дээр ашиглах боломжтой пост олдсонгүй.</div>}</div>}
      {step===2&&<div className={styles.grid}><h2>Кампайны зорилго</h2><label className={styles.field}><span>Кампайны нэр</span><input value={name} onChange={e=>setName(e.target.value)}/></label><div className={styles.grid3}>{objectives.map(([v,l])=><button key={v} className={objective===v?styles.primary:styles.secondary} onClick={()=>setObjective(v)}>{l}</button>)}</div><div className={styles.notice}>Meta objective: <b>{objective}</b> · optimization: <b>{optimization}</b></div></div>}
      {step===3&&<div className={styles.grid}><h2>Аудитори</h2><div className={styles.fields3}><label className={styles.field}><span>Улс</span><select value={country} onChange={e=>setCountry(e.target.value)}><option value="MN">Монгол</option><option value="US">АНУ</option><option value="KR">БНСУ</option><option value="JP">Япон</option></select></label><label className={styles.field}><span>Доод нас</span><input type="number" min="18" max="65" value={ageMin} onChange={e=>setAgeMin(Number(e.target.value))}/></label><label className={styles.field}><span>Дээд нас</span><input type="number" min="18" max="65" value={ageMax} onChange={e=>setAgeMax(Number(e.target.value))}/></label></div><div className={styles.fields2}><label className={styles.field}><span>Хүйс</span><select value={gender} onChange={e=>setGender(e.target.value)}><option value="0">Бүгд</option><option value="1">Эрэгтэй</option><option value="2">Эмэгтэй</option></select></label><label className={styles.field}><span>Placement</span><select value={placement} onChange={e=>setPlacement(e.target.value)}><option value="AUTO">Advantage+ / Automatic</option><option value="BOTH">Facebook + Instagram</option><option value="FACEBOOK">Facebook</option><option value="INSTAGRAM">Instagram</option></select></label></div><div className={styles.notice}>Audience targeting нь Meta API руу шууд дамжина. Detailed interests/custom audiences нь дараагийн advanced targeting хувилбарт нэмэгдэх боломжтой.</div></div>}
      {step===4&&<div className={styles.grid}><h2>Өдрийн төсөв</h2><label className={styles.field}><span>{account?.currency||'Account currency'} / өдөр</span><input type="number" min="1" value={dailyBudget} onChange={e=>setDailyBudget(Number(e.target.value)||1)}/></label><div className={styles.notice}>Selected account: <b>{account?.name||'—'}</b> · {account?.currency||'—'}. RAINY Meta-ийн daily_budget шаардлагад тохируулан minor unit руу хөрвүүлнэ.</div></div>}
      {step===5&&<div className={styles.grid}><h2>Хугацаа</h2><label className={styles.field}><span>Хэдэн өдөр ажиллуулах вэ?</span><input type="number" min="1" max="90" value={days} onChange={e=>setDays(Number(e.target.value)||1)}/></label><div className={styles.summary}><div><span>Эхлэх</span><b>Одоогоос ~5 минутын дараа</b></div><div><span>Дуусах</span><b>{new Date(Date.now()+days*86400000).toLocaleDateString('mn-MN')}</b></div></div></div>}
      {step===6&&<div className={styles.grid}><h2>Эцсийн шалгалт</h2><div className={styles.summary}><div><span>Page</span><b>{pages.find(p=>p.id===pageId)?.name||'—'}</b></div><div><span>Ad Account</span><b>{account?.name||'—'} · {account?.currency}</b></div><div><span>Пост</span><b>{(post?.message||post?.id||'—').slice(0,70)}</b></div><div><span>Зорилго</span><b>{objectives.find(x=>x[0]===objective)?.[1]}</b></div><div><span>Аудитори</span><b>{country} · {ageMin}–{ageMax} · {gender==='0'?'Бүгд':gender==='1'?'Эрэгтэй':'Эмэгтэй'}</b></div><div><span>Placement</span><b>{placement}</b></div><div><span>Төсөв</span><b>{dailyBudget.toLocaleString('mn-MN')} {account?.currency}/өдөр · {days} өдөр</b></div><div><span>Аюулгүй байдал</span><b>Campaign + Ad Set + Ad = PAUSED</b></div></div><button className={styles.primary} onClick={()=>setStep(7)} disabled={!readiness?.ready}><ShieldCheck size={16}/> Үүсгэх алхам руу</button></div>}
      {step===7&&<div className={styles.grid}><h2>{created?'Boost амжилттай үүслээ':'Meta дээр PAUSED байдлаар үүсгэх'}</h2>{created?<><div className={styles.success}><Check size={16}/> Campaign, Ad Set, Creative, Ad бүгд Meta дээр үүслээ. Зар одоогоор мөнгө зарцуулахгүй.</div><div className={styles.summary}><div><span>Campaign ID</span><b>{created.campaignId}</b></div><div><span>Ad Set ID</span><b>{created.adSetId}</b></div><div><span>Creative ID</span><b>{created.creativeId}</b></div><div><span>Ad ID</span><b>{created.adId}</b></div></div><div className={styles.actions}><a className={styles.primary} href="/campaigns"><Rocket size={16}/> Кампанит ажил руу</a><a className={styles.secondary} href="/analytics">Аналитик харах</a></div></>:<><div className={styles.warning}>“Үүсгэх” дарахад Meta API дээр бодит Campaign → Ad Set → Creative → Ad үүснэ. Гэхдээ бүгд PAUSED тул хэрэглэгч тусад нь идэвхжүүлэх хүртэл зарцуулалт эхлэхгүй.</div><button className={styles.primary} onClick={createAll} disabled={creating||!readiness?.ready}>{creating?'Meta дээр үүсгэж байна…':'PAUSED Boost үүсгэх'}</button></>}</div>}
      <div className={styles.toolbar} style={{marginTop:20,marginBottom:0}}><button className={styles.secondary} onClick={back} disabled={step===1||Boolean(created)}><ArrowLeft size={15}/> Буцах</button>{step<6&&<button className={styles.primary} onClick={next} disabled={!canNext()}>Үргэлжлүүлэх <ArrowRight size={15}/></button>}</div>
    </section><aside className={styles.preview}><h3>Зарын live preview</h3><p className={styles.muted}>Сонгосон existing Page post-ыг Meta creative болгон ашиглана.</p><div className={styles.adMock}><div className={styles.adHead}><div className={styles.avatar}><Facebook size={15}/></div><div><b>{pages.find(p=>p.id===pageId)?.name||'Facebook Page'}</b><small>Sponsored · Public</small></div></div>{post?.full_picture?<img src={post.full_picture} alt="Preview"/>:<div style={{height:210,display:'grid',placeItems:'center'}}><ImageIcon/></div>}<div className={styles.adCopy}><b>{(post?.message||'Таны сонгосон пост энд харагдана.').slice(0,80)}</b><p>{objective.replace('OUTCOME_','')} · {dailyBudget.toLocaleString('mn-MN')} {account?.currency||''}/өдөр</p></div></div></aside></div>
  </AppShell>
}
