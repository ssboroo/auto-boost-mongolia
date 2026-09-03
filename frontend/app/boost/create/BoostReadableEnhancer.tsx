'use client'

import { useEffect } from 'react'

const replacements: Array<[string,string]> = [
  ['1. Campaign & Conversion','1. Кампанит ажил ба үр дүнгийн тохиргоо'],
  ['2. Identity & Creative Builder','2. Зар харагдах хуудас ба зарын контент'],
  ['3. Audience','3. Зарыг харах хүмүүс / Аудитори'],
  ['4. Budget & Bid','4. Төсөв ба үнийн санал'],
  ['Campaign & Conversion','Кампанит ажил ба үр дүнгийн тохиргоо'],
  ['Identity & Creative Builder','Зар харагдах хуудас ба зарын контент'],
  ['Special Ad Category','Тусгай зарын ангилал'],
  ['Conversion location','Үр дүн бүртгэх байршил'],
  ['Pixel / Dataset','Meta Pixel / Dataset (вэбсайтын үр дүн хэмжигч)'],
  ['Conversion event','Үр дүн гэж тооцох үйлдэл'],
  ['Instant Lead Form','Харилцагчийн мэдээлэл авах маягт'],
  ['Facebook Page','Facebook хуудас'],
  ['Ad Account','Зарын данс (Ad Account)'],
  ['Existing Post','Одоо байгаа Facebook пост'],
  ['Шинэ Creative','Шинэ зарын контент'],
  ['Creative Builder','Зарын контент бэлтгэх'],
  ['Image/Link','Зураг / холбоос'],
  ['Primary text','Зарын үндсэн текст'],
  ['Headline','Зарын гарчиг'],
  ['Description','Нэмэлт тайлбар'],
  ['Destination URL','Хэрэглэгч очих веб хаяг'],
  ['Image URL','Зургийн веб хаяг (URL)'],
  ['Meta Image Hash','Meta-д байршуулсан зургийн код (Image Hash)'],
  ['Meta Video ID','Meta-д байршуулсан видеоны ID'],
  ['Thumbnail URL','Видео нүүр зургийн веб хаяг'],
  ['CTA','Үйлдэлд урих товч (CTA)'],
  ['URL tags / UTM','Хэмжилтийн тэмдэглэгээ (UTM)'],
  ['Audience','Аудитори / Зарыг харах хүмүүс'],
  ['Countries','Улс'],
  ['Country','Улс'],
  ['Age','Нас'],
  ['Gender','Хүйс'],
  ['Placement','Зар харагдах байрлал'],
  ['Device','Төхөөрөмж'],
  ['Detailed interests','Сонирхлын нарийвчилсан сонголт'],
  ['Interest','Сонирхол'],
  ['Custom Audience','Өмнө бүрдүүлсэн тусгай аудитори'],
  ['Excluded Custom Audience','Зар харуулахгүй аудитори'],
  ['Budget level','Төсөв удирдах түвшин'],
  ['Budget type','Төсвийн төрөл'],
  ['Daily Budget','Өдрийн төсөв'],
  ['Lifetime Budget','Нийт хугацааны төсөв'],
  ['Bid strategy','Зарын дуудлага худалдааны стратеги'],
  ['Bid amount','Үнийн саналын дээд хэмжээ'],
  ['Optimization goal','Meta юунд оновчлох вэ'],
  ['Schedule','Зар ажиллах хугацаа'],
  ['Start','Эхлэх хугацаа'],
  ['End','Дуусах хугацаа'],
  ['Review','Эцсийн шалгалт'],
  ['Activate','Идэвхжүүлэх'],
  ['PAUSED','ТҮР ЗОГССОН'],
  ['ACTIVE','ИДЭВХТЭЙ'],
  ['Website','Вэбсайт'],
  ['Instant Form','Facebook доторх шууд маягт'],
  ['None','Байхгүй'],
  ['Automatic','Автомат'],
  ['All devices','Бүх төхөөрөмж'],
  ['Mobile','Гар утас'],
  ['Desktop','Компьютер'],
  ['Facebook + Instagram','Facebook + Instagram'],
  ['Learn More','Дэлгэрэнгүй'],
  ['Shop Now','Худалдан авах'],
]

