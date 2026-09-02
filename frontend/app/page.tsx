'use client'

import { useMemo, useState } from 'react'
import { BarChart3, Bot, ChevronRight, CircleDollarSign, Facebook, LayoutDashboard, Megaphone, Settings, Sparkles, Target, Users } from 'lucide-react'

const tabs = ['Кампайн', 'Зарын багц', 'Зар', 'AI шалгалт', 'Урьдчилан харах']

export default function HomePage() {
  const [tab, setTab] = useState(0)
  const [budget, setBudget] = useState(30000)
  const [days, setDays] = useState(7)
  const [gender, setGender] = useState('Бүгд')
  const [placementMode, setPlacementMode] = useState('Advantage+')
  const [creativeMode, setCreativeMode] = useState('Одоо байгаа пост')
  const [aiApplied, setAiApplied] = useState(false)
  const total = useMemo(() => budget * days, [budget, days])
  const score = aiApplied ? 97 : 92

  const goTo = (index: number) => setTab(Math.max(0, Math.min(tabs.length - 1, index)))

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brandMark">AB</div><div><b>AUTO BOOST</b><span>MONGOLIA</span></div></div>
        <nav>
          <a className="active" href="#workspace"><LayoutDashboard size={18}/>Хяналтын самбар</a>
          <a href="#workspace" onClick={() => goTo(0)}><Megaphone size={18}/>Кампайн</a>
          <a href="#insights"><BarChart3 size={18}/>Тайлан</a>
          <a href="#ai"><Bot size={18}/>AI зөвлөмж</a>
          <a href="/facebook"><Facebook size={18}/>Facebook холболт</a>
          <a href="#settings"><Settings size={18}/>Тохиргоо</a>
        </nav>
        <div className="sidebarCard"><Sparkles size={18}/><div><b>AI туслах</b><p>Таны тохиргоог бодит цагт шалгана.</p></div></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">МЭРГЭЖЛИЙН ГОРИМ</p><h1>Шинэ зар үүсгэх</h1><p>Meta Ads Manager-ийн нарийн тохиргоог Монгол хэлээр.</p></div>
          <a className="connect" href="/facebook"><Facebook size={18}/> Facebook холболт</a>
        </header>

        <div className="stepper" aria-label="Зар үүсгэх алхмууд">
          {tabs.map((label, index) => <button key={label} className={index === tab ? 'step activeStep' : 'step'} onClick={() => goTo(index)}><span>{index + 1}</span>{label}</button>)}
        </div>

        <div className="workspace" id="workspace">
          <div className="formCard">
            {tab === 0 && <>
              <Section icon={<Target size={20}/>} title="Кампайны үндсэн тохиргоо" text="Зарын зорилго болон төсвийн стратегиа сонгоно уу." />
              <Field label="Кампайны нэр"><input defaultValue="2026 Намрын сурталчилгаа" /></Field>
              <Field label="Зарын зорилго" hint="Та ямар үр дүн авахыг хүсэж байгаагаа сонгоно."><select defaultValue="engagement"><option value="awareness">Таниулах</option><option value="traffic">Хандалт нэмэх</option><option value="engagement">Оролцоо / Мессеж</option><option value="leads">Lead цуглуулах</option><option value="sales">Борлуулалт</option></select></Field>
              <div className="grid2">
                <Field label="Өдрийн төсөв"><div className="money"><input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))}/><span>₮</span></div></Field>
                <Field label="Хугацаа"><div className="money"><input type="number" value={days} onChange={e => setDays(Number(e.target.value))}/><span>хоног</span></div></Field>
              </div>
              <div className="summaryLine"><span>Тооцоолсон нийт дээд төсөв</span><b>{total.toLocaleString()}₮</b></div>
              <Toggle title="Advantage campaign budget" text="Meta төсвийг хамгийн сайн ажиллаж буй зарын багц руу автоматаар хуваарилна." />
              <Toggle title="A/B туршилт" text="Хоёр өөр хувилбарыг харьцуулан шалгана." />
            </>}

            {tab === 1 && <>
              <Section icon={<Users size={20}/>} title="Зорилтот хүмүүс" text="Хэн таны зарыг харахыг нарийвчлан тохируулна." />
              <div className="grid2"><Field label="Байршил"><input defaultValue="Улаанбаатар, Монгол" /></Field><Field label="Radius"><select><option>+25 км</option><option>+40 км</option><option>+80 км</option></select></Field></div>
              <div className="grid2"><Field label="Доод нас"><input type="number" defaultValue={23}/></Field><Field label="Дээд нас"><input type="number" defaultValue={45}/></Field></div>
              <Field label="Хүйс"><div className="chips">{['Бүгд','Эрэгтэй','Эмэгтэй'].map(x => <button key={x} type="button" className={gender === x ? 'selected' : ''} onClick={() => setGender(x)}>{x}</button>)}</div></Field>
              <Field label="Сонирхол ба зан төлөв" hint="Meta-ийн detailed targeting-тэй дүйцэх тохиргоо."><input placeholder="Жишээ: Онлайн худалдаа, Технологи, Бизнес" /></Field>
              <Field label="Зар харагдах байршил"><div className="chips">{['Advantage+','Гараар сонгох'].map(x => <button key={x} type="button" className={placementMode === x ? 'selected' : ''} onClick={() => setPlacementMode(x)}>{x}</button>)}</div></Field>
              <div className="placementGrid">{['Facebook Feed','Instagram Feed','Facebook Story','Instagram Story','Facebook Reels','Instagram Reels','Messenger'].map(x => <label key={x}><input type="checkbox" defaultChecked/> {x}</label>)}</div>
            </>}

            {tab === 2 && <>
              <Section icon={<Megaphone size={20}/>} title="Зар ба бүтээлч материал" text="Одоо байгаа пост ашиглах эсвэл шинэ зар үүсгэнэ." />
              <Field label="Зарын төрөл"><div className="chips">{['Одоо байгаа пост','Шинэ зар'].map(x => <button key={x} type="button" className={creativeMode === x ? 'selected' : ''} onClick={() => setCreativeMode(x)}>{x}</button>)}</div></Field>
              <Field label="Facebook пост"><select><option>Google AI Pro — 1 жилийн эрх...</option><option>Шинэ үйлчилгээний танилцуулга...</option></select></Field>
              <Field label="Үндсэн текст"><textarea rows={5} defaultValue="AI ашиглан ажлаа хурдасгаж, бизнесийн контентоо илүү хурдан бүтээгээрэй." /></Field>
              <div className="grid2"><Field label="Гарчиг"><input defaultValue="Google AI Pro"/></Field><Field label="Үйлдлийн товч"><select><option>Мессеж илгээх</option><option>Дэлгэрэнгүй</option><option>Худалдан авах</option></select></Field></div>
              <Field label="Очих холбоос"><input placeholder="https://..." /></Field>
            </>}

            {tab >= 3 && <>
              <Section icon={<Bot size={20}/>} title={tab === 3 ? 'AI шалгалт' : 'Урьдчилан харах'} text={tab === 3 ? 'Нийтлэхийн өмнө төсөв, audience, placement, creative-ийг шалгана.' : 'Зар Facebook болон Instagram дээр хэрхэн харагдахыг шалгана.'} />
              {tab === 3 ? <div className="audit"><Audit ok text="Төсвийн хэмжээ хэвийн байна"/><Audit ok text="Зорилтот бүлгийн хэмжээ хангалттай"/><Audit ok text="Facebook болон Instagram placement идэвхтэй"/><Audit ok={aiApplied} text={aiApplied ? '9:16 creative recommendation хэрэглэгдсэн' : 'Instagram Reels-д 9:16 creative нэмбэл илүү сайн'}/></div> : <div className="preview"><div className="previewTop"><div className="avatar">AB</div><div><b>Auto Boost Mongolia</b><span>Sponsored · 🌐</span></div></div><p>AI ашиглан ажлаа хурдасгаж, бизнесийн контентоо илүү хурдан бүтээгээрэй.</p><div className="creative">Таны зарын зураг / видео</div><div className="previewCta"><div><small>ТАНИЛЦУУЛГА</small><b>Google AI Pro</b></div><button>Мессеж илгээх</button></div></div>}
            </>}

            <div className="actions"><button className="secondary" disabled={tab === 0} onClick={() => goTo(tab - 1)}>Өмнөх</button><button className="primary" onClick={() => tab === tabs.length - 1 ? alert('Зарын draft бэлтгэгдлээ. Meta API холболтын дараа PAUSED төлөвөөр үүсгэнэ.') : goTo(tab + 1)}>{tab === tabs.length - 1 ? 'Зар бэлтгэх' : 'Үргэлжлүүлэх'} <ChevronRight size={18}/></button></div>
          </div>

          <aside className="aiPanel" id="ai">
            <div className="aiTitle"><div className="aiIcon"><Sparkles size={18}/></div><div><b>AI туслах</b><span>Бодит цагийн зөвлөмж</span></div></div>
            <div className="score"><span>Тохиргооны үнэлгээ</span><b>{score}/100</b><div className="bar"><i style={{width:`${score}%`}} /></div></div>
            <div className="tip good"><b>Сайн тохиргоо</b><p>23–45 насны хүрээ болон Улаанбаатарын байршил таны зорилгод нийцэж байна.</p></div>
            <div className="tip"><b>Сайжруулах санал</b><p>{aiApplied ? 'Reels placement-д зориулсан creative зөвлөмж хэрэглэгдсэн.' : 'Reels-д зориулсан 9:16 creative нэмбэл placement coverage нэмэгдэнэ.'}</p><button type="button" onClick={() => setAiApplied(true)} disabled={aiApplied}>{aiApplied ? 'Хэрэглэсэн' : 'Саналыг хэрэглэх'}</button></div>
            <div className="cost"><CircleDollarSign size={20}/><div><span>Нийт дээд төсөв</span><b>{total.toLocaleString()}₮</b></div></div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function Section({icon,title,text}:{icon:React.ReactNode,title:string,text:string}) { return <div className="sectionHead"><div className="sectionIcon">{icon}</div><div><h2>{title}</h2><p>{text}</p></div></div> }
function Field({label,hint,children}:{label:string,hint?:string,children:React.ReactNode}) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label> }
function Toggle({title,text}:{title:string,text:string}) { return <div className="toggleRow"><div><b>{title}</b><p>{text}</p></div><label className="switch"><input type="checkbox"/><span /></label></div> }
function Audit({ok=false,text}:{ok?:boolean,text:string}) { return <div className={ok ? 'auditRow ok':'auditRow warn'}><span>{ok ? '✓':'!'}</span><p>{text}</p></div> }
