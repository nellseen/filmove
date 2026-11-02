# DESAIN.md — Visual Design System & UX Specification

> **Product:** Telegram Link Catalog  
> **Visual direction:** Minimalist, clean, calm, content-first  
> **Core interaction:** Paste a public Telegram post URL → preview available metadata → publish a card → visitor clicks Watch Now and opens the original Telegram post.

---

## 1. Design principles — mandatory

These principles are rules, not optional inspiration.

1. **Minimalism first.** Every visible element must serve navigation, comprehension, or an action. Remove decorative elements that do not help the user.
2. **Content is the hero.** Thumbnails, titles, channel labels, and descriptions receive visual priority. The interface must not compete with the content.
3. **Consistent custom components.** Build a project-owned component system and use it on every page. Do not style each page independently.
4. **Calm visual hierarchy.** Use typography, spacing, alignment, and subtle borders—not gradients, loud colors, or heavy shadows—to create hierarchy.
5. **Predictable behavior.** Buttons, cards, forms, dialogs, loading states, and navigation must behave consistently.
6. **Responsive by default.** Design mobile first, then expand to tablet and desktop.
7. **Accessible by default.** Keyboard navigation, visible focus, semantic markup, readable contrast, and accessible labels are required.
8. **Honest metadata.** Never make unavailable metadata look real. Missing thumbnails use a neutral placeholder; missing fields are omitted or clearly represented.
9. **No video player UI.** The app does not play or host video. The primary action opens the original Telegram post.
10. **No visual clutter.** Avoid gradients, glassmorphism, neon, excessive shadows, noisy backgrounds, autoplay, decorative counters, and unnecessary animation.

## 2. Brand and visual language

### Personality
- Clean
- Neutral
- Modern
- Trustworthy
- Practical
- Content-focused

### Color tokens

Use CSS variables/design tokens. These are starting values; maintain consistent contrast and do not add random colors per page.

#### Light theme
| Token | Suggested value | Usage |
|---|---|---|
| `--background` | `#F7F8FA` | App/page background |
| `--surface` | `#FFFFFF` | Cards, panels, dialogs |
| `--surface-muted` | `#F1F3F5` | Input backgrounds, subtle sections |
| `--text-primary` | `#17191C` | Main text |
| `--text-secondary` | `#68707A` | Metadata, supporting text |
| `--border` | `#E5E8EC` | Dividers, outlines |
| `--accent` | `#2563EB` | Primary actions and links |
| `--accent-hover` | `#1D4ED8` | Hover state |
| `--danger` | `#DC2626` | Destructive actions/errors |
| `--success` | `#15803D` | Published/success state |
| `--warning` | `#A16207` | Warnings |

#### Dark theme (optional, only after light theme is complete)
| Token | Suggested value | Usage |
|---|---|---|
| `--background` | `#111315` | App/page background |
| `--surface` | `#191C1F` | Cards, panels |
| `--surface-muted` | `#22262A` | Muted surfaces |
| `--text-primary` | `#F4F5F6` | Main text |
| `--text-secondary` | `#A0A7AF` | Supporting text |
| `--border` | `#30363D` | Dividers |
| `--accent` | `#6D9EFF` | Primary actions |

Do not use color alone to communicate status; pair status colors with text or icons.

## 3. Typography

- Use one clean sans-serif family, such as Inter or Geist.
- Use a consistent type scale:
  - Page title: 28–32px desktop, 24–28px mobile.
  - Section title: 18–20px.
  - Card title: 15–17px, semibold.
  - Body: 14–16px.
  - Metadata/labels: 12–13px.
- Body line height: approximately 1.5.
- Avoid all-caps for long labels.
- Use sentence case for buttons and navigation.
- Clamp long card titles to 2 lines and descriptions to 2–3 lines; full content can appear on the detail view if implemented.

## 4. Spacing, sizing, and shape

Use a consistent 4px-based spacing scale:
- `4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48`, `64`.

Suggested geometry:
- Main content max width: 1200px.
- Desktop page horizontal padding: 32px.
- Tablet page horizontal padding: 24px.
- Mobile page horizontal padding: 16px.
- Card radius: 12px.
- Input/button radius: 8px.
- Dialog radius: 14px.
- Border width: 1px.
- Primary button height: 42–44px.
- Input height: 42–44px.
- Thumbnail ratio: 16:9.
- Grid gap: 20–24px desktop, 12–16px mobile.

