import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import styles from '../legal.module.css'

export default function PrivacyPage() {
  return <main className={styles.page}><div className={styles.shell}>
    <div className={styles.top}><Link className={styles.brand} href="/"><span className={styles.brandMark}><ShieldCheck size={19}/></span>AUTO BOOST MONGOLIA</Link><Link className={styles.back} href="/">← Нүүр хуудас</Link></div>
    <article className={styles.card}>
      <span className={styles.eyebrow}>Privacy Policy</span><h1>Нууцлалын бодлого</h1><div className={styles.updated}>Сүүлд шинэчилсэн: 2026-09-03</div>
      <section className={styles.section}><h2>1. Бид ямар мэдээлэл боловсруулдаг вэ?</h2><p>Auto Boost Mongolia нь хэрэглэгчийн бүртгэлийн имэйл, workspace-ийн мэдээлэл, Meta/Facebook холболтын таних мэдээлэл, зарын draft ба тохиргоо, төлбөрийн гүйлгээний төлөв, аудит болон аюулгүй ажиллагааны лог зэрэг үйлчилгээг ажиллуулахад шаардлагатай мэдээллийг боловсруулна.</p></section>
      <section className={styles.section}><h2>2. Meta/Facebook мэдээлэл</h2><p>Facebook-ээ холбоход Meta OAuth-оор зөвшөөрсөн permission-ийн хүрээнд Page, Ad Account болон зар удирдахад шаардлагатай мэдээлэл авна. Access token нь browser-д ил гарахгүй, backend талд шифрлэгдэн хадгалагдана. Auto Boost Mongolia нь хэрэглэгчийн баталгаагүйгээр зарын spend-ийг автоматаар ACTIVE болгохгүй.</p></section>
      <section className={styles.section}><h2>3. Төлбөрийн мэдээлэл</h2><p>Үйлчилгээний шимтгэлийн төлбөрийг гадаад төлбөрийн үйлчилгээ үзүүлэгчээр боловсруулна. Бид картын бүтэн дугаар, CVV зэрэг эмзэг payment credential хадгалахгүй. Харин PaymentIntent/checkout identifier, төлөв, дүн, баримтын дугаар болон webhook event-ийн техникийн мэдээллийг reconciliation, receipt, fraud prevention зориулалтаар хадгалж болно.</p></section>
      <section className={styles.section}><h2>4. Мэдээллийг юунд ашиглах вэ?</h2><ul><li>Нэвтрэлт, workspace, Meta холболт болон зарын үйлчилгээг ажиллуулах;</li><li>USD/MNT тооцоо, үйлчилгээний шимтгэл, receipt болон transaction history үүсгэх;</li><li>Аюулгүй байдал, алдаа илрүүлэх, audit trail болон abuse prevention;</li><li>Хууль ёсны шаардлага, хэрэглэгчийн хүсэлт, маргаан шийдвэрлэх.</li></ul></section>
      <section className={styles.section}><h2>5. Хадгалалт ба хамгаалалт</h2><p>Нууц credential-уудыг frontend public variable-д оруулахгүй. Meta token-ууд шифрлэгдэж, tenant өгөгдөл Supabase Row Level Security-ээр workspace-аар тусгаарлагдана. Webhook request нь signature, timestamp болон зөвшөөрөгдсөн source IP шалгалттай.</p></section>
      <section className={styles.section}><h2>6. Мэдээлэл хуваалцах</h2><p>Үйлчилгээг хүргэхэд шаардлагатай hosting, database, Meta болон payment provider зэрэг дэд үйлчилгээ үзүүлэгчтэй зөвхөн шаардлагатай хэмжээнд мэдээлэл дамжиж болно. Хэрэглэгчийн хувийн мэдээллийг зар сурталчилгааны зорилгоор гуравдагч этгээдэд худалдахгүй.</p></section>
      <section className={styles.section}><h2>7. Таны эрх</h2><p>Та өөрийн мэдээлэлтэй танилцах, засах, Facebook холболтоо салгах, мэдээлэл устгуулах хүсэлт гаргах боломжтой. Устгалын зааврыг Data Deletion хуудаснаас үзнэ үү.</p></section>
      <div className={styles.notice}>Энэ бодлого нь Auto Boost Mongolia платформын одоогийн техникийн ажиллагааг тайлбарлана. Бизнесийн албан ёсны хаяг, оператор компанийн нэр, privacy contact мэдээллийг public launch-аас өмнө компанийн бодит мэдээллээр нөхнө.</div>
      <div className={styles.links}><Link href="/terms">Үйлчилгээний нөхцөл</Link><Link href="/data-deletion">Мэдээлэл устгах</Link></div>
    </article>
  </div></main>
}
