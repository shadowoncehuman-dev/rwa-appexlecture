import CryptoJS from "crypto-js";
import { decryptLink, decryptVault } from "./src/lib/vault";
const U="https://spidyrwa.vercel.app", A="lalit_pro_max_v1_secure_2026";
async function g(ep:string){const url=ep==="batches"?`${U}/api/batches`:`${U}/api/proxy?endpoint=${encodeURIComponent(ep)}`;const r=await fetch(url,{headers:{"x-spidy-vault-auth":A,accept:"application/json"}});const j:any=await r.json();return decryptVault<any>(j.vaultData)}
const v:any=await g(`get/fetchVideoDetailsById?course_id=582&video_id=308137&ytflag=0&folder_wise_course=0`);
const d=v.data??v;
console.log("file:",decryptLink(d.file_link));
for(const l of d.livestream_links??[])console.log("live",l.quality,decryptLink(l.path));
for(const l of d.encrypted_links??[])console.log("enc",l.quality,decryptLink(l.path,l.key),"KEY:",l.key);
for(const l of d.download_links??[])console.log("dl",l.quality,decryptLink(l.path));
console.log("keys:",Object.keys(d));
console.log("pdf:",decryptLink(d.pdf_link));
