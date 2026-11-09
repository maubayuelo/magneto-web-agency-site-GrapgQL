# Report — FR-CA / ES UI dictionary fill (Q-D1)

- Spec: none. This is the Q-D1 item (`docs/specs/phase-5b-services-packages-seo.md` §Q-D1, `docs/specs/phase-5c-loader.md`
  l.563). Rules: ADR 0005; register and kept terms from the glossary draft v1 (`docs/specs/phase-5g-i18n-llm-qa.md` §3.3).
- Branch: `feat/i18n-dictionary-fill` (from `master` @ `abfbb65`)
- Author: Dev · Date: 2026-11-09
- Approval: Mauricio approved every row on 2026-11-09, after two review rounds (rev 1 → rev 2 → final edits).

## Result
**Done.** All 58 FR and 57 ES TODO values and the 3 kept-terms fixes are written. `findTodoKeys` returns 0 / 0, and
the full gate is green: lint at 88 / 94, typecheck, 578 / 578 tests, and `agent:build` with no override. The two test
files were updated with Mauricio's approval (2026-11-09). The `popularChoise` query is deferred by decision (F-5).

## Changes
- `src/i18n/dictionaries/fr.ts`: 58 TODO values filled, K1 (`meta.about.description`) rewritten, header comment updated.
  Two short comments explain why `downloadBody` and K1 differ from a translation or the export.
- `src/i18n/dictionaries/es.ts`: 57 TODO values filled, K2 and K3 rewritten, header comment updated, same kind of
  comments.
- `src/i18n/dictionary.test.ts` (approved 2026-11-09):
  - The readiness guard now expects 0 TODO keys in EN/FR/ES, and `assertLocalesReady(['en','fr','es'])` must not
    throw.
  - The marker-blocking checks run on fixtures:
    - the real FR/ES dictionaries with only `packages.errorTitle` or `packages.errorBody` marked (5d-lite AC-14);
    - a `withMarkers` fixture with 2 marked keys, used for the count and naming message and the `allowUntranslated`
      override.
  - The "old emailModal booking keys stay gone" check is kept.
- `src/utils/page-metadata.test.ts` (approved 2026-11-09):
  - `DESCRIPTION_EXCEPTIONS` is a narrow, explicit exception for exactly `fr:about`, `es:about` and `es:contact`,
    carrying the K1–K3 strings and the comment "Notion updated 2026-11-09 to match; remove this exception when the
    5c-rest export re-pins the copy".
  - A guard test asserts that the map holds exactly those 3 keys, that each value contains "Magneto Web Consulting",
    and that each still differs from the export. Once a re-export carries the new copy, that test fails and points to
    the exception to remove.
  - Titles and every other description still come from the export.
- `docs/reports/i18n-dictionary-fill.md`: this report.

## How to read the table

- **Exports:** `docs/content/magneto-copy-fr-CA.md` and `magneto-copy-es.md`, identical to `637fba7`. `FR 17` means
  line 17 of the FR export.
- **Origin of each value:**
  - **EXPORT**: copied verbatim from the export.
  - **EXPORT (near)**: an export string copied verbatim where the EN wording differs slightly.
  - **DEV**: drafted by the Dev.
  - **M**: value set or edited by Mauricio in review.

  **Every row is approved (M, 2026-11-09).**
- **Register:** FR uses *vous*, ES uses *tú*. FR follows the export's Québec typography: no space before `?`, a space
  before `:`, and `« »` with inner spaces.

| | EXPORT | EXPORT (near) | DEV | M | Total |
|---|---|---|---|---|---|
| FR | 4 | 2 | 46 | 6 | 58 |
| ES | 4 | 1 | 46 | 6 | 57 |
| Kept-terms (K1–K3) | — | — | 1 (K3) | 2 (K1, K2) | 3 |

## A. TODO keys (final, as written)

