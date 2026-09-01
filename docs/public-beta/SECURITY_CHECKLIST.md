# Public beta technikai biztonsági ellenőrzőlista

- [ ] Production secret store: OpenAI, Supabase admin és Practice HMAC külön, rotálva.
- [ ] RLS/pgTAP és service-role-only RPC-k ellenőrizve.
- [ ] Auth Site URL, redirect allowlist, e-mail confirm, MFA/admin hozzáférés, jelszó- és rate policy beállítva.
- [ ] Paid endpoint auth, same-origin guard, body/audio/text limit, timeout és normalizált hiba aktív.
- [ ] PostgreSQL atomikus usage guard több instance mellett tesztelve.
- [ ] Logokban nincs source/transcript/audio/learner response/prompt/token/titok.
- [ ] Fióktörlés és export disposable felhasználóval tesztelve.
- [ ] Security headerek, dependency audit és production mock tiltás ellenőrizve.
- [ ] Practice token külön >=32 karakteres production secretet használ; aláírás, expiry és replay guard aktív.
- [ ] Higgsfield csak build-time; a runtime TypeScript nem hívja.
- [ ] A korábban tracked `COMMANDS.txt`-ben szerepelt Higgsfield hitelesítőadatok visszavonva/rotálva; szükség esetén a Git-történet külön, jóváhagyott eljárással tisztítva.
