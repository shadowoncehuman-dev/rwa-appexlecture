import CryptoJS from "crypto-js";
const U="https://spidyrwa.vercel.app", A="lalit_pro_max_v1_secure_2026";
const K="SpidyBillionaireVault2026@Secure", IV="SpidyLalit123456";
function dv(p:string){const t=CryptoJS.AES.decrypt(p,CryptoJS.enc.Utf8.parse(K),{iv:CryptoJS.enc.Utf8.parse(IV),mode:CryptoJS.mode.CBC,padding:CryptoJS.pad.Pkcs7}).toString(CryptoJS.enc.Utf8);return JSON.parse(t)}
async function g(ep:string){const url=ep==="batches"?`${U}/api/batches`:`${U}/api/proxy?endpoint=${encodeURIComponent(ep)}`;const r=await fetch(url,{headers:{"x-spidy-vault-auth":A,accept:"application/json"}});const j:any=await r.json();return dv(j.vaultData)}
const b:any=await g("batches");const arr=Array.isArray(b)?b:b.data;const c=arr[0];console.log("batch",c.batch_id,c.batch_name);
const s:any=await g(`get/allsubjectfrmlivecourseclass?courseid=${c.batch_id}&start=-1`);const sa=(s.data??s);console.log("subj",JSON.stringify(sa[0]));
const t:any=await g(`get/alltopicfrmlivecourseclass?courseid=${c.batch_id}&subjectid=${sa[0].subjectid}`);const ta=(t.data??t);console.log("top",JSON.stringify(ta[0]));
const l:any=await g(`get/livecourseclassbycoursesubtopconceptapiv3?topicid=${ta[0].topicid}&start=-1&conceptid=1&courseid=${c.batch_id}&subjectid=${sa[0].subjectid}`);const la=(l.data??l);console.log("lec",JSON.stringify(la[0]).slice(0,600));
const v:any=await g(`get/fetchVideoDetailsById?course_id=${c.batch_id}&video_id=${la[0].id}&ytflag=0&folder_wise_course=0`);
console.log("VID",JSON.stringify(v).slice(0,3000));