| # | Key | EN | FR | FR origin | ES | ES origin |
|---|---|---|---|---|---|---|
| 1 | `common.goHome` | Go Home | Retour à l'accueil | DEV | Volver al inicio | DEV |
| 2 | `common.checkIconAlt` | Check icon | Icône de crochet | DEV (F-2) | Ícono de verificación | DEV (F-2) |
| 3 | `common.loading` | Loading... | Chargement... | DEV | Cargando... | DEV |
| 4 | `common.close` | Close | Fermer | DEV | Cerrar | DEV |
| 5 | `header.logoAlt` | Logo | Logo | DEV (F-1) | Logo | DEV (F-1) |
| 6 | `header.menuOpen` | Menu | Menu | DEV | Menú | DEV |
| 7 | `header.menuClose` | Close | Fermer | DEV | Cerrar | DEV |
| 8 | `header.languageSwitcher` | Language | Langue | DEV | Idioma | DEV (after ES 19) |
| 9 | `services.errorTitle` | Services | Services | EXPORT FR 17 | Servicios | EXPORT ES 17 |
| 10 | `services.errorBody` | Sorry, we couldn't load the services right now. Please try again later. | Impossible de charger les services pour le moment. Réessayez plus tard. | M | Lo sentimos, no pudimos cargar los servicios en este momento. Inténtalo de nuevo más tarde. | DEV |
| 11 | `services.featuredBadge` | Featured Service | Service en vedette | DEV (after FR 39) | Servicio destacado | DEV (after ES 41) |
| 12 | `about.linkedinIconAlt` | LinkedIn Icon | Icône LinkedIn | DEV | Ícono de LinkedIn | DEV |
| 13 | `testimonials.title` | Client feedback | Témoignages de clients | M | — | already filled (ES 89) |
| 14 | `projects.emptyTitle` | Everything unfolds in its sacred time. | Tout se déploie en son temps sacré. | M (F-3) | Todo se despliega en su tiempo sagrado. | M (F-3) |
| 15 | `projects.emptySubtitle` | We’re planting and cultivating new digital projects with wonderful clients. | Nous semons et cultivons de nouveaux projets numériques avec des clients formidables. | DEV (F-3) | Estamos sembrando y cultivando nuevos proyectos digitales con clientes maravillosos. | DEV (F-3) |
| 16 | `projects.emptyQuestion` | Do you have a project in mind? | Vous avez un projet en tête? | DEV (after FR 210) | ¿Tienes un proyecto en mente? | DEV (after ES 216) |
| 17 | `projectDetail.backToProjects` | ← Back to Projects | ← Retour aux réalisations | DEV | ← Volver a proyectos | DEV |
| 18 | `packages.popularBadge` | Popular | Populaire | DEV (I-4) | Popular | DEV (I-4) |
| 19 | `packages.included` | What's included: | Ce qui est inclus : | DEV | Qué incluye: | DEV |
| 20 | `packages.errorTitle` | Packages | Forfaits | EXPORT FR 17 | Paquetes | EXPORT ES 17 |
| 21 | `packages.errorBody` | Sorry, we couldn't load the packages right now. Please try again later. | Impossible de charger les forfaits pour le moment. Réessayez plus tard. | M | Lo sentimos, no pudimos cargar los paquetes en este momento. Inténtalo de nuevo más tarde. | DEV |
| 22 | `calendly.closeDialog` | Close scheduling dialog | Fermer la fenêtre de réservation | DEV | Cerrar la ventana de reserva | DEV |
| 23 | `calendly.frameTitle` | Calendly scheduling | Réservation Calendly | DEV | Reserva en Calendly | DEV |
| 24 | `forms.namePlaceholder` | Your name | Votre nom | DEV | Tu nombre | DEV |
| 25 | `forms.emailPlaceholder` | you@company.com | vous@entreprise.com | DEV | tu@empresa.com | DEV |
| 26 | `emailModal.errors.emailInvalid` | Please enter a valid email | Veuillez entrer une adresse courriel valide. | EXPORT (near) FR 820 | Escribe un correo electrónico válido. | EXPORT (near) ES 830 |
| 27 | `emailModal.errors.subscribeFailed` | Failed to subscribe ({status}) | Échec de l'inscription ({status}) | DEV | Error en la suscripción ({status}) | DEV |
| 28 | `emailModal.errors.unknown` | Subscription failed | L'inscription a échoué | DEV | La suscripción falló | DEV |
| 29 | `emailModal.downloadTitle` | Grab your free guide | Obtenez votre guide gratuit | DEV | Obtén tu guía gratuita | DEV |
| 30 | `emailModal.downloadReady` | Thanks — your guide is ready for you. | Merci — votre guide est prêt. | DEV | Gracias, tu guía está lista. | M |
| 31 | `emailModal.downloadBody` | Enter your name and email, so we can send marketing ideas and tips. | Entrez votre nom et votre adresse courriel pour recevoir le guide. Demander un guide ne vous abonne pas aux courriels promotionnels. | M decision 2: neutral, not a translation. Sentence 2 is verbatim FR 1087 (I-5) | Escribe tu nombre y tu correo electrónico para recibir la guía. Solicitar una guía no te suscribe a correos promocionales. | M decision 2. Sentence 2 is verbatim ES 1091 (I-5) |
| 32 | `emailModal.checking` | Checking... | Vérification... | DEV | Verificando... | DEV |
| 33 | `emailModal.download` | Download the free guide | Obtenir le guide gratuit | EXPORT (near) FR 1132 | Descargar la guía gratuita | DEV |
| 34 | `emailModal.openInNewTab` | Open guide in new tab | Ouvrir le guide dans un nouvel onglet | DEV | Abrir la guía en una pestaña nueva | DEV |
| 35 | `emailModal.downloadUnavailable` | Download unavailable | Téléchargement non disponible | DEV | Descarga no disponible | DEV |
| 36 | `emailModal.preparing` | Preparing download... | Préparation du téléchargement... | DEV | Preparando la descarga... | DEV |
| 37 | `emailModal.pdfNotFound` | Sorry — we couldn't find the PDF on the source site. If this keeps happening, contact us at contact@magnetomarketing.co | Désolé — nous n'avons pas trouvé le PDF sur le site source. Si le problème persiste, écrivez-nous à contact@magnetomarketing.co | DEV | Lo sentimos: no encontramos el PDF en el sitio de origen. Si esto sigue ocurriendo, escríbenos a contact@magnetomarketing.co | M |
| 38 | `emailModal.botChallenge` | The file appears to be protected by the host (bot challenge). Click "Open guide in new tab" to let your browser complete the challenge and download the file. | Le fichier semble protégé par l'hébergeur (vérification anti-robot). Cliquez sur « Ouvrir le guide dans un nouvel onglet » pour permettre à votre navigateur de terminer la vérification et de télécharger le fichier. | DEV | El archivo parece estar protegido por el servidor (verificación contra bots). Haz clic en "Abrir la guía en una pestaña nueva" para que tu navegador complete la verificación y descargue el archivo. | M |
| 39 | `emailModal.nameLabel` | Name | Nom | EXPORT FR 749 | Nombre | EXPORT ES 759 |
| 40 | `emailModal.emailLabel` | Email | Courriel | EXPORT FR 753 | Correo electrónico | EXPORT ES 763 |
| 41 | `emailModal.submitting` | Submitting... | Envoi en cours... | DEV | Enviando... | DEV |
| 42 | `emailModal.continueDownload` | Continue to Download the Guide | Continuer vers le téléchargement | DEV (pattern FR 924) | Continuar con la descarga | M |
| 43 | `notFound.metaTitle` | 404: This page could not be found. | 404 : cette page est introuvable. | DEV | 404: no se encontró esta página. | DEV |
| 44 | `notFound.heading` | 404 | 404 | DEV | 404 | DEV |
| 45 | `notFound.body` | This page could not be found. | Cette page est introuvable. | DEV | No se encontró esta página. | DEV |
| 46 | `projectNotFound.metaTitle` | Project Not Found | Réalisation introuvable | DEV | Proyecto no encontrado | DEV |
| 47 | `projectNotFound.heading` | Project Not Found | Réalisation introuvable | DEV | Proyecto no encontrado | DEV |
| 48 | `projectNotFound.body` | The project you're looking for doesn't exist or may have been moved. | La réalisation que vous cherchez n'existe pas ou a peut-être été déplacée. | DEV | El proyecto que buscas no existe o es posible que se haya movido. | DEV |
| 49 | `projectNotFound.viewAll` | View All Projects | Voir toutes les réalisations | DEV | Ver todos los proyectos | DEV |
| 50 | `cmsFallback.leadMagnet.overTitle` | Not ready to book a call? | Vous préférez attendre avant de réserver un appel? | M (F-4) | ¿Todavía no quieres agendar una llamada? | DEV (F-4) |
| 51 | `cmsFallback.leadMagnet.title` | Download our free guide: | Téléchargez notre guide gratuit : | DEV (F-4) | Descarga nuestra guía gratuita: | DEV (F-4) |
| 52 | `cmsFallback.leadMagnet.subtitle` | 5 Mistakes That Kill Funnel Conversions | 5 erreurs qui nuisent aux conversions de votre tunnel de vente | DEV (F-4) | 5 errores que arruinan las conversiones de tu embudo de ventas | DEV (F-4) |
| 53 | `cmsFallback.requestQuote` | Request Free Quote | Demander une soumission gratuite | DEV (I-7) | Solicitar una cotización gratuita | DEV (I-7) |
| 54 | `cmsFallback.finalCta.bgAlt` | Background | Arrière-plan | DEV (F-2) | Fondo | DEV (F-2) |
| 55 | `cmsFallback.heroImageAlt` | Hero Image | Image d'en-tête | DEV | Imagen principal | DEV |
| 56 | `cmsFallback.socialIconAlt` | Social Icon | Icône de réseau social | DEV (I-8) | Ícono de red social | DEV (I-8) |
| 57 | `cmsFallback.galleryImageAlt` | Gallery image {n} | Image de la galerie {n} | DEV | Imagen de la galería {n} | DEV |
| 58 | `meta.project.title` | {title} \| Magneto Projects | {title} \| Réalisations Magneto | DEV | {title} \| Proyectos Magneto | DEV |

