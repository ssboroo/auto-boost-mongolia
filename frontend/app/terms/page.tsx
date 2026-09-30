'use client'

import Link from 'next/link'
import { FileCheck2 } from 'lucide-react'
import PublicControls from '../../components/ui/PublicControls'
import { useUi } from '../../components/ui/UiProvider'
import styles from '../legal.module.css'

export default function TermsPage(){
 const {text}=useUi()
 return <main className={styles.page}><div className={styles.shell}><div className={styles.top}><Link className={styles.brand} href="/"><span className={styles.brandMark}><FileCheck2 size={18}/></span>BOOST.MN</Link><div className={styles.topRight}><PublicControls/><Link className={styles.back} href="/">← {text('Нүүр','Home')}</Link></div></div><article className={styles.card}><span className={styles.eyebrow}>{text('ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ','TERMS OF SERVICE')}</span><h1>{text('Үйлчилгээний нөхцөл','Terms of Service')}</h1><div className={styles.updated}>{text('Сүүлд шинэчилсэн: 2026-09-30','Last updated: September 30, 2026')}</div>
 <S title={text('1. Үйлчилгээ','1. Service')} p={text('BOOST.MN нь multi-channel advertising campaign бэлтгэх, төсөв тооцох, provider connection, тайлан болон billing workflow-ийг нэгтгэсэн SaaS платформ.','BOOST.MN is a SaaS platform for multi-channel campaign preparation, budgeting, provider connections, reporting and billing workflows.')}/>
 <S title={text('2. Campaign баталгаажуулалт','2. Campaign confirmation')} p={text('Preview нь live spend биш. Provider API бүрэн бэлэн болсон ч campaign-ийг live submit/activate хийхээс өмнө хэрэглэгчийн explicit confirmation шаардлагатай.','A preview does not create live spend. Even when provider APIs are enabled, explicit user confirmation is required before live submission or activation.')}/>
 <S title={text('3. Төлбөр ба шимтгэл','3. Billing and fees')} p={text('Advertising spend болон BOOST.MN service fee нь UI дээр тусдаа харагдана. Provider settlement model нь тухайн advertising provider-ийн нөхцөлөөр зохицуулагдана.','Advertising spend and BOOST.MN service fees are displayed separately. Provider settlement is governed by the relevant advertising provider terms.')}/>
 <S title={text('4. Үр дүнгийн баталгаа','4. Performance')} p={text('Reach, click, lead, sale, ROAS зэрэг үр дүн нь auction, creative, audience, budget болон зах зээлээс хамаардаг тул тодорхой үр дүнг баталгаажуулахгүй.','Reach, clicks, leads, sales and ROAS depend on auction dynamics, creative, audience, budget and market conditions; specific results are not guaranteed.')}/>
 <S title={text('5. Хориглох хэрэглээ','5. Prohibited use')} p={text('Хууль зөрчсөн, залилан, хуурамч эсвэл advertising network policy зөрчсөн campaign ашиглахыг хориглоно.','Illegal, fraudulent, deceptive or advertising-network-policy-violating campaigns are prohibited.')}/>
 <div className={styles.notice}>{text('Live provider terms болон refund policy-г commercial agreement батлагдсаны дараа эцэслэнэ.','Live provider terms and the final refund policy will be finalized once commercial provider agreements are confirmed.')}</div><div className={styles.links}><Link href="/privacy">{text('Нууцлал','Privacy')}</Link><Link href="/data-deletion">{text('Мэдээлэл устгах','Data deletion')}</Link></div>
 </article></div></main>
}
function S({title,p}:{title:string;p:string}){return <section className={styles.section}><h2>{title}</h2><p>{p}</p></section>}
