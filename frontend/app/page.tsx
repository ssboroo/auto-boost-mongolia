'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Facebook,
  Gauge,
  LayoutDashboard,
  Megaphone,
  Menu,
  MonitorSmartphone,
  MoreHorizontal,
  Plus,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WandSparkles,
  X,
} from 'lucide-react'
import { apiFetch } from '../lib/api'

type ApiStatus = {
  configured: boolean
  sessionConfigured: boolean
  productionReady: boolean
  graphVersion: string
}

type SessionStatus = {
  connected: boolean
  profile?: { id?: string; name?: string; picture?: { data?: { url?: string } } }
}

const steps = [
  { label: 'Кампайн', short: 'Зорилго' },
  { label: 'Зарын багц', short: 'Audience' },
  { label: 'Зар', short: 'Creative' },
  { label: 'AI шалгалт', short: 'Quality' },
  { label: 'Баталгаажуулах', short: 'Preview' },
]

const placements = ['Facebook Feed', 'Instagram Feed', 'Facebook Story', 'Instagram Story', 'Facebook Reels', 'Instagram Reels', 'Messenger']

export default function HomePage() {
  const [step, setStep] = useState(0)
  const [mobileNav, setMobileNav] = useState(false)
  const [budget, setBudget] = useState(30000)
  const [days, setDays] = useState(7)
  const [gender, setGender] = useState('Бүгд')
  const [placementMode, setPlacementMode] = useState('Advantage+')
  const [selectedPlacements, setSelectedPlacements] = useState(placements)
  const [creativeMode, setCreativeMode] = useState('Одоо байгаа пост')
  const [aiApplied, setAiApplied] = useState(false)
  const [campaignBudget, setCampaignBudget] = useState(true)
  const [abTest, setAbTest] = useState(false)
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [session, setSession] = useState<SessionStatus>({ connected: false })
  const [healthError, setHealthError] = useState('')
  const [draftReady, setDraftReady] = useState(false)

  const total = useMemo(() => Math.max(0, budget) * Math.max(1, days), [budget, days])
  const score = aiApplied ? 98 : 92

  useEffect(() => {
    Promise.all([
      apiFetch<ApiStatus>('/meta/status'),
      apiFetch<SessionStatus>('/meta/session').catch(() => ({ connected: false })),
    ])
      .then(([status, currentSession]) => {
        setApiStatus(status)
        setSession(currentSession)
      })
      .catch((error: Error) => setHealthError(error.message || 'Backend холболт амжилтгүй.'))
  }, [])

  const goTo = (index: number) => {
    setStep(Math.max(0, Math.min(steps.length - 1, index)))
    window.setTimeout(() => document.getElementById('builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
  }

  const togglePlacement = (name: string) => {
    setSelectedPlacements((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])
  }

  const connectionLabel = healthError
    ? 'Backend алдаа'
    : session.connected
      ? session.profile?.name || 'Facebook холбогдсон'
      : apiStatus?.productionReady
        ? 'Facebook холбох'
        : apiStatus
          ? 'Meta тохиргоо дутуу'
          : 'Шалгаж байна…'

  return (
    <main className="appShell">
      <aside className={mobileNav ? 'sidebar sidebarOpen' : 'sidebar'}>
        <div className="sidebarTop">
          <a className="brand" href="/" aria-label="Auto Boost Mongolia">
            <div className="brandMark"><WandSparkles size={19} /></div>
            <div><b>AUTO BOOST</b><span>MONGOLIA</span></div>
          </a>
          <button className="mobileClose" aria-label="Цэс хаах" onClick={() => setMobileNav(false)}><X size={20} /></button>
        </div>

        <div className="workspaceBadge">
          <span>Workspace</span>
          <b>Үндсэн аккаунт</b>
          <MoreHorizontal size={16} />
        </div>

        <nav className="mainNav">
          <NavItem icon={<LayoutDashboard size={18} />} label="Хяналтын самбар" active href="#dashboard" />
          <NavItem icon={<Megaphone size={18} />} label="Кампайн" href="#builder" onClick={() => goTo(0)} />
          <NavItem icon={<BarChart3 size={18} />} label="Тайлан" href="#performance" />
          <NavItem icon={<Bot size={18} />} label="AI зөвлөмж" href="#assistant" badge="AI" />
          <NavItem icon={<Facebook size={18} />} label="Facebook холболт" href="/facebook" />
        </nav>

        <div className="navDivider" />
        <nav className="mainNav secondaryNav">
          <NavItem icon={<Settings size={18} />} label="Тохиргоо" href="#settings" />
          <NavItem icon={<ShieldCheck size={18} />} label="Аюулгүй байдал" href="#security" />
        </nav>

        <div className="sidebarUpgrade">
          <div className="upgradeIcon"><Sparkles size={18} /></div>
          <b>AI Campaign Copilot</b>
          <p>Төсөв, audience, creative-ийг нийтлэхийн өмнө автоматаар шалгана.</p>
          <span>2026 Beta</span>
        </div>
      </aside>

      {mobileNav && <button className="navBackdrop" aria-label="Цэс хаах" onClick={() => setMobileNav(false)} />}

      <section className="mainArea">
        <header className="appHeader">
          <div className="headerLeft">
            <button className="mobileMenu" aria-label="Цэс нээх" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
            <div className="crumbs"><span>Auto Boost</span><i>/</i><b>Хяналтын самбар</b></div>
          </div>
          <div className="headerActions">
            <div className={healthError ? 'systemPill systemError' : 'systemPill'}>
              <i />
              <span>{healthError ? 'API тасарсан' : 'Систем хэвийн'}</span>
            </div>
            <button className="iconButton" aria-label="Мэдэгдэл"><Bell size={18} /></button>
            <a className={session.connected ? 'profileButton connected' : 'profileButton'} href="/facebook">
              <div className="profileAvatar">{session.connected ? '✓' : 'f'}</div>
              <div><b>{connectionLabel}</b><span>{session.connected ? 'Meta session идэвхтэй' : 'Meta Ads account'}</span></div>
              <ChevronRight size={16} />
            </a>
          </div>
        </header>

        <div className="pageWrap" id="dashboard">
          <section className="heroPanel">
            <div className="heroCopy">
              <div className="heroEyebrow"><Sparkles size={14} /> AI ADS MANAGER · MONGOLIA</div>
              <h1>Зараа илүү ухаалгаар<br /><span>өсгө.</span></h1>
              <p>Meta Ads Manager-ийн мэргэжлийн тохиргоо, AI шалгалт, тайланг нэг цэвэр Монгол интерфэйсээс удирдана.</p>
              <div className="heroActions">
                <button className="button primaryButton" onClick={() => goTo(0)}><Plus size={18} /> Шинэ зар үүсгэх</button>
                <a className="button ghostButton" href="/facebook"><Facebook size={18} /> Facebook холбох</a>
              </div>
            </div>
            <div className="heroVisual" aria-hidden="true">
              <div className="orb orbOne" />
              <div className="orb orbTwo" />
              <div className="metricFloat metricA"><span>CTR</span><b>+24%</b><small>AI optimization</small></div>
              <div className="metricFloat metricB"><span>Quality</span><b>{score}/100</b><small>Campaign score</small></div>
              <div className="heroRing"><Rocket size={34} /><span>READY</span></div>
            </div>
          </section>

          <section className="statGrid" id="performance">
            <StatCard icon={<CircleDollarSign size={18} />} label="Төлөвлөсөн төсөв" value={`${total.toLocaleString()}₮`} sub={`${days} хоногийн дээд хэмжээ`} trend="live" />
            <StatCard icon={<Gauge size={18} />} label="AI үнэлгээ" value={`${score}/100`} sub={aiApplied ? 'Санал хэрэглэгдсэн' : '1 санал хүлээж байна'} trend="good" />
            <StatCard icon={<Users size={18} />} label="Audience" value="23–45" sub="Улаанбаатар · Бүгд" />
            <StatCard icon={<MonitorSmartphone size={18} />} label="Placement" value={placementMode} sub={`${selectedPlacements.length} байршил сонгосон`} />
          </section>

          {(healthError || (apiStatus && !apiStatus.productionReady)) && (
            <section className={healthError ? 'noticeBanner dangerNotice' : 'noticeBanner'}>
              <div className="noticeIcon"><ShieldCheck size={20} /></div>
              <div>
                <b>{healthError ? 'Backend API холболтыг шалгана уу' : 'Meta production тохиргоо бүрэн биш байна'}</b>
                <p>{healthError || 'META_APP_ID, META_APP_SECRET, SESSION_SECRET, HTTPS redirect URI-г backend environment дээр бүрэн тохируулна уу.'}</p>
              </div>
              <a href="/facebook">Шалгах <ArrowRight size={16} /></a>
            </section>
          )}

          <section className="builderSection" id="builder">
            <div className="sectionTitleRow">
              <div>
                <span className="sectionKicker">CAMPAIGN BUILDER</span>
                <h2>Шинэ зар үүсгэх</h2>
                <p>Алхам бүрийг дуусгаад AI шалгалтаар баталгаажуулна.</p>
              </div>
              <div className="draftPill"><i /> Draft автоматаар хадгалагдана</div>
            </div>

            <div className="builderLayout">
              <div className="builderMain">
                <div className="stepRail">
                  {steps.map((item, index) => (
                    <button key={item.label} className={index === step ? 'stepItem current' : index < step ? 'stepItem complete' : 'stepItem'} onClick={() => goTo(index)}>
                      <span className="stepNumber">{index < step ? <Check size={14} /> : index + 1}</span>
                      <span className="stepText"><b>{item.label}</b><small>{item.short}</small></span>
                    </button>
                  ))}
                </div>

                <div className="formSurface">
                  {step === 0 && (
                    <>
                      <FormHeader icon={<Target size={20} />} eyebrow="01 · CAMPAIGN" title="Кампайны үндсэн тохиргоо" text="Бизнесийн зорилго болон төсвийн стратегиа тодорхойлно." />
                      <div className="formGrid single">
                        <Field label="Кампайны нэр" required><input defaultValue="2026 Намрын сурталчилгаа" /></Field>
                      </div>
                      <Field label="Зарын зорилго" hint="Meta-ийн 6 үндсэн campaign objective-оос сонгоно." required>
                        <div className="objectiveGrid">
                          {[
                            ['awareness', 'Таниулах', 'Брэндийн танигдалт'],
                            ['traffic', 'Хандалт', 'Веб, апп руу урсгал'],
                            ['engagement', 'Оролцоо', 'Message, like, video'],
                            ['leads', 'Lead', 'Харилцагчийн мэдээлэл'],
                            ['sales', 'Борлуулалт', 'Purchase, conversion'],
                            ['app', 'Апп', 'Install, app event'],
                          ].map(([value, title, sub], index) => (
                            <label key={value} className={index === 2 ? 'objectiveCard selectedObjective' : 'objectiveCard'}>
                              <input type="radio" name="objective" defaultChecked={index === 2} />
                              <span className="objectiveDot" />
                              <b>{title}</b><small>{sub}</small>
                            </label>
                          ))}
                        </div>
                      </Field>
                      <div className="formGrid">
                        <Field label="Өдрийн төсөв" required><div className="inputAffix"><input type="number" min="1000" value={budget} onChange={(event) => setBudget(Number(event.target.value))} /><span>₮</span></div></Field>
                        <Field label="Хугацаа" required><div className="inputAffix"><input type="number" min="1" max="365" value={days} onChange={(event) => setDays(Number(event.target.value))} /><span>хоног</span></div></Field>
                      </div>
                      <div className="budgetSummary">
                        <span><CircleDollarSign size={17} /> Тооцоолсон нийт дээд төсөв</span>
                        <b>{total.toLocaleString()}₮</b>
                      </div>
                      <Toggle checked={campaignBudget} onChange={setCampaignBudget} title="Advantage campaign budget" text="Meta хамгийн сайн ажиллаж буй ad set рүү төсвийг автоматаар хуваарилна." badge="Санал болгоно" />
                      <Toggle checked={abTest} onChange={setAbTest} title="A/B туршилт" text="Audience, creative эсвэл placement-ийн хоёр хувилбарыг туршина." />
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <FormHeader icon={<Users size={20} />} eyebrow="02 · AD SET" title="Audience & delivery" text="Хэн, хаана, ямар төхөөрөмж дээр таны зарыг харахыг тохируулна." />
                      <div className="formGrid">
                        <Field label="Байршил" required><input defaultValue="Улаанбаатар, Монгол" /></Field>
                        <Field label="Radius"><select defaultValue="25"><option value="10">+10 км</option><option value="25">+25 км</option><option value="40">+40 км</option><option value="80">+80 км</option></select></Field>
                      </div>
                      <div className="formGrid">
                        <Field label="Доод нас"><input type="number" defaultValue={23} min={18} max={65} /></Field>
                        <Field label="Дээд нас"><input type="number" defaultValue={45} min={18} max={65} /></Field>
                      </div>
                      <Field label="Хүйс"><Segmented options={['Бүгд', 'Эрэгтэй', 'Эмэгтэй']} value={gender} onChange={setGender} /></Field>
                      <Field label="Сонирхол ба зан төлөв" hint="Detailed targeting: сонирхол, зан төлөв, демографик мэдээлэл."><input placeholder="Жишээ: Онлайн худалдаа, Технологи, Бизнес" /></Field>
                      <Field label="Placement"><Segmented options={['Advantage+', 'Гараар сонгох']} value={placementMode} onChange={setPlacementMode} /></Field>
                      <div className={placementMode === 'Advantage+' ? 'placementGrid placementDisabled' : 'placementGrid'}>
                        {placements.map((item) => (
                          <label key={item} className={selectedPlacements.includes(item) ? 'placementOption selectedPlacement' : 'placementOption'}>
                            <input type="checkbox" checked={selectedPlacements.includes(item)} disabled={placementMode === 'Advantage+'} onChange={() => togglePlacement(item)} />
                            <span className="customCheck"><Check size={12} /></span>
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                      <div className="audienceMeter"><span>Audience хэмжээ</span><div><i style={{ width: '68%' }} /></div><b>Өргөн · Сайн</b></div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <FormHeader icon={<Megaphone size={20} />} eyebrow="03 · AD" title="Creative & message" text="Одоо байгаа Page пост ашиглах эсвэл шинэ creative бэлтгэнэ." />
                      <Field label="Зарын төрөл"><Segmented options={['Одоо байгаа пост', 'Шинэ зар']} value={creativeMode} onChange={setCreativeMode} /></Field>
                      {creativeMode === 'Одоо байгаа пост' ? (
                        <Field label="Facebook пост" required><select><option>Google AI Pro — 1 жилийн эрх...</option><option>Шинэ үйлчилгээний танилцуулга...</option></select></Field>
                      ) : (
                        <Field label="Creative файл" hint="JPG, PNG, MP4 · Reels-д 9:16 санал болгоно."><label className="uploadZone"><input type="file" accept="image/*,video/*" /><Sparkles size={22} /><b>Зураг эсвэл видеогоо сонго</b><span>эсвэл энд чирж оруулна уу</span></label></Field>
                      )}
                      <Field label="Үндсэн текст" required><textarea rows={5} defaultValue="AI ашиглан ажлаа хурдасгаж, бизнесийн контентоо илүү хурдан бүтээгээрэй." /></Field>
                      <div className="formGrid">
                        <Field label="Гарчиг"><input defaultValue="Google AI Pro" /></Field>
                        <Field label="CTA"><select><option>Мессеж илгээх</option><option>Дэлгэрэнгүй</option><option>Худалдан авах</option><option>Бүртгүүлэх</option></select></Field>
                      </div>
                      <Field label="Очих холбоос"><input placeholder="https://..." inputMode="url" /></Field>
                      <Field label="UTM tracking"><input placeholder="utm_source=facebook&utm_campaign=..." /></Field>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <FormHeader icon={<Bot size={20} />} eyebrow="04 · AI QUALITY" title="Нийтлэхийн өмнөх AI шалгалт" text="Төсөв, audience, placement, creative болон tracking-ийг нэг дор шалгана." />
                      <div className="qualityHero">
                        <div className="qualityScore"><strong>{score}</strong><span>/100</span></div>
                        <div><b>{score >= 95 ? 'Нийтлэхэд маш сайн бэлэн' : 'Нийтлэхэд бэлэн, 1 сайжруулалт байна'}</b><p>AI нь техникийн болон performance эрсдэлийг шалгасан.</p></div>
                      </div>
                      <div className="auditList">
                        <Audit title="Төсөв ба хугацаа" text={`${budget.toLocaleString()}₮ × ${days} хоног — хэвийн хүрээнд.`} ok />
                        <Audit title="Audience" text={`23–45 нас · ${gender} · Улаанбаатар.`} ok />
                        <Audit title="Placement coverage" text={`${placementMode} · ${selectedPlacements.length} placement.`} ok />
                        <Audit title="Creative aspect ratio" text={aiApplied ? '9:16 Reels creative зөвлөмж хэрэглэгдсэн.' : 'Reels-д 9:16 creative нэмбэл coverage сайжирна.'} ok={aiApplied} />
                      </div>
                      {!aiApplied && <button className="aiFixButton" onClick={() => setAiApplied(true)}><Sparkles size={17} /> AI саналыг хэрэглэх <ArrowRight size={16} /></button>}
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <FormHeader icon={<ShieldCheck size={20} />} eyebrow="05 · REVIEW" title="Эцсийн баталгаажуулалт" text="Зарын мэдээлэл, төсөв, creative-ийг шалгаад draft бэлтгэнэ." />
                      <div className="reviewGrid">
                        <div className="reviewDetails">
                          <ReviewRow label="Кампайн" value="2026 Намрын сурталчилгаа" />
                          <ReviewRow label="Зорилго" value="Оролцоо / Мессеж" />
                          <ReviewRow label="Audience" value={`23–45 · ${gender} · Улаанбаатар`} />
                          <ReviewRow label="Placement" value={placementMode} />
                          <ReviewRow label="Нийт төсөв" value={`${total.toLocaleString()}₮`} strong />
                          <div className="safetyCard"><ShieldCheck size={20} /><div><b>Зардлын хамгаалалт</b><p>Систем эхлээд <strong>PAUSED</strong> төлөвөөр draft үүсгэнэ. Таны тусдаа баталгаажуулалтгүйгээр ACTIVE болгохгүй.</p></div></div>
                        </div>
                        <AdPreview />
                      </div>
                      {draftReady && <div className="successBanner"><Check size={18} /><div><b>Draft тохиргоо бэлэн боллоо</b><p>Facebook холболт болон Ad Account сонголт хийгдсэний дараа Meta дээр PAUSED зар үүсгэхэд бэлэн.</p></div></div>}
                    </>
                  )}

                  <div className="formFooter">
                    <button className="button textButton" disabled={step === 0} onClick={() => goTo(step - 1)}><ChevronLeft size={18} /> Өмнөх</button>
                    <div className="footerHint">{step + 1} / {steps.length}</div>
                    <button className="button primaryButton" onClick={() => step === steps.length - 1 ? setDraftReady(true) : goTo(step + 1)}>
                      {step === steps.length - 1 ? 'Draft бэлтгэх' : 'Үргэлжлүүлэх'} {step === steps.length - 1 ? <Rocket size={17} /> : <ChevronRight size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <aside className="copilotPanel" id="assistant">
                <div className="copilotHeader">
                  <div className="copilotIcon"><Sparkles size={18} /></div>
                  <div><b>AI Copilot</b><span>Live campaign review</span></div>
                  <div className="liveDot"><i /> LIVE</div>
                </div>
                <div className="scoreCard">
                  <div className="scoreTop"><span>Campaign quality</span><b>{score}<small>/100</small></b></div>
                  <div className="scoreTrack"><i style={{ width: `${score}%` }} /></div>
                  <p>{score >= 95 ? 'Маш сайн тохиргоо. Гол эрсдэл илрээгүй.' : 'Тохиргоо сайн. Нэг creative сайжруулалт байна.'}</p>
                </div>
                <div className="insightCard positive"><span className="insightIcon"><Check size={14} /></span><div><b>Audience тохиромжтой</b><p>23–45 нас, Улаанбаатарын хүрээ зорилготой нийцэж байна.</p></div></div>
                <div className="insightCard"><span className="insightIcon"><Sparkles size={14} /></span><div><b>Creative санал</b><p>{aiApplied ? 'Reels creative зөвлөмж хэрэглэгдсэн.' : '9:16 видео нэмбэл Reels inventory бүрэн ашиглана.'}</p>{!aiApplied && <button onClick={() => setAiApplied(true)}>1 товшилтоор хэрэглэх</button>}</div></div>
                <div className="spendCard"><div><span>Нийт дээд зардал</span><b>{total.toLocaleString()}₮</b></div><CircleDollarSign size={22} /></div>
                <div className="metaStatusCard">
                  <div className="metaStatusRow"><span>Backend API</span><b className={healthError ? 'badState' : 'goodState'}>{healthError ? 'Алдаа' : 'Online'}</b></div>
                  <div className="metaStatusRow"><span>Meta App</span><b className={apiStatus?.configured ? 'goodState' : 'warnState'}>{apiStatus?.configured ? 'Configured' : 'Setup'}</b></div>
                  <div className="metaStatusRow"><span>Facebook</span><b className={session.connected ? 'goodState' : 'warnState'}>{session.connected ? 'Connected' : 'Not connected'}</b></div>
                </div>
              </aside>
            </div>
          </section>

          <section className="bottomGrid" id="settings">
            <div className="bottomCard">
              <div className="bottomIcon"><ShieldCheck size={20} /></div>
              <div><b>Зардлын аюулгүй горим</b><p>Шинээр үүссэн campaign, ad set, ad бүгд PAUSED төлөвөөс эхэлнэ.</p></div>
            </div>
            <div className="bottomCard" id="security">
              <div className="bottomIcon"><Facebook size={20} /></div>
              <div><b>Meta Direct API</b><p>Windsor болон гуравдагч талын data connector ашиглахгүй.</p></div>
            </div>
            <div className="bottomCard">
              <div className="bottomIcon"><Sparkles size={20} /></div>
              <div><b>Монгол AI assistant</b><p>Алдааг Монгол хэлээр тайлбарлаж, сайжруулалтыг шууд санал болгоно.</p></div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

function NavItem({ icon, label, href, active, badge, onClick }: { icon: ReactNode; label: string; href: string; active?: boolean; badge?: string; onClick?: () => void }) {
  return <a className={active ? 'navItem navActive' : 'navItem'} href={href} onClick={onClick}>{icon}<span>{label}</span>{badge && <em>{badge}</em>}</a>
}

function StatCard({ icon, label, value, sub, trend }: { icon: ReactNode; label: string; value: string; sub: string; trend?: 'live' | 'good' }) {
  return <article className="statCard"><div className="statIcon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{trend === 'live' && <i className="miniLive" />}{sub}</small></div></article>
}

function FormHeader({ icon, eyebrow, title, text }: { icon: ReactNode; eyebrow: string; title: string; text: string }) {
  return <div className="formHeader"><div className="formIcon">{icon}</div><div><span>{eyebrow}</span><h3>{title}</h3><p>{text}</p></div></div>
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return <label className="field"><span className="fieldLabel">{label}{required && <em>*</em>}</span>{children}{hint && <small>{hint}</small>}</label>
}

function Toggle({ checked, onChange, title, text, badge }: { checked: boolean; onChange: (value: boolean) => void; title: string; text: string; badge?: string }) {
  return <div className="toggleRow"><div><div className="toggleTitle"><b>{title}</b>{badge && <span>{badge}</span>}</div><p>{text}</p></div><button type="button" role="switch" aria-checked={checked} className={checked ? 'switch switchOn' : 'switch'} onClick={() => onChange(!checked)}><i /></button></div>
}

function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="segmented">{options.map((option) => <button type="button" key={option} className={value === option ? 'segment selectedSegment' : 'segment'} onClick={() => onChange(option)}>{option}</button>)}</div>
}

function Audit({ title, text, ok }: { title: string; text: string; ok?: boolean }) {
  return <div className={ok ? 'auditItem auditOk' : 'auditItem auditWarn'}><span>{ok ? <Check size={14} /> : '!'}</span><div><b>{title}</b><p>{text}</p></div></div>
}

function ReviewRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="reviewRow"><span>{label}</span><b className={strong ? 'reviewStrong' : ''}>{value}</b></div>
}

function AdPreview() {
  return <div className="adPreviewWrap"><span className="previewLabel">FACEBOOK FEED PREVIEW</span><div className="adPreview"><div className="previewHead"><div className="previewAvatar">AB</div><div><b>Auto Boost Mongolia</b><span>Sponsored · 🌐</span></div><MoreHorizontal size={18} /></div><p>AI ашиглан ажлаа хурдасгаж, бизнесийн контентоо илүү хурдан бүтээгээрэй.</p><div className="previewCreative"><div className="creativeGlow" /><Sparkles size={32} /><b>GOOGLE AI PRO</b><span>AI-тай илүү хурдан ажилла</span></div><div className="previewFooter"><div><small>AUTOBOOST.MN</small><b>Google AI Pro</b></div><button>Мессеж илгээх</button></div></div></div>
}