## B. Kept-terms fixes ("Magneto Web Consulting" in EN, missing in FR/ES)

| # | Key | Locale | Written value | Chars | Origin |
|---|---|---|---|---|---|
| K1 | `meta.about.description` | FR | Mauricio Bayuelo, fondateur de Magneto Web Consulting à Montréal : stratégie web, UX/UI et développement pour entreprises de services, en trois langues. | 152 | M (replaces FR 240, 173 chars) |
| K2 | `meta.about.description` | ES | Mauricio Bayuelo, fundador de Magneto Web Consulting en Montreal: estrategia web, diseño UX/UI y desarrollo para empresas de servicios, en tres idiomas. | 152 | M (replaces ES 246, 159 chars) |
| K3 | `meta.contact.description` | ES | Contacta a Magneto Web Consulting en Montreal. Cuéntame qué necesitas crear, corregir o mantener en tu sitio web. Atención en español, francés e inglés. | 152 | DEV, approved (replaces ES 852, 137 chars) |

All three are ≤ 160 (EN `meta.about.description` = 160). Counts are Unicode characters (`[...s].length`). K1 and K2 now
say "en trois langues" / "en tres idiomas" instead of naming the languages.

**Notion parity check (2026-11-09).** Mauricio reports that Notion now holds the exact K1–K3 strings. A scratchpad
script compared `fr.meta.about.description`, `es.meta.about.description` and `es.meta.contact.description` with the
three strings he supplied: **MATCH / MATCH / MATCH**, 152 characters each. The committed export (`637fba7`) still has
the old text until the 5c-rest re-export, which is why `page-metadata.test.ts` carries the exception.

