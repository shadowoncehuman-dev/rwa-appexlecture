import { decryptLink, decryptVault } from "./src/lib/vault";
const U="https://spidyrwa.vercel.app", A="lalit_pro_max_v1_secure_2026";
const r=await fetch(`${U}/api/proxy?endpoint=${encodeURIComponent("get/fetchVideoDetailsById?course_id=582&video_id=308137&ytflag=0&folder_wise_course=0")}`,{headers:{"x-spidy-vault-auth":A}});
const d=(decryptVault<any>((await r.json() as any).vaultData)).data;
const u=decryptLink(d.download_links[2].path);
const w=`https://player.spidyxuniverserwaa.workers.dev/?key=bruce_wayne_rwa_2024_dark_knight&url=${encodeURIComponent(u)}`;
for (const origin of ["https://id-preview--c2ecae57.lovable.app","https://spidyrwa.vercel.app"]) {
  const res=await fetch(w,{headers:{origin}});
  console.log(origin,res.status,res.headers.get("access-control-allow-origin"));
}
