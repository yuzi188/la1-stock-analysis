import { getOfficialMarketSummary } from "../../lib/market";
import { addScheduledReport } from "../../lib/server-store";

type ReportType = "morning" | "review";

function reportType(request: Request): ReportType {
  const value = new URL(request.url).searchParams.get("type");
  return value === "review" ? "review" : "morning";
}

async function buildReport(type: ReportType) {
  const summary = await getOfficialMarketSummary();
  const strongest = summary.rankings.gainers[0];
  const weakest = summary.rankings.losers[0];
  const bias =
    summary.breadth.score >= 58
      ? "偏多"
      : summary.breadth.score <= 42
        ? "保守"
        : "震盪";
  const title = type === "morning" ? `開盤摘要：${bias}開局` : `收盤復盤：${bias}盤勢`;
  const detail = [
    `市場廣度 ${summary.breadth.score}/100`,
    strongest ? `強勢 ${strongest.name} ${strongest.changePercent?.toFixed(2) ?? "--"}%` : "強勢股待資料",
    weakest ? `弱勢 ${weakest.name} ${weakest.changePercent?.toFixed(2) ?? "--"}%` : "弱勢股待資料",
    summary.globalMarkets[0]
      ? `國際 ${summary.globalMarkets[0].name} ${summary.globalMarkets[0].changePercent?.toFixed(2) ?? "--"}%`
      : "國際市場待資料",
  ].join(" · ");

  const report = await addScheduledReport({
    type,
    title,
    detail,
    payload: summary,
  });

  return { report, summary };
}

export async function GET(request: Request) {
  const result = await buildReport(reportType(request));
  return Response.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("x-cron-secret") !== secret) {
    return Response.json(
      { ok: false, error: "排程密鑰不正確。", code: "invalid_cron_secret" },
      { status: 401 },
    );
  }

  const result = await buildReport(reportType(request));
  return Response.json({ ok: true, ...result });
}