## Gate

| Check | Result | Notes |
|---|---|---|
Final run, after the test updates:

| Check | Result | Notes |
|---|---|---|
| `popularChoise` query, EN/FR/ES (read-only) | **deferred** | Mauricio's decision; see F-5 |
| TODO count (`findTodoKeys`) | **passed** | FR 0 / ES 0. `assertLocalesReady(['en','fr','es'])` does not throw; this is now also a unit test |
| lint | **passed (at limit)** | 88 errors / 94 warnings = limit ≤ 88 / 94. No hits in the four touched source/test files. Exit 1 is expected because the pre-existing errors remain |
| typecheck | **passed** | `tsc --noEmit`, exit 0 |
| tests (`npm test -- --run`) | **passed** | 39 / 39 files, **578 / 578** tests. That is 577 before, with the 3 readiness tests rewritten in place, plus 1 new K1–K3 exception guard |
| `npm run agent:build`, no `ALLOW_UNTRANSLATED_LOCALES` | **passed** | exit 0. `/fr/*` and `/es/*` prerendered, so the readiness guard let the enabled locales through. **The CMS was down during the build** (191 `ECONNREFUSED`), so the pages hold error or empty states, not real content |
| visual | not run | not requested. It also needs the CMS |

First run, before the test updates: tests 6 failed / 571 passed, all caused by this change. See Evidence.

