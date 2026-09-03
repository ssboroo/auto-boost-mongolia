import { Facebook, TrendingUp, Users, Zap } from 'lucide-react'
import styles from './dashboard.module.css'

export default function DashboardHero({ connected }: { connected: boolean }) {
  return <section className={styles.hero}>
    <div className={styles.heroCopy}>
      <span>AI-POWERED FACEBOOK ADS</span>
      <h1>Бизнесээ<br/><em>AI-тай хамт өсгө</em></h1>
      <p>Илүү хэрэглэгч, илүү борлуулалт, илүү өсөлт — хурдан, хялбар, ухаалгаар.</p>
      <div className={styles.heroActions}><a href="#boost">Boost үүсгэх →</a><a className={styles.secondary} href="/facebook"><Facebook size={16}/>{connected?'Facebook бэлэн':'Facebook холбох'}</a></div>
    </div>
    <div className={styles.visual} aria-label="RAINY Facebook зарын жишээ">
      <div className={styles.reach}><small>Reach</small><b>+320%</b><div><i/><i/><i/><i/><i/></div></div>
      <div className={styles.adPreview}><div><Facebook size={18} fill="currentColor"/><small>Sponsored</small><b>•••</b></div><img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85" alt="Бизнесийн зарын жишээ"/><strong>Таны бизнест<br/>Илүү Олон<br/>Хэрэглэгчид</strong><footer>● 2.4K <span>◌ 120</span></footer></div>
      <div className={styles.benefits}><span><Users size={15}/>Илүү хүртээмж</span><span><TrendingUp size={15}/>Илүү борлуулалт</span><span><Zap size={15}/>Бага ажиллагаа</span></div>
      <div className={styles.note}>Монголын Бизнесүүд<br/>Илүү Тэргүүлэх Ирээдүй рүү ↗</div>
    </div>
  </section>
}
