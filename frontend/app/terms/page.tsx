import Link from 'next/link'
import { FileCheck2 } from 'lucide-react'
import styles from '../legal.module.css'

export default function TermsPage() {
  return <main className={styles.page}><div className={styles.shell}>
    <div className={styles.top}><Link className={styles.brand} href="/"><span className={styles.brandMark}><FileCheck2 size={19}/></span>AUTO BOOST MONGOLIA</Link><Link className={styles.back} href="/">← Нүүр хуудас</Link></div>
    <article className={styles.card}>
      <span className={styles.eyebrow}>Terms of Service</span><h1>Үйлчилгээний нөхцөл</h1><div className={styles.updated}>Сүүлд шинэчилсэн: 2026-09-03</div>
      <section className={styles.section}><h2>1. Үйлчилгээ</h2><p>Auto Boost Mongolia нь Meta зарын тохиргоо, төсөв, аудит, тайлан, payment fee болон AI-assisted workflow-ийг Монгол хэлээр удирдах SaaS платформ юм. Meta-ийн өөрийн үйлчилгээ, ad delivery, auction, account review болон billing нь Meta-ийн нөхцөлөөр зохицуулагдана.</p></section>
      <section className={styles.section}><h2>2. Хэрэглэгчийн баталгаа</h2><p>Шинэ campaign/ad set/ad нь аюулгүй байдлын үүднээс PAUSED-first зарчмаар үүснэ. Хэрэглэгчийн илэрхий баталгаагүйгээр Auto Boost Mongolia нь ad spend-ийг автоматаар идэвхжүүлэхгүй.</p></section>
      <section className={styles.section}><h2>3. Төлбөр ба шимтгэл</h2><p>Meta зарын төсөв нь хэрэглэгчийн Meta Ad Account payment method-оор Meta-д төлөгдөнө. Auto Boost үйлчилгээний шимтгэл нь тусдаа тооцогдож, checkout-аар төлөгдөнө. UI дээр харагдах USD→MNT хөрвүүлэлт нь тухайн үед системд ашиглагдсан reference rate-д тулгуурлана.</p></section>
      <section className={styles.section}><h2>4. Refund ба failed payment</h2><p>Амжилтгүй эсвэл цуцлагдсан payment нь paid гэж тооцогдохгүй. Давхардсан checkout-аас сэргийлэх idempotency хамгаалалт ашиглана. Буцаалт шаардлагатай тохиолдолд тухайн transaction, provider status болон үйлчилгээ үзүүлсэн эсэхээс шалтгаалан тусад нь шийдвэрлэнэ.</p></section>
      <section className={styles.section}><h2>5. Хариуцлага</h2><p>Зарын үр дүн, impression, click, lead, sale нь Meta auction, audience, creative, budget болон зах зээлийн олон хүчин зүйлээс шалтгаална. Auto Boost Mongolia нь тодорхой хэмжээний борлуулалт, reach эсвэл ROI-г баталгаажуулахгүй.</p></section>
      <section className={styles.section}><h2>6. Хориглох хэрэглээ</h2><p>Хууль зөрчсөн, залилан, хуурамч мэдээлэл, бусдын эрх зөрчсөн контент, Meta Advertising Standards зөрчсөн зар үүсгэхийг хориглоно. Зөрчил илэрвэл access хязгаарлах боломжтой.</p></section>
      <section className={styles.section}><h2>7. Account ба аюулгүй байдал</h2><p>Хэрэглэгч account credential-аа хамгаалах үүрэгтэй. Facebook/Meta access болон payment secret-үүдийг бусдад дамжуулахгүй байх шаардлагатай.</p></section>
      <section className={styles.section}><h2>8. Нөхцөл шинэчлэх</h2><p>Үйлчилгээ, хууль эрх зүй, Meta эсвэл payment provider-ийн шаардлага өөрчлөгдвөл энэхүү нөхцөлийг шинэчилж болно. Сүүлд шинэчилсэн огноо дээр харагдана.</p></section>
      <div className={styles.notice}>Public launch-аас өмнө оператор компанийн албан ёсны нэр, хаяг, support/privacy contact болон refund-ийн бизнесийн эцсийн нөхцөлийг бодит мэдээллээр баталгаажуулна.</div>
      <div className={styles.links}><Link href="/privacy">Нууцлалын бодлого</Link><Link href="/data-deletion">Мэдээлэл устгах</Link></div>
    </article>
  </div></main>
}