## Evidence

- TODO count: a scratchpad script run with `npx vite-node --config vitest.config.ts` (no repo file):
  ```
  FR TODO keys: 0 []
  ES TODO keys: 0 []
  assertLocalesReady([en, fr, es]): OK
  ```
  `grep -c "TODO]"` finds 1 line per file: the header comment that names the marker, not a value.
- Lint: `npm run lint` → 88 `Error` lines and 94 `Warning` lines; `grep dictionaries` finds no hits.
- Tests, final run: `Test Files 39 passed (39) · Tests 578 passed (578)`, exit 0.
- Tests, first run (before the approved test updates), failing:
  ```
  FAIL src/i18n/dictionary.test.ts > readiness guard > EN has no TODO markers; FR/ES list every key except the ones the copy provides
  FAIL src/i18n/dictionary.test.ts > readiness guard > 5d-lite AC-14: FR 58 / ES 57 after the phase; Packages error keys still block a launch build
  FAIL src/i18n/dictionary.test.ts > readiness guard > throws for an enabled locale with markers and names it with its count
  FAIL src/utils/page-metadata.test.ts > page generateMetadata (EN/FR/ES) > fr about = the export's SEO block
  FAIL src/utils/page-metadata.test.ts > page generateMetadata (EN/FR/ES) > es about = the export's SEO block
  FAIL src/utils/page-metadata.test.ts > page generateMetadata (EN/FR/ES) > es contact = the export's SEO block
  Test Files  2 failed | 37 passed (39) · Tests  6 failed | 571 passed (577)
  ```
  The EN fingerprint and key-parity tests pass, so EN is unchanged and there are no missing or extra keys.
- Build: `env -u ALLOW_UNTRANSLATED_LOCALES npm run agent:build` → exit 0. The agent gate found ports 3000/3100 free
  and no Next process on this checkout. Log: `Environments: .env.local`, then 191 × `TypeError: fetch failed … code:
  'ECONNREFUSED'`. The route table lists `/en|fr|es/{about-magneto,contact,packages,projects,services}` and 9 project
  paths.
- CMS reachability (read-only, host from AGENTS.md, `.env.local` not read):
  `curl -X POST http://magneto-cms-2.local/graphql` → exit 7 (connection refused), both inside and outside the
  sandbox, before and after "Local is running now". `/etc/hosts` maps the host to 127.0.0.1 / ::1.
  `lsof -iTCP -sTCP:LISTEN` shows no listener on 80/443 and no nginx, php-fpm or mysqld process. The build's
  `ECONNREFUSED` matches, so the configured CMS host is local and down, not a remote/production host.

## Deviations
- **Two test files touched beyond the original three-file scope**, approved by Mauricio on 2026-11-09 after the first
  run showed 6 failures. These tests encoded the pre-fill state; see Changes.
- **One added guard test** in `page-metadata.test.ts` (the K1–K3 exception covers exactly 3 keys and still differs
  from the export). It wasn't in the instruction. It keeps the exception narrow and makes it fail loudly once the
  re-export makes it obsolete.
- **`popularChoise` query not run.** It was attempted twice and refused (curl exit 7), then deferred by decision
  (F-5).
- **Two short code comments added** in `fr.ts`/`es.ts`, on `downloadBody` and K1–K3, to explain non-obvious
  divergences (AGENTS.md "comment only non-obvious constraints"). Values are unaffected.

## Recorded follow-ups (Mauricio, 2026-11-09; not fixed here)
- **F-1 `header.logoAlt` should be "Magneto"** in every locale, EN included. That changes the EN fingerprint, so it
  needs its own change.
