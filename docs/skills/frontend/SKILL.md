---
name: sepaveh-frontend
description: Maintain Sepaveh Sanat public pages, bilingual UI, and Persian admin panels.
---

# Frontend handoff

- React and Vite live in `frontend/`. Start with the router in `src/app/router.jsx`, public pages in `src/panels/Public.jsx`, and shared styles in `src/styles.css`.
- In `src/pages/public/`, edit `HomePage.jsx` for the homepage, `CollectionPage.jsx` for catalog lists and filters, and `ContentPage.jsx` for product details, contact, quote, and other CMS pages. `HeroSlider.jsx` and `StoneDryingBenefits.jsx` own their respective sections. Common navigation and page selection stay in `Public.jsx`.
- Persian is the default and uses RTL plus IRANYekan. English uses `/en` and LTR. Keep route names and the language switch stable.
- Use the Axios client and React Query hook in `src/app/api.js`. Preserve query keys used by invalidation and keep auth tokens in HttpOnly cookies.
- Keep content editable through the CMS. Use bounded image ratios, thumbnails for lists, lazy decoding below the fold, and reduced-motion styles. Reserve eager loading for important above-the-fold media.
- Quote fields and channel options are in `src/features/Inquiry.jsx` and `src/features/quoteChannels.js`. Coordinate API contract changes with the backend.
- Check narrow and wide screens, both languages, keyboard navigation, and existing admin flows. Run `npm run lint`, `npm run format:check`, `npm test`, and `npm run build` from the root.
