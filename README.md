# Cantu

Cantu egy zene-központú nyelvtanuló alkalmazás magyar anyanyelvű olasztanulóknak.

## Fejlesztés

```bash
npm install
npm run dev
```

Az alkalmazás fő útvonalai:

- `/` — marketingoldal;
- `/app` — teljesen helyi, mock dalfelismerési folyamat.

## Ellenőrzés

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

A Milestone 0 nem kér mikrofonengedélyt, nem tölt fel fájlt, és nem kapcsolódik külső felismerési vagy AI-szolgáltatáshoz.
