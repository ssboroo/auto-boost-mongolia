import { Facebook, Globe2, Linkedin, Music2 } from 'lucide-react'
import styles from './dashboard.module.css'

export default function DashboardHero({ connected }: { connected: boolean }) {
  return <section className={styles.hero}>
    <div className={styles.heroCopy}>
      <span>ONE CAMPAIGN · 8 AD CHANNELS</span>
      <h1>Рекламаа<br/><em>нэг дор удирд</em></h1>
      <p>Facebook, Instagram, Google, YouTube, TikTok, X, LinkedIn болон Microsoft Ads-ийг Монгол хэлтэй нэг workflow-оор бэлтгэж, төсөв болон үр дүнгээ нэг dashboard-аас харна.</p>
      <div className={styles.heroActions}>
        <a href="/campaigns/new">Сурталчилгаа үүсгэх →</a>
        <a className={styles.secondary} href="/facebook"><Facebook size={16}/>{connected ? 'Meta холбогдсон' : 'Meta холбох'}</a>
      </div>
    </div>

    <div className={styles.visual} aria-label="Multi-channel ads preview">
      <div className={styles.reach}>
        <small>CHANNELS</small>
        <b>8</b>
        <div><i/><i/><i/><i/><i/></div>
      </div>
      <div className={styles.adPreview}>
        <div><Globe2 size={18}/><small>Multi-channel · Preview</small><b>•••</b></div>
        <div style={{height:94,display:'grid',placeItems:'center',background:'linear-gradient(135deg,#073c2b,#00a761)',color:'#fff',fontWeight:900,fontSize:20}}>BOOST.MN</div>
        <strong>Нэг төсөв.<br/>Олон суваг.<br/>Нэг үр дүн.</strong>
        <footer>Shown-ready architecture <span>MN</span></footer>
      </div>
      <div className={styles.benefits}>
        <span><Facebook size={15}/>Meta</span>
        <span><Globe2 size={15}/>Google</span>
        <span><Music2 size={15}/>TikTok · X</span>
        <span><Linkedin size={15}/>LinkedIn · Microsoft</span>
      </div>
      <div className={styles.note}>Монгол бизнесүүдэд зориулсан<br/>нэгдсэн рекламын платформ ↗</div>
    </div>
  </section>
}
