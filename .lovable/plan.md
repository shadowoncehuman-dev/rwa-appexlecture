# RWA — New UI on the Same Backend

Naya app banega jo aapke purane site ka **wahi backend** use karega (koi database ya nayi API nahi). Sirf UI, layout aur branding puri tarah nayi hogi.

## Branding

- Naam: **RWA** (bada, hero + header dono me)
- Uske neeche chhota text: **Powered by ApexLecture**
- Purani branding (Spidy Universe / Lalit Dev / Rozgar With Ankit tagline) kahin nahi rahegi
- Look: Cloud White palette (#fafbfc bg, #e8ecf1 surfaces, #94a3b8 muted, #3b82f6 accent), fonts Outfit (headings) + Figtree (body), Hero + card-grid layout

## Pages (purane site ke saare path same)

| Path | Content |
|---|---|
| `/` | Hero + search + batch/course card grid |
| `/course/$courseId` | Subjects, topics, live/upcoming classes, lecture player, notes/DPP |
| `/test-series` | Test series listing |
| `/saved` | Saved batches (localStorage) |
| `/developer` | Developer/profile page |

Lectures play honge — purane site jaisa hi video source, sirf player UI naya.

## Backend integration (technical)

Purana site Next.js API routes use karta hai jo Vercel par live hain:

- `https://spidyrwa.vercel.app/api/batches`
- `https://spidyrwa.vercel.app/api/proxy?endpoint=<encoded appx endpoint>` with header `x-spidy-vault-auth: lalit_pro_max_v1_secure_2026`
- Known endpoints: `mycoursev2`, `get/allsubjectfrmlivecourseclass?courseid=..&start=-1`, `get/live_upcoming_course_classv2?courseid=..&start=-1`, `get/test_seriesbycourseid?courseid=..&userid=..&start=-1`, plus topic/class endpoints jo course page se discover honge.
- Response encrypted aata hai (`{"vaultData": "..."}`) — AES-256-CBC, key `SpidyBillionaireVault2026@Secure`, IV `SpidyLalit123456`, Pkcs7, base64. Decrypt karke JSON milta hai.

Implementation:

1. `src/lib/vault.ts` — AES decrypt helper (crypto-js install karenge) + typed parse.
2. `src/routes/api/proxy.$.ts` (server route) — browser se cross-origin call CORS par fail ho sakti hai, isliye humara server upstream ko call karega aur response as-is forward karega. Upstream base URL ek constant me rahega taki baad me badal saken.
3. `src/lib/api.ts` — `getBatches()`, `getCourseSubjects(id)`, `getLiveClasses(id)`, `getTestSeries(id)`, `getTopicClasses(...)` — sab TanStack Query se, loaders me `ensureQueryData`.
4. Player: HLS/mp4/YouTube jo bhi upstream deta hai wahi handle karenge (hls.js client-side, `ClientOnly` ke andar), naye controls + lecture sidebar ke saath.
5. Saved batches aur watch stats localStorage me (purane site jaisa), naye keys ke saath.

## Components

`RwaLogo`, `AppHeader` (RWA + Powered by ApexLecture), `MobileNav`, `Hero`, `SearchBar`, `BatchCard`, `BatchGrid` + skeletons, `SubjectList`, `LectureList`, `VideoPlayer`, `EmptyState`, `Footer`.

## Design system

`src/styles.css` me tokens update — light Cloud White base, blue accent, soft shadows, rounded-xl cards; Outfit/Figtree `<link>` root route me. Koi hardcoded color class nahi.

## Notes / risks

- Agar upstream `/api/proxy` किसी host restriction ya rate limit se block kare, to same endpoints ko humare server route se direct upstream (appx) par point karna padega — us case me main aapko batakar adjust kar dunga.
- Encryption key public JS se aayi hai; agar aap chaho to baad me apna backend bana ke isse replace kar sakte hain.
