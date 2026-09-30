'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type UiLocale='mn'|'en'
export type UiTheme='light'|'dark'
type UiContextValue={locale:UiLocale;theme:UiTheme;setLocale:(v:UiLocale)=>void;setTheme:(v:UiTheme)=>void;toggleLocale:()=>void;toggleTheme:()=>void;text:(mn:string,en:string)=>string}
const UiContext=createContext<UiContextValue|null>(null)
const STORAGE_KEY='boost_ui_settings_v2'

const legacyMnEn:Record<string,string>={
 'Нүүр':'Overview','Шинэ сурталчилгаа':'Create campaign','Кампанит ажил':'Campaign','Кампанит ажлууд':'Campaigns','Үр дүн':'Analytics','Аналитик':'Analytics','Холболтууд':'Connections','Төлбөр':'Billing','Гүйлгээ':'Transactions','Тохиргоо':'Settings','Нууцлал':'Privacy','Мэдээлэл устгах':'Data deletion','Нөхцөл':'Terms',
 'Бүгд':'All','Идэвхтэй':'Active','Зогсоосон':'Paused','Архив':'Archived','Шинэчлэх':'Refresh','Хайх':'Search','Хадгалах':'Save','Нээх':'Open','Дахин оролдох':'Try again','Хүлээгдэж байна':'Pending','Амжилттай':'Succeeded','Амжилтгүй':'Failed','Цуцлагдсан':'Canceled',
 'Зарцуулалт':'Spend','Хүрэлт':'Reach','Клик':'Clicks','Худалдан авалт':'Purchases','Үүссэн':'Created','Үйлдэл':'Action','Зорилго':'Objective','Төсөв':'Budget','Төлөв':'Status','Огноо':'Date','Бизнес':'Business','Профайл':'Profile','Мэдэгдэл':'Notifications','Админ':'Admin',
 'Facebook холбох':'Connect Facebook','Facebook холболт':'Facebook connection','Холбогдсон':'Connected','Холбоогүй':'Not connected','Холбох шаардлагатай':'Connection required','Шаардлагатай':'Required','Бэлэн':'Ready','Шалгах шаардлагатай':'Needs review','Дахин шалгах':'Check again','Холболтыг салгах':'Disconnect',
 'И-мэйл':'Email','Нэр':'Name','Нууц үг':'Password','Нэвтрэх':'Sign in','Бүртгүүлэх':'Sign up','Гарах':'Sign out','Нууц үгээ мартсан уу?':'Forgot password?','Хэл':'Language','Харагдац':'Appearance',
 'Үйлчилгээний шимтгэл':'Service fee','Нийт':'Total','Нийт төлбөр':'Total payable','Рекламын төсөв':'Ad budget','Төлбөрийн бүтэц':'Billing structure','Сүүлийн төлбөрүүд':'Recent payments','Бүх гүйлгээ':'All transactions',
 'Мэдээлэл ачаалж чадсангүй.':'Could not load data.','Одоогоор мэдээлэл алга.':'No data yet.','Одоогоор төлбөрийн түүх алга.':'No payment history yet.','Сонгосон шүүлтүүрт кампанит ажил алга.':'No campaigns match this filter.'
}
const legacyEnMn=Object.fromEntries(Object.entries(legacyMnEn).map(([mn,en])=>[en,mn]))

export default function UiProvider({children}:{children:ReactNode}){
 const [locale,setLocaleState]=useState<UiLocale>('mn')
 const [theme,setThemeState]=useState<UiTheme>('light')

 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');setLocaleState(saved.locale==='en'?'en':'mn');const prefersDark=window.matchMedia?.('(prefers-color-scheme: dark)').matches;setThemeState(saved.theme==='dark'||saved.theme==='light'?saved.theme:prefersDark?'dark':'light')}catch{}},[])

 useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.locale=locale;document.documentElement.lang=locale;document.documentElement.style.colorScheme=theme;localStorage.setItem(STORAGE_KEY,JSON.stringify({locale,theme}))},[locale,theme])

 useEffect(()=>{
  const dict=locale==='en'?legacyMnEn:legacyEnMn
  const translateValue=(value:string|null)=>{if(!value)return value;const trimmed=value.trim();const next=dict[trimmed];return next?value.replace(trimmed,next):value}
  const translateNode=(root:Node)=>{
   if(root.nodeType===Node.TEXT_NODE){const next=translateValue(root.nodeValue);if(next&&next!==root.nodeValue)root.nodeValue=next;return}
   if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT)
   let node:Node|null
   while((node=walker.nextNode())){const next=translateValue(node.nodeValue);if(next&&next!==node.nodeValue)node.nodeValue=next}
   if(root instanceof HTMLElement){for(const attr of ['placeholder','title','aria-label']){const value=root.getAttribute(attr);const next=translateValue(value);if(next&&next!==value)root.setAttribute(attr,next)}}
   if(root instanceof Element){root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el=>{for(const attr of ['placeholder','title','aria-label']){const value=el.getAttribute(attr);const next=translateValue(value);if(next&&next!==value)el.setAttribute(attr,next)}})}
  }
  translateNode(document.body)
  const observer=new MutationObserver(mutations=>{observer.disconnect();for(const mutation of mutations){if(mutation.type==='characterData')translateNode(mutation.target);mutation.addedNodes.forEach(translateNode)}observer.observe(document.body,{subtree:true,childList:true,characterData:true})})
  observer.observe(document.body,{subtree:true,childList:true,characterData:true})
  return()=>observer.disconnect()
 },[locale])

 const setLocale=useCallback((v:UiLocale)=>setLocaleState(v),[])
 const setTheme=useCallback((v:UiTheme)=>setThemeState(v),[])
 const toggleLocale=useCallback(()=>setLocaleState(v=>v==='mn'?'en':'mn'),[])
 const toggleTheme=useCallback(()=>setThemeState(v=>v==='light'?'dark':'light'),[])
 const text=useCallback((mn:string,en:string)=>locale==='mn'?mn:en,[locale])
 const value=useMemo(()=>({locale,theme,setLocale,setTheme,toggleLocale,toggleTheme,text}),[locale,theme,setLocale,setTheme,toggleLocale,toggleTheme,text])
 return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}
export function useUi(){const value=useContext(UiContext);if(!value)throw new Error('useUi must be used inside UiProvider');return value}
