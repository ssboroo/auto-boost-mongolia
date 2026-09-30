'use client'

import { ArrowUpRight, BarChart3, Globe2, PlayCircle, Sparkles } from 'lucide-react'
import { useUi } from '../ui/UiProvider'
import styles from './dashboard.module.css'

export default function DashboardHero({ connected }: { connected: boolean }) {
  const { text } = useUi()
  return <section className={styles.hero}>
    <div className={styles.copy}>
      <span className={styles.kicker}><Sparkles size={13}/>{text('МОНГОЛ БИЗНЕСТ ЗОРИУЛАВ', 'BUILT FOR MONGOLIAN BUSINESSES')}</span>
      <h1>{text('Нэг campaign.', 'One campaign.')}<br/><em>{text('Бүх сувгаар.', 'Every channel.')}</em></h1>
      <p>{text('Facebook, Instagram, Google, YouTube, TikTok, X, LinkedIn, Microsoft Ads-ийг нэг Монгол dashboard-аас бэлтгэж, төсөв болон үр дүнгээ нэг дор удирдана.','Plan Facebook, Instagram, Google, YouTube, TikTok, X, LinkedIn and Microsoft Ads from one unified dashboard.')}</p>
      <div className={styles.actions}><a href="/campaigns/new">{text('Campaign үүсгэх','Create campaign')} <ArrowUpRight size={16}/></a><a className={styles.secondary} href="/connections">{connected?text('Meta холбогдсон','Meta connected'):text('Сувгуудаа холбох','Connect channels')}</a></div>
      <div className={styles.trust}><span>8 {text('суваг','channels')}</span><span>MNT {text('төсөв','billing')}</span><span>{text('Safe preview','Safe preview')}</span></div>
    </div>
    <div className={styles.visual}>
      <div className={styles.glow}/>
      <div className={styles.mainCard}><div className={styles.cardHead}><span className={styles.brandDot}>B</span><div><b>BOOST.MN</b><small>{text('Нэгдсэн campaign','Unified campaign')}</small></div><span className={styles.live}>PREVIEW</span></div><div className={styles.previewBody}><small>{text('ӨНӨӨДРИЙН ТОЙМ','TODAY OVERVIEW')}</small><b>₮300,000</b><div className={styles.miniChart}>{[34,58,45,72,66,89,78].map((v,i)=><i key={i} style={{height:v+'%'}}/>)}</div></div><div className={styles.channels}><span>Meta</span><span>Google</span><span>YouTube</span><span>TikTok</span><span>X</span></div></div>
      <div className={styles.floatA}><BarChart3 size={17}/><div><small>{text('Хүрэлт','Reach')}</small><b>+38.4%</b></div></div>
      <div className={styles.floatB}><PlayCircle size={17}/><div><small>{text('Видео үзэлт','Video views')}</small><b>128K</b></div></div>
      <div className={styles.floatC}><Globe2 size={17}/><div><small>{text('Суваг','Channels')}</small><b>8 / 8</b></div></div>
    </div>
  </section>
}
