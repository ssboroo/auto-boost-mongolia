import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import styles from '../legal.module.css'

export default function DataDeletionPage() {
  return <main className={styles.page}><div className={styles.shell}>
    <div className={styles.top}><Link className={styles.brand} href="/"><span className={styles.brandMark}><Trash2 size={19}/></span>RAINY</Link><Link className={styles.back} href="/">← Нүүр хуудас</Link></div>
    <article className={styles.card}>
      <span className={styles.eyebrow}>МЭДЭЭЛЭЛ УСТГАХ</span><h1>Мэдээлэл устгуулах заавар</h1><div className={styles.updated}>Сүүлд шинэчилсэн: 2026-09-03</div>
      <section className={styles.section}><h2>Facebook/Meta холболтоо салгах</h2><p>RAINY-д нэвтэрч Facebook холболтын хэсгээс disconnect хийснээр тухайн workspace-ийн хадгалсан Meta access token устгагдана. Мөн Facebook Settings → Apps and Websites хэсгээс RAINY-ийн access-ийг revoke хийж болно.</p></section>
      <section className={styles.section}><h2>Бүх account мэдээллээ устгуулах</h2><p>Өөрийн account-аар нэвтэрсний дараа support хүсэлтдээ “Мэдээлэл устгах хүсэлт” гэж тодорхой бичиж, account-ийн имэйлээ оруулна. Бид тухайн account-тай холбоотой profile, workspace membership, Meta connection, ad drafts болон шаардлагагүй personal data-г шалгаж устгана.</p></section>
      <section className={styles.section}><h2>Устгахгүй байж болох мэдээлэл</h2><p>Татвар, санхүүгийн бүртгэл, fraud prevention, security audit, хууль ёсны маргаан болон зохицуулалтын шаардлагаар заавал хадгалах ёстой transaction/receipt/audit мэдээллийг шаардлагатай хугацаанд хадгалж болно. Ийм мэдээллийг үйл ажиллагааны бус зорилгоор ашиглахгүй.</p></section>
      <section className={styles.section}><h2>Хугацаа</h2><p>Хүсэлтийг баталгаажуулсны дараа техникийн болон хууль ёсны хадгалалтын шаардлагаас хамааран боломжит хугацаанд гүйцэтгэнэ. Backup болон provider талын устгал тусдаа хугацаатай байж болно.</p></section>
      <section className={styles.section}><h2>Meta Data Deletion URL</h2><p>Meta for Developers-ийн Data Deletion Instructions URL талбарт энэ public URL-г ашиглаж болно: <strong>https://auto-boost-mongolia.vercel.app/data-deletion</strong>.</p></section>
      <div className={styles.notice}>Public launch-аас өмнө support/privacy contact-ийн албан ёсны имэйл эсвэл ticket сувгийг энэ хуудсанд операторын бодит мэдээллээр нэмнэ.</div>
      <div className={styles.links}><Link href="/privacy">Нууцлалын бодлого</Link><Link href="/terms">Үйлчилгээний нөхцөл</Link></div>
    </article>
  </div></main>
}
