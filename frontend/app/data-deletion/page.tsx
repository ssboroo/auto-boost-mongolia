'use client'

import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import PublicControls from '../../components/ui/PublicControls'
import { useUi } from '../../components/ui/UiProvider'
import styles from '../legal.module.css'

export default function DataDeletionPage(){
 const {text}=useUi()
 return <main className={styles.page}><div className={styles.shell}><div className={styles.top}><Link className={styles.brand} href="/"><span className={styles.brandMark}><Trash2 size={18}/></span>BOOST.MN</Link><div className={styles.topRight}><PublicControls/><Link className={styles.back} href="/">← {text('Нүүр','Home')}</Link></div></div><article className={styles.card}><span className={styles.eyebrow}>{text('МЭДЭЭЛЭЛ УСТГАХ','DATA DELETION')}</span><h1>{text('Мэдээлэл устгуулах','Request data deletion')}</h1><div className={styles.updated}>{text('Сүүлд шинэчилсэн: 2026-09-30','Last updated: September 30, 2026')}</div>
 <S title={text('Provider холболтоо салгах','Disconnect providers')} p={text('Connections хэсгээс provider access-ийг салгаж болно. Meta direct connection дээр хадгалсан token backend vault-аас устгагдана.','Disconnect provider access from Connections. For direct Meta connections, the stored token is removed from the backend vault.')}/>
 <S title={text('Account мэдээллээ устгуулах','Delete account data')} p={text('Account-ийн имэйлээ ашиглан support хүсэлт гаргаж profile, workspace membership, provider connections болон шаардлагагүй campaign data-г устгуулах боломжтой.','Submit a support request from your account email to request deletion of profile, workspace membership, provider connections and unnecessary campaign data.')}/>
 <S title={text('Заавал хадгалах бүртгэл','Required retention')} p={text('Санхүү, fraud prevention, security audit болон хууль ёсны шаардлагаар зарим transaction/receipt/audit мэдээллийг шаардлагатай хугацаанд хадгалж болно.','Some transaction, receipt and audit records may be retained where required for finance, fraud prevention, security or legal obligations.')}/>
 <div className={styles.notice}>Meta Data Deletion URL: https://auto-boost-mongolia.vercel.app/data-deletion</div><div className={styles.links}><Link href="/privacy">{text('Нууцлал','Privacy')}</Link><Link href="/terms">{text('Нөхцөл','Terms')}</Link></div>
 </article></div></main>
}
function S({title,p}:{title:string;p:string}){return <section className={styles.section}><h2>{title}</h2><p>{p}</p></section>}
