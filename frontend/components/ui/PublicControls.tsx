'use client'

import { Languages, Moon, Sun } from 'lucide-react'
import { useUi } from './UiProvider'

export default function PublicControls(){
 const {locale,theme,toggleLocale,toggleTheme}=useUi()
 return <div style={{display:'flex',gap:7}}>
  <button type="button" onClick={toggleLocale} style={buttonStyle}><Languages size={15}/><span>{locale.toUpperCase()}</span></button>
  <button type="button" onClick={toggleTheme} style={iconStyle}>{theme==='light'?<Moon size={15}/>:<Sun size={15}/>}</button>
 </div>
}
const buttonStyle={height:34,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',borderRadius:9,padding:'0 9px',display:'flex',alignItems:'center',gap:5,fontSize:8,fontWeight:800,cursor:'pointer'} as const
const iconStyle={...buttonStyle,width:34,padding:0,justifyContent:'center'} as const
