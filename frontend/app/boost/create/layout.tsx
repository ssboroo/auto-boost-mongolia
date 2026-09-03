import type { ReactNode } from 'react'
import BoostReadableEnhancer from './BoostReadableEnhancer'
import './boost-readable.css'

export default function BoostCreateLayout({children}:{children:ReactNode}){
  return <div className="boostReadableScope" data-boost-readable>
    <BoostReadableEnhancer/>
    <div className="boostIntroCard">
      <div>
        <span>RAINY · META ADS</span>
        <h2>Boost үүсгэх</h2>
        <p>Доорх тохиргоонуудыг дээрээс нь доош дарааллаар бөглөнө. Техникийн Meta нэршил бүрийн доор Монгол тайлбар гарна. Эргэлзэж байвал автомат/санал болгосон утгыг сонгоход хамгийн аюулгүй.</p>
      </div>
      <div className="boostIntroSteps">
        <b>1</b><span>Зорилго</span><i>→</i><b>2</b><span>Зарын контент</span><i>→</i><b>3</b><span>Аудитори</span><i>→</i><b>4</b><span>Төсөв</span><i>→</i><b>5</b><span>Шалгах</span>
      </div>
    </div>
    {children}
  </div>
}
