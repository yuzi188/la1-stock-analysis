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
- Market Pulse and Market Breadth now include selected-stock relative breadth, so a searched symbol uses its own trend, risk, technical score, and market regime instead of unrelated full-market breadth.
- AI decision cards now use market-regime-first logic and show direct buy / no-buy / sell-or-avoid recommendations.
- Sector rotation now uses TWSE/TPEx market data with LA1 theme symbol maps to show average change, breadth, score, and leading stocks for AI server, semiconductor, cooling/power, PCB/CCL, and aerospace themes.
- Watchlist monitor rows were compacted for mobile so more selected stocks fit on one screen while preserving price, change, status, and delete actions.
- Watchlist data now persists in browser storage and cloud pulls no longer replace a local watchlist with empty cloud data.
- Overview homepage now prioritizes decision, live quote, trend, and sentiment in the first viewport, with breadth, sector rotation, institution, watchlist, rankings, global risk, and news below.
- Desktop overview homepage now follows the reference command-center layout: 3-card top row, 4-card middle row, 3-card bottom row, with dense one-screen sizing and detailed quote/decision/geopolitics cards kept on their dedicated pages.
- Mobile pages now use a thumbnail dashboard mode: compact two-column portrait and three-column landscape grids, with long copy/actions hidden in card view because cards can be tapped to inspect details.
- Mobile thumbnail rows now use fixed compact heights instead of stretch-to-fill rows; watchlist cards collapse to ticker/price/status previews so the page no longer grows from long watchlist content.
- International Market now includes a geopolitical situation panel using a GDELT-backed API endpoint plus World Monitor integration status and links.
- Menu pages were audited so each page now keeps only functionally relevant cards; unrelated quote, ranking, source, and news panels were removed from narrow-purpose pages.
- Click-to-enlarge modal for dashboard cards.
- Existing mobile layout and core data features preserved.

Checks completed:
- `pnpm run lint` passed.
- `pnpm test` passed, including production build and rendered HTML tests.

Blocked check:
- final result: blocked
- Browser screenshot comparison was not completed because the project does not include Playwright and the in-app browser control tool was not available in this run.
