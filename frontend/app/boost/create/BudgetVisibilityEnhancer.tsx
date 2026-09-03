'use client'

import { useEffect } from 'react'

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
      if(!card.querySelector('[data-budget-guide]')){
        const guide=document.createElement('div')
        guide.dataset.budgetGuide='1'
        guide.className='boostBudgetGuide'
        guide.innerHTML='<b>Төсвөө энд тохируулна</b><p>Өдөрт эсвэл нийт хугацаанд хэдэн төгрөг зарцуулах, төсвийг Кампайны эсвэл Ad Set түвшинд удирдах, мөн Meta дуудлага худалдааны стратегийг энд сонгоно.</p>'
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