const helpRules: Array<[string,string]> = [
  ['Тусгай зарын ангилал','Орон сууц, ажил эрхлэлт, зээл/санхүү, улс төрийн шинжтэй зар бол тохирох ангиллыг заавал сонгоно. Энгийн бараа үйлчилгээ бол “Байхгүй” сонгоно.'],
  ['Үр дүн бүртгэх байршил','Хэрэглэгчийн үйлдлийг хаана бүртгэхээ сонгоно. Вэбсайт руу оруулах бол “Вэбсайт”, Facebook дотор мэдээлэл авах бол “Facebook доторх шууд маягт” сонгоно.'],
  ['Meta Pixel / Dataset','Вэбсайт дээр худалдан авалт, бүртгэл, сагсанд нэмэх зэрэг үйлдлийг Meta-д хэмжих холболт. Sales эсвэл Website Leads үед шаардлагатай.'],
  ['Үр дүн гэж тооцох үйлдэл','Meta ямар үйлдлийг гол үр дүн гэж үзэж зарыг оновчлохыг сонгоно. Жишээ: PURCHASE = худалдан авалт, LEAD = хүсэлт/холбоо барих мэдээлэл.'],
  ['Харилцагчийн мэдээлэл авах маягт','Facebook/Instagram-аас гаралгүй нэр, утас, имэйл зэрэг мэдээлэл авах Meta Instant Form-оо сонгоно.'],
  ['Зарын данс (Ad Account)','Meta зарыг аль зарын данснаас ажиллуулахыг сонгоно. Төлбөрийн карт болон зарын валют энэ данстай холбоотой.'],
  ['Facebook хуудас','Зар аль Facebook хуудасны нэрээр хэрэглэгчдэд харагдахыг сонгоно.'],
  ['Зарын үндсэн текст','Зургийн дээр харагдах гол тайлбар. Хэрэглэгчид санал болгож буй зүйлээ богино, ойлгомжтой бичнэ.'],
  ['Зарын гарчиг','Зураг/видеоны доор тод харагдах богино гарчиг. Гол ашиг тус эсвэл санал болголтоо бичнэ.'],
  ['Хэрэглэгч очих веб хаяг','Зар дээр дарсан хэрэглэгч очих бүтээгдэхүүн, үйлчилгээ, захиалгын хуудсын HTTPS холбоос.'],
  ['Үйлдэлд урих товч','“Дэлгэрэнгүй”, “Худалдан авах”, “Бүртгүүлэх” зэрэг хэрэглэгчийн дараагийн үйлдлийг заах товч.'],
  ['Хэмжилтийн тэмдэглэгээ','Google Analytics зэрэг системд зарын урсгалыг ялгаж хэмжих UTM параметр. Мэдэхгүй бол хоосон орхиж болно.'],
  ['Сонирхлын нарийвчилсан сонголт','Meta-аас сонирхол хайж сонгоно. Хэт олон сонирхол нэмж аудиторио шаардлагагүйгээр нарийсгахгүй байхыг зөвлөж байна.'],
  ['Өмнө бүрдүүлсэн тусгай аудитори','Өмнөх хэрэглэгч, website visitor, customer list гэх мэт Meta дээр үүсгэсэн Custom Audience-аа сонгоно.'],
  ['Зар харуулахгүй аудитори','Жишээ нь аль хэдийн худалдан авсан хүмүүсийг шинэ хэрэглэгчийн зараас хасахад ашиглана.'],
  ['Зар харагдах байрлал','“Автомат / Advantage+” нь Meta-д Facebook, Instagram зэрэг тохиромжтой байрлалыг өөрөө сонгох боломж өгнө.'],
  ['Төсөв удирдах түвшин','Кампайны түвшин сонговол Meta төсвийг ad set-үүдэд хуваарилна. Ad Set түвшин сонговол тус бүрийн төсвийг та тогтооно.'],
  ['Төсвийн төрөл','Өдрийн төсөв = өдөр бүр ойролцоогоор зарцуулах хэмжээ. Нийт хугацааны төсөв = кампанит ажлын бүх хугацаанд зарцуулах дээд нийт хэмжээ.'],
  ['Зарын дуудлага худалдааны стратеги','Ихэнх тохиолдолд “Хамгийн их үр дүн / Lowest cost” тохиромжтой. Bid Cap, Cost Cap зэрэг нь туршлагатай хэрэглэгчдэд зориулагдсан.'],
  ['Үнийн саналын дээд хэмжээ','Bid Cap эсвэл Cost Cap ашиглаж байгаа үед Meta auction-д баримтлах мөнгөн хязгаар. Мэдэхгүй бол автомат стратеги ашиглана.'],
  ['Meta юунд оновчлох вэ','Meta алгоритм ямар төрлийн үр дүнг ихэсгэхийг зорихыг заана. Сонгосон campaign objective-тэй нийцсэн автомат утгыг ашиглах нь хамгийн энгийн.'],
]

function normalizeText(value:string){
  let out=value
  for(const [from,to] of replacements){ if(out.trim()===from) return out.replace(from,to) }
  return out
}

function enhance(root:HTMLElement){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT)
  const nodes:Text[]=[]
  while(walker.nextNode()) nodes.push(walker.currentNode as Text)
  nodes.forEach(node=>{ const current=node.nodeValue||''; const next=normalizeText(current); if(next!==current) node.nodeValue=next })

  root.querySelectorAll('input,textarea,select').forEach(el=>{
    const input=el as HTMLInputElement
    if(input.placeholder==='https://...') input.placeholder='https://tanai-site.mn/product'
    if(input.placeholder?.toLowerCase().includes('search')) input.placeholder='Жишээ: кофе, автомашин, фитнес...'
  })

  root.querySelectorAll('label').forEach(label=>{
    const title=(label.querySelector(':scope > span')?.textContent||'').trim()
    if(!title || label.querySelector('[data-boost-help]')) return
    const match=helpRules.find(([key])=>title.includes(key))
    if(match){ const p=document.createElement('p');p.dataset.boostHelp='1';p.className='boostFieldHelp';p.textContent=match[1];label.appendChild(p) }
  })
}

export default function BoostReadableEnhancer(){
  useEffect(()=>{
    const root=document.querySelector<HTMLElement>('[data-boost-readable]')
    if(!root)return
    enhance(root)
    const observer=new MutationObserver(()=>enhance(root))
    observer.observe(root,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])
  return null
}
