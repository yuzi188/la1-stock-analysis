# Design QA

Reference: `C:\Users\ofa\.codex\codex-remote-attachments\019fc07c-83f2-7f70-9d42-3b088f0a8aa3\242F00E6-DAA5-4593-8556-9A3D63FDA428\1-照片-1.jpg`

Viewport checked: 1280 x 800 and current narrow app viewport, local preview at `http://localhost:3003/`.

## Checks

- Left navigation is fixed on the left and uses stacked page buttons like the reference dashboard.
- The selected page highlights in the sidebar.
- The main content changes by page; the overview no longer renders every module on the same homepage.
- The top bar, status strip, search field, and sync action stay in a compact dashboard row.
- Overview uses a dense dashboard composition: top metrics, sentiment, trend, and Live Quote panels.
- K-line chart remains inside the Live Quote panel.
- Placeholder data states are visibly labeled instead of fabricated.
- Left sidebar, top sync bar, and main dashboard now use a fixed viewport shell.
- Main content scrolls independently from the sidebar.
- Text-heavy rows, chips, rankings, news, and data-source cards truncate or wrap inside their containers.
- Page-specific layouts keep sparse pages balanced: global market and settings panels now span the page instead of staying cramped on the left.
- Browser QA checked overview, global market, data, AI, settings, and watchlist-related layouts for overlap and horizontal overflow.

## Remaining P3 Polish

- The reference image uses custom iconography in the sidebar and metric headers; this iteration uses numbered labels to keep the build lightweight.
- Some unconnected market-wide data panels still show pending states until real public/authorized data feeds are added.

final result: passed
