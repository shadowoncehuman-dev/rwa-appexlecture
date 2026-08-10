import { decryptLink, decryptVault } from "./src/lib/vault";
const U="https://spidyrwa.vercel.app", A="lalit_pro_max_v1_secure_2026";
const r=await fetch(`${U}/api/proxy?endpoint=${encodeURIComponent("get/fetchVideoDetailsById?course_id=582&video_id=308137&ytflag=0&folder_wise_course=0")}`,{headers:{"x-spidy-vault-auth":A}});
const j:any=await r.json(); const d=(decryptVault<any>(j.vaultData)).data;
const mp4=decryptLink(d.file_link);
console.log(mp4);
for (const [name,u] of [["mp4",mp4],["hls",decryptLink(d.download_links[2].path)]] as [string,string][]) {
  const res=await fetch(u,{headers:{"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120"}});
  console.log(name,res.status,res.headers.get("content-type"),res.headers.get("access-control-allow-origin"));
}