- **F-2 Decorative images should use `alt=""`:** `cmsFallback.finalCta.bgAlt` and `common.checkIconAlt` →
  **design round**. That is a component change (`FinalCTASection`, `PackageCard`, `ProjectDetail`), and the keys may
  then be removed.
- **F-3 EN `projects.empty*` copy is legacy** → **Magneto copy review**. FR/ES now mirror it (row 14 is literal by
  decision).
- **F-4 `cmsFallback.leadMagnet.*` and EN `emailModal.downloadBody` → 5e.** EN still names the old guide and bundles
  marketing with the download. Rewrite EN in 5e and re-derive FR/ES from the new export.
- **F-5 `packages.popularBadge`: the badge is not rendered by code (the mapper drops the field); query deferred.**
  `mapPackagesPage` doesn't map `popularChoise`, and `PackagesGrid` never passes `isPopular` (I-4). Run the
  read-only query in I-4 if a later change wires `isPopular`.
- **F-6 Remove the `DESCRIPTION_EXCEPTIONS` map** from `page-metadata.test.ts` when the 5c-rest export re-pins the
  K1–K3 copy. Its guard test fails at that point, as a reminder.

## Issues found (not fixed)
- **I-4 `packages.popularBadge`.** EN export 612 forbids "Most popular" badges.
  - Query to run when the CMS answers (read-only; `$language` = `en`, `fr`, `es`):
    `query($language:String){ pages(first:1, where:{language:$language, name:"packages"}){ nodes { databaseId
    packagesPackageFeatures { packagesElements { name popularChoise } } } } }`. Expected: every `popularChoise` is
    `false` or `null`.
  - Verified in code: the badge can't render today, whatever the CMS holds. `mapPackagesPage` doesn't map
    `popularChoise` (`packages/api.ts:53`), and `PackagesGrid`, the only caller of `PackageCard`, never passes
    `isPopular`.
- **I-5 Neutral `downloadBody` is false with today's code.** The modal posts to `/api/mailchimp`
  (`EmailCollectorProvider/index.tsx:208`), which creates the member with `status: 'subscribed'`
  (`pages/api/mailchimp.ts:41`). FR/ES "ne vous abonne pas" / "no te suscribe" becomes true only after 5e (Brevo).
  The section is hidden; do not enable the lead magnet in any locale before 5e.
- **I-7 `cmsFallback.requestQuote`.** EN export 733 says to replace the "Request Free Quote" framing. Translated
  faithfully. The EN change belongs with F-4 / the copy review.
- **I-8 `cmsFallback.socialIconAlt` has no reader in `src/`.** Possibly a dead key; removing it would change the EN
  fingerprint.
- **I-9 Export drift.** `fr.ts`/`es.ts` differ from the committed export at FR 240, ES 246 and ES 852 (K1–K3).
  Notion has been updated (2026-11-09); the repo export catches up at the 5c-rest re-export (F-6). FR
  `testimonials.title` and the other M/DEV UI strings are not in the export at all. Add them to Notion if they should
  be canonical there too.
- **I-10 Identical-to-EN values.** FR/ES "Logo", FR "Menu", "404" and ES "Popular" will trigger 5g `identical-to-en`
  warnings unless they are listed in `glossary.identicalAllowed`.
- **I-11 `.env.local` not read** (your rule for this task), so the role's host check was not done directly. The build
  log's `ECONNREFUSED` points to a local, stopped host.

## Proposed commits (nothing staged)
The commits must go in this order: the dictionary commit alone fails the tests, and the test commit makes them pass.
1. `feat(i18n): fill FR-CA and ES UI dictionaries (Q-D1)`: `fr.ts`, `es.ts`, including K1–K3.
2. `test(i18n): expect zero FR/ES TODO keys and pin K1-K3 metadata exception`: `dictionary.test.ts`,
   `page-metadata.test.ts`.
3. `docs(report): i18n dictionary fill review table and gate results`: this report.

For a bisect-clean history, squash 1 and 2 when merging (the PR's squash merge does this).

## Time
Agent time ≈ 60 min across four rounds (estimated). Human review: unknown.
