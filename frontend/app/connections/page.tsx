'use client'
import { useState } from 'react'
import { ExternalLink, Link2, ShieldCheck } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { useUi } from '../../components/ui/UiProvider'
import { apiFetch } from '../../lib/api'
import { platforms } from '../../components/ads/platforms'
import s from '../overview.module.css'
export default function Connections(){
 const {text}=useUi()
 const [loading,setLoading]=useState(false),[result,setResult]=useState(''),[error,setError]=useState('')
 async function check(){setLoading(true);setError('');setResult('');try{await apiFetch('/ads/adliftr/workspaces');setResult(text('AdLiftr API хариу өглөө. Дараагийн алхам: харилцагчийн дансны тусгаарлалтыг тохируулах.','AdLiftr API responded. Next: configure customer account isolation.'))}catch(e){setError(e instanceof Error?e.message:text('Холболт шалгаж чадсангүй.','Connection check failed.'))}finally{setLoading(false)}}
 return <AppShell title={text('Платформын холболтууд','Platform connections')} subtitle={text('Холболт бүрийн бодит төлөвийг баталгаажуулна.','Verify each connection before publishing.')}>
 <div className={s.note}><ShieldCheck size={22}/><p>{text('AdLiftr холболт одоогоор баталгаажаагүй. Доорх платформууд нь дэмжигдэх сонголтууд бөгөөд холбогдсон данс гэсэн үг биш.','AdLiftr connectivity has not been verified. These are supported platforms, not connected accounts.')}</p></div>
 <div className={s.platforms}>{platforms.map(p=><article className={s.panel} key={p.id}><span className={s.mark} style={{color:p.color}}>{p.mark}</span><h3>{p.name}</h3><p>{p.detail}</p><span className={s.badge}>{text('Холболт шаардлагатай','Connection required')}</span></article>)}</div>
 <div className={s.bottom}><section className={s.panel}><h2>{text('Эхлэх дараалал','Getting connected')}</h2><ol><li><p>{text('AdLiftr-д нэвтэрч зарын дансаа холбоно.','Sign in to AdLiftr and connect your ad accounts.')}</p></li><li><p>{text('Developer хэсгээс API түлхүүр үүсгэнэ.','Generate an API key in Developer settings.')}</p></li><li><p>{text('Оператор түлхүүрийг серверийн орчинд тохируулж холболтыг шалгана.','Your operator configures the server key and verifies connectivity.')}</p></li></ol><a href="https://app.adliftr.com" target="_blank" rel="noopener noreferrer">{text('AdLiftr нээх','Open AdLiftr')} <ExternalLink size={14}/></a></section><section className={s.panel}><h2>{text('Операторын холболтын шалгалт','Operator connection check')}</h2><p>{text('Зөвхөн сервер дээр зөвшөөрөгдсөн оператор шалгах эрхтэй. API түлхүүрийг энэ дэлгэцэд оруулахгүй.','Only explicitly allowlisted operators can run this check. API keys are never entered on this screen.')}</p><button type="button" onClick={check} disabled={loading} style={{padding:'12px 16px',borderRadius:8,border:'1px solid var(--border)',background:'var(--primary)',color:'#fff',cursor:'pointer',fontSize:14}}><Link2 size={16}/> {loading?text('Шалгаж байна…','Checking…'):text('Холболт шалгах','Check connection')}</button>{error&&<p role="alert">{error}</p>}{result&&<p role="status">{result}</p>}</section></div>
 </AppShell>
}
