# Design QA

## Target

Reshape `/` and `/zh` around a converter-first layout inspired by `mrpackzip.com`, while keeping the project's dark voxel background, neon green accent, and glass panels. The converter now exposes three real input paths: Modrinth project ID/slug, direct `.mrpack` URL, and local `.mrpack` upload.

## Screenshots Reviewed

- Reference: `/Users/wusir/Desktop/ChatGPT Image Jun 21, 2026, 12_15_51 PM.png`
- Competitor structure source: `/tmp/mrpackzip-competitor.html`
- Browser verification target: `http://localhost:3000/`
- Browser verification target: `http://localhost:3000/zh`

## Checks

- Desktop layout uses the new section order: header, centered hero, three source cards, active converter panel, MRPack explanation, conversion steps, launcher import-path table, FAQ, and footer.
- The converter source cards are visible for `Project ID`, `From URL`, and `Upload File`.
- Desktop width metrics: `clientWidth=1433`, `scrollWidth=1433`.
- Mobile width metrics at 390px viewport: `clientWidth=375`, `scrollWidth=375`.
- Chinese mobile title renders as `转换 / MRPack / 为 ZIP`.
- `/` renders the English design.
- `/zh` renders the same visual design with Chinese copy.
- `/en` redirects to `/`.
- `/zh` sets `document.documentElement.lang` to `zh-Hans` after hydration.
- The file input has an accessible name and accepts `.mrpack`.
- The visible `Select .mrpack file` button is unique after the hidden file input received a distinct accessible name.
- Empty upload conversion shows `Select a .mrpack file before converting.` instead of silently doing nothing.
- `Project ID` and `From URL` switching displays their matching input fields and action buttons.
- The FAQ "open all" control expands all FAQ items instead of linking to itself.
- Hash navigation targets exist for the rendered in-page links.
- Copy describes the real browser-side conversion boundary: local files stay in the browser, while project and URL modes fetch public files directly.
- Launcher compatibility is expressed as import paths, not unverified per-launcher guarantees.
- Background clarity remains high enough to show the voxel scene while preserving dark foreground contrast.

## Functional Checks

- `pnpm test` passed: 5 test files, 33 tests.
- `pnpm run typecheck` passed.
- `pnpm build` passed.
- Core conversion tests cover output ZIP generation, overrides, referenced file downloads, failed download reporting, unsafe path handling, Modrinth project lookup, and URL/project source download helpers.

## Result

Passed. No blocking visual, route, or viewport-width issues found in the reviewed desktop and mobile viewports.