Use subtle shadows only when needed to establish layering (e.g. dropdown/dialog). Prefer borders for cards.

## 5. Iconography

- Use one icon set consistently (Lucide is recommended).
- Standard sizes: 16px inline, 18px button, 20px navigation.
- Use stroke icons with consistent stroke width.
- Do not mix emoji, filled icons, and unrelated icon packs.
- Every icon-only button must have an accessible label and tooltip where useful.

## 6. Layout and navigation

### Public site header
- Left: compact wordmark.
- Right: minimal navigation; do not show admin controls to public visitors.
- Header height around 64px desktop and 56px mobile.
- Use a subtle bottom border.
- Keep the header background solid.

### Public listing page
- Main container centered with max width.
- Page heading and short supporting line.
- Optional search input only if search is implemented.
- Responsive card grid:
  - Desktop: 3 columns at wide widths; 2 columns at medium widths.
  - Mobile: 1 column.
- Use pagination or “Load more”; do not load the entire database at once.
- Empty state should be simple and helpful.

### Admin layout
- Desktop: compact sidebar + main content area.
- Mobile: sidebar becomes a drawer or compact top navigation.
- Sidebar items: Overview, Posts, Add Link.
- Keep admin status and sign-out accessible but visually quiet.
- Main content width should support forms and metadata preview without stretching text excessively.

## 7. Core screens

### A. Public listing

Required elements:
1. Site header.
2. Page title (e.g. “Video Collection” or final approved product name).
3. Optional one-line description.
4. Responsive grid of `PostCard` components.
5. Pagination.
6. Footer with minimal links if needed.

Post card anatomy:
- 16:9 thumbnail region.
- If image exists, use `object-fit: cover`.
- If image is missing/broken, show neutral placeholder with a small image/file icon; never use a random unrelated stock image.
- Channel label as muted metadata.
- Title, max two lines.
- Description excerpt, max three lines, optional.
- Optional source date if reliable.
- One clear primary action: **Tonton Sekarang**.
- Clicking the action opens the exact original Telegram post in a new tab.
- Do not make the entire card a misleading link if it has multiple actions.

### B. Admin sign-in

Required elements:
- Centered, compact sign-in panel.
- Product wordmark.
- Email/password or the configured Firebase Auth method.
- Clear validation and authentication errors.
- Loading state on submit.
- No public registration unless explicitly requested.
- Do not reveal whether an arbitrary email belongs to an account.

### C. Admin overview

Required elements:
- Page title and a clear “Tambah Link” primary action.
- Small summary counts only if backed by real data.
- Recent posts list/table.
- Status labels: Draft, Published, Archived.
- Avoid decorative charts and vanity metrics.

### D. Add Telegram link / metadata preview

This is the most important admin flow.

Step 1 — Paste link:
- One clearly labeled URL input.
- Placeholder: `https://t.me/channel/123`
- Primary action: “Ambil Preview”.
- Helper text: “Gunakan link postingan dari channel Telegram publik.”
- Show validation inline.

Step 2 — Preview:
- Show a preview card using the same `PostCard` visual language.
- Show fetched fields only when actually returned.
- Distinguish fetched metadata from admin edits using a subtle “Terambil dari Telegram” label where useful.
- Missing thumbnail uses the neutral placeholder.
- Allow admin to edit:
  - Title (required before publish).
  - Description/caption.
  - Channel label.
  - Thumbnail URL (optional).
- Show the original Telegram URL in a read-only field.
- Actions: “Simpan Draft” (secondary) and “Publikasikan” (primary).
- If extraction fails, show a calm inline message and retain the URL so the admin can fill fields manually.
- Do not show a fake successful preview.

Step 3 — Save result:
- Show a toast for success or failure.
- Prevent double submission.
- Navigate to the post detail/list after successful save, as appropriate.

### E. Admin posts list

- Table on desktop; clean stacked list/cards on mobile.
- Columns/fields: thumbnail, title, channel, status, updated date, actions.
- Actions: Edit, Publish/Unpublish, Delete.
- Use a custom dropdown menu and confirmation dialog.
- Keep destructive action visually distinct but not oversized.

