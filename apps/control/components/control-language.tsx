'use client';
import {createContext,useContext,useState,type ReactNode} from 'react';
import dictionary from '@/content/control-de.json';
type Language='en'|'de';
const Context=createContext<{language:Language;change:(language:Language)=>void}>({language:'en',change:()=>{}});
export function ControlLanguage({initial,children}:{initial:Language;children:ReactNode}) {
 const [language,setLanguage]=useState(initial);
 function change(value:Language){setLanguage(value);document.documentElement.lang=value;document.cookie=`control_locale=${value}; Path=/; Max-Age=31536000; SameSite=Strict${location.protocol==='https:'?'; Secure':''}`;}
 return <Context.Provider value={{language,change}}>{children}</Context.Provider>;
}
export function useControlTranslation(){const {language}=useContext(Context);return (value:string)=>translate(language,value);}
function translate(language:Language,value:string){const key=value.trim();if(language==='en')return value;const translated=(dictionary as Record<string,string>)[key];return translated?value.replace(key,translated):value;}
export function ControlText({value}:{value:string}){return useControlTranslation()(value);}
export function ControlLanguagePicker(){const {language,change}=useContext(Context);return <label className="control-language"><ControlText value="Interface language"/><select value={language} onChange={e=>change(e.target.value as Language)}><option value="en">English</option><option value="de">Deutsch</option></select></label>;}
