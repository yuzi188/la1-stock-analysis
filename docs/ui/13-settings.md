# 13 設定 / Settings

## Purpose

設定頁保持乾淨，不做戰情 dashboard。

## Primary Visualization

Settings split layout：左側 category，右側 form。

## Grid Layout

- Settings nav：3 cols。
- Settings content：9 cols。
- Sections：General / Data Sources / Alerts / AI Analysis / Appearance / Account / System。

## Components

- `SettingsNav`
- `SettingsSection`
- `Toggle`
- `SegmentedControl`
- `InputField`
- `DataSourceStatus`
- `AccountPanel`

## API Mapping

- Account：`POST /api/auth`、`GET/POST /api/user`
- Sync：`GET/POST /api/sync`
- Notification test：`POST /api/notify`
- Data source status：由 `/api/context`、`/api/market`、`/api/geopolitics` 的 state 組成。

## Interaction

- Language：Traditional Chinese first。
- Market Color：台股 Red Up / Green Down。
- Refresh Rate：watchlist polling settings 預留。
- Notifications：Telegram / LINE / Email / Webhook 狀態。

## Desktop

乾淨表單，不加 hero，不加大型圖。

## Tablet

Nav 轉 horizontal tabs。

## Mobile

更多 -> 設定。Sections accordion。

## Loading

Account/data source status 獨立 loading。

## Empty

缺 env 顯示「未設定」，不顯示 key。

## Error

設定保存失敗顯示 retry。