### F. Public post detail (optional)
- Show title, thumbnail, description, channel label, and source date if available.
- One prominent “Tonton Sekarang” action.
- The action opens the original Telegram URL.
- Do not add a custom video player.

## 8. Custom component inventory

Every visible UI element must be built from these project-owned components or their compositions.

### Foundation
- `Button`
  - Variants: primary, secondary, outline, ghost, destructive.
  - Sizes: sm, md, lg.
  - States: default, hover, focus-visible, disabled, loading.
- `IconButton`
- `Input`
- `Textarea`
- `Label`
- `Field`
- `Select` (only if needed)
- `Checkbox` (only if needed)
- `Separator`
- `Container`
- `Stack` / `Inline` layout helpers (optional)

### Feedback and overlays
- `Dialog`
- `ConfirmDialog`
- `DropdownMenu`
- `Toast`
- `Alert`
- `Skeleton`
- `Spinner`
- `EmptyState`
- `ErrorState`
- `Tooltip`

### Product components
- `AppHeader`
- `AdminSidebar`
- `PageHeader`
- `PostCard`
- `PostGrid`
- `Thumbnail`
- `ChannelLabel`
- `PostStatusBadge`
- `MetadataPreview`
- `PostForm`
- `PostActions`
- `Pagination`

All variants and design tokens must be centralized. Do not duplicate component styling across pages.

## 9. Interaction and state rules

- Every button must perform a real action.
- Use clear disabled/loading states while network operations are running.
- Prevent duplicate submissions.
- Forms must show inline validation messages next to the relevant field.
- Toasts are for brief operation feedback, not for persistent errors.
- Persistent errors must remain visible in the page.
- Confirm delete and other destructive actions using `ConfirmDialog`.
- External Telegram links must open in a new tab with `rel="noopener noreferrer"`.
- Do not silently fail when a thumbnail cannot load.
- Do not use browser-native `alert`, `confirm`, or `prompt`.
- Do not autoplay media or load a video player.

## 10. Responsive behavior

### Mobile (320–767px)
- One-column post list.
- 16px page gutters.
- Header navigation collapses cleanly.
- Admin sidebar becomes a drawer or compact navigation.
- Forms use full width.
- Preview card stacks naturally.
- Primary actions remain easy to tap (minimum target 44px).
- No horizontal page overflow.

### Tablet (768–1023px)
- Two-column public grid where space permits.
- Admin navigation remains compact.
- Forms and preview may use a two-column layout only when each column remains readable.

### Desktop (1024px and above)
- Up to three public card columns.
- Admin sidebar and content panel.
- Add-link page may use a form/preview split layout.
- Keep line lengths controlled.

## 11. Accessibility requirements

- Use semantic landmarks: `header`, `nav`, `main`, `aside`, `footer`.
- Every input has a visible label.
- Keyboard focus is always visible.
- Dialog traps focus and returns focus to its trigger.
- Buttons and links have meaningful accessible names.
- Images have appropriate alt text; decorative images use empty alt.
- Ensure WCAG AA contrast for normal text and controls.
- Respect reduced-motion preferences.
- Status must not be communicated by color alone.

## 12. Visual QA checklist

Before calling the design complete, verify:

- [ ] All pages use the same design tokens.
- [ ] All visible controls use custom components.
- [ ] No raw browser alert/confirm/prompt.
- [ ] No gradients, glassmorphism, neon, or excessive shadows.
- [ ] Public cards have consistent 16:9 thumbnail regions.
- [ ] Missing and broken thumbnails have a designed fallback.
- [ ] Long titles and captions do not break card layouts.
- [ ] Loading, empty, error, and disabled states are designed.
- [ ] Mobile layout has no horizontal overflow.
- [ ] Focus indicators are visible.
- [ ] External Telegram links open safely.
- [ ] No video player or video storage UI is present.
- [ ] No fake metadata is displayed.
- [ ] Screenshots are reviewed at mobile, tablet, and desktop widths.

## 13. Design acceptance criteria

The design is accepted only when:
- The public listing is immediately understandable without explanation.
- A visitor can identify the post and reach the original Telegram post in one clear action.
- Admin can paste a link, review/edit metadata, and publish without confusion.
- Missing metadata is handled gracefully and honestly.
- All pages look like one coherent product.
- The interface remains clean and usable at narrow mobile widths.
- Every visible component is custom, reusable, and consistently styled.
