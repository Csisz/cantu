# Szolgáltatói / adatfeldolgozói leltár

| Szolgáltató | Szerep | Küldött adatkör | Indulás előtti kapu |
|---|---|---|---|
| OpenAI | STT, elemzés, Practice Lab | rövid audio vagy ellenőrzött/gyakorló szöveg | aktuális retention, training defaults, DPA, subprocessors, régió, audio és `store:false` hatás szerződéses ellenőrzése |
| Supabase | Auth és PostgreSQL | fiók és privát származtatott tanulási adat | DPA, projekt régió, backup/PITR, Auth retention, SMTP és logok ellenőrzése |
| Vercel | tervezett hosting | HTTP és szerver-működési metaadat | DPA/subprocessors, request/function log retention, régió és Security beállítások |
| Higgsfield | kizárólag fejlesztési/build-time média | generálási promptok és fejlesztői assetek; **nincs tanulói runtime adat** | fejlesztői fiók/kulcskezelés; runtime-ból kizárva |
| Stripe | hosztolt Checkout, Customer Portal és előfizetési életciklus | fizetési/előfizetési adatok; a Cantu csak minimális customer/subscription referenciát és állapotot tükröz | DPA/subprocessors, régió, retention, adó/VAT, számlázás, refund és fogyasztóvédelmi folyamat jogi/pénzügyi ellenőrzése |

Nem állítjuk, hogy a szolgáltatók egyedi Cantu-konfigurációja szerződésesen jóváhagyott. REQUIRES LEGAL/PROCUREMENT REVIEW.
