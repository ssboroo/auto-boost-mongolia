'use client'

import { useEffect } from 'react'

const labelMap:Record<string,string>={
  'Budget level':'Төсөв удирдах түвшин',
  'Budget type':'Төсвийн төрөл',
  'Bid strategy':'Дуудлага худалдааны стратеги',
  'Bid/Cost amount':'Үнийн санал / Зардлын хязгаар',
  'Optimization goal':'Meta юунд оновчлох вэ',
  'Schedule days':'Зар ажиллах хоног',
}

const optionMap:Record<string,string>={
  'Ad Set Budget':'Ad Set бүрийн төсөв',
  'Advantage Campaign Budget':'Кампайны нийт төсөв (Advantage+)',
  'Daily':'Өдрийн төсөв',
  'Lifetime':'Нийт хугацааны төсөв',
  'Highest volume / Lowest cost':'Хамгийн их үр дүн / Хамгийн бага өртөг',
  'Bid cap':'Үнийн саналын дээд хязгаар',
  'Cost cap':'Нэг үр дүнгийн зардлын хязгаар',
  'Minimum ROAS':'ROAS-ийн доод хязгаар',
}

export default function BudgetVisibilityEnhancer(){
  useEffect(()=>{
    const root=document.querySelector<HTMLElement>('[data-boost-readable]')
    if(!root)return

    const markBudget=()=>{
      const headings=Array.from(root.querySelectorAll<HTMLElement>('h2,h3'))
      const heading=headings.find(el=>{
        const t=(el.textContent||'').toLowerCase()
        return t.includes('budget')||t.includes('төсөв')
      })
      if(!heading)return false
      const card=heading.closest<HTMLElement>('section')||heading.parentElement
      if(!card)return false
      card.id='boost-budget-section'
      card.classList.add('boostBudgetCard')
      heading.textContent='4. Төсөв ба зарцуулалтын тохиргоо'

      card.querySelectorAll<HTMLSpanElement>('label > span').forEach(span=>{
        const text=(span.textContent||'').trim()
        if(text.startsWith('Budget (')) span.textContent=text.replace('Budget','Төсөв')
        else if(labelMap[text]) span.textContent=labelMap[text]
      })
      card.querySelectorAll<HTMLOptionElement>('option').forEach(option=>{
        const text=(option.textContent||'').trim()
        if(optionMap[text]) option.textContent=optionMap[text]
        if(text.startsWith('Auto (')) option.textContent=text.replace('Auto','Автомат')
      })

      if(!card.querySelector('[data-budget-guide]')){
        const guide=document.createElement('div')
        guide.dataset.budgetGuide='1'
        guide.className='boostBudgetGuide'
        guide.innerHTML='<b>Төсвөө энд тохируулна</b><p><strong>Өдрийн төсөв</strong> сонговол өдөр бүр зарцуулах хэмжээг, <strong>Нийт хугацааны төсөв</strong> сонговол кампанит ажлын бүх хугацааны дээд хэмжээг оруулна. Ихэнх хэрэглэгчид “Ad Set бүрийн төсөв + Өдрийн төсөв + Хамгийн их үр дүн” тохиргооноос эхлэхэд тохиромжтой.</p>'
        heading.insertAdjacentElement('afterend',guide)
      }
      return true
    }

    markBudget()
    const observer=new MutationObserver(()=>markBudget())
    observer.observe(root,{childList:true,subtree:true,characterData:true})
    return()=>observer.disconnect()
  },[])
  return null
}
