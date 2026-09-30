'use client'

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import PublicControls from '../../components/ui/PublicControls'
import { useUi } from '../../components/ui/UiProvider'
import styles from '../legal.module.css'

export default function PrivacyPage(){
 const {text}=useUi()
 return <main className={styles.page}><div className={styles.shell}><div className={styles.top}><Link className={styles.brand} href="/"><span className={styles.brandMark}><ShieldCheck size={18}/></span>BOOST.MN</Link><div className={styles.topRight}><PublicControls/><Link className={styles.back} href="/">← {text('Нүүр','Home')}</Link></div></div><article className={styles.card}><span className={styles.eyebrow}>{text('НУУЦЛАЛ','PRIVACY')}</span><h1>{text('Нууцлалын бодлого','Privacy Policy')}</h1><div className={styles.updated}>{text('Сүүлд шинэчилсэн: 2026-09-30','Last updated: September 30, 2026')}</div>
  <S title={text('1. Бид ямар мэдээлэл боловсруулдаг вэ?','1. Information we process')} p={text('Бүртгэлийн имэйл, workspace, provider холболтын таних мэдээлэл, campaign draft/preview, төлбөрийн төлөв болон аюулгүй ажиллагааны audit log-ийг үйлчилгээ ажиллуулах хэмжээнд боловсруулна.','We process account email, workspace data, provider connection identifiers, campaign drafts/previews, payment status and security audit logs as needed to operate the service.')}/>
  <S title={text('2. Advertising provider мэдээлэл','2. Advertising provider data')} p={text('Meta болон бусад provider-ийг холбоход зөвшөөрсөн OAuth permission-ийн хүрээнд мэдээлэл авна. Secret/token нь frontend-д ил гарахгүй бөгөөд backend талд хамгаалагдана.','When you connect Meta or another advertising provider, data is accessed only within the OAuth permissions you grant. Secrets and tokens are not exposed to the frontend and are protected server-side.')}/>
  <S title={text('3. Төлбөр','3. Payments')} p={text('Картын бүтэн дугаар, CVV хадгалахгүй. Payment provider identifier, төлөв, дүн, receipt болон webhook техникийн мэдээллийг reconciliation болон fraud prevention-д хадгалж болно.','We do not store full card numbers or CVV. Payment identifiers, status, amount, receipts and webhook metadata may be retained for reconciliation and fraud prevention.')}/>
  <S title={text('4. Аюулгүй байдал','4. Security')} p={text('Tenant data нь Row Level Security-ээр тусгаарлагдана. Sensitive provider token backend-only байна. Campaign live spend нь тусдаа explicit баталгаажуулалттай.','Tenant data is isolated with Row Level Security. Sensitive provider tokens remain backend-only. Live campaign spend requires separate explicit confirmation.')}/>
  <S title={text('5. Таны эрх','5. Your rights')} p={text('Та мэдээллээ засах, provider холболтоо салгах, account мэдээлэл устгуулах хүсэлт гаргах боломжтой.','You may correct your data, disconnect providers and request deletion of your account data.')}/>
  <div className={styles.notice}>{text('Public launch-аас өмнө оператор компанийн албан ёсны нэр, хаяг, privacy/support contact-ийг бодит мэдээллээр шинэчилнэ.','Before public launch, the legal operator name, address and privacy/support contact must be finalized with the actual business information.')}</div><div className={styles.links}><Link href="/terms">{text('Үйлчилгээний нөхцөл','Terms')}</Link><Link href="/data-deletion">{text('Мэдээлэл устгах','Data deletion')}</Link></div>
 </article></div></main>
}
function S({title,p}:{title:string;p:string}){return <section className={styles.section}><h2>{title}</h2><p>{p}</p></section>}
