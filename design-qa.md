# Design QA

Source visual: user-provided sci-fi command center dashboard reference.

Implementation scope:
- Desktop cockpit background and central command screen frame.
- Bottom dock navigation for desktop widths.
- Mobile cockpit visual treatment with the same background, glass panels, and horizontal page navigation.
- Overview page rearranged into a practical market dashboard: sentiment, trend, institution, breadth, sector, gainers, losers, global, news, and watchlist.
- Overview page includes a Fugle-backed live quote card for the currently searched stock.
- Mobile dashboard uses compact multi-column card layout so cards resemble the horizontal command-center density and can be tapped to enlarge.
- Mobile bottom dock keeps the homepage entry visible and labels the scrollable section as menu.
- Market Pulse page now shows only the currently selected stock or ETF: sentiment, trend, live quote, and K-line detail. It no longer shows unrelated market ranking cards.
- Click-to-enlarge modal for dashboard cards.
- Existing mobile layout and core data features preserved.

Checks completed:
- `pnpm run lint` passed.
- `pnpm test` passed, including production build and rendered HTML tests.

Blocked check:
- final result: blocked
- Browser screenshot comparison was not completed because the project does not include Playwright and the in-app browser control tool was not available in this run.
