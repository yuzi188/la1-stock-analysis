import { cleanSymbol, getMarketContext, MarketContext, MarketQuote } from "../../lib/market";

type AnalysisResult = {
  conclusion: string;
  stance: "偏多" | "中性" | "偏保守";
  facts: string[];
  scenarios: {
    bullish: string;
    neutral: string;
    bearish: string;
  };
  risks: string[];
  nextChecks: string[];
  disclaimer: string;
};

type OpenAIResponse = {
  output_text?: string;
  output?: {
    content?: { text?: string; type?: string }[];
    type?: string;
  }[];
  error?: { message?: string };
};

function extractOutputText(payload: OpenAIResponse) {
  if (typeof payload.output_text === "string") return payload.output_text;

  return (
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function parseJson(text: string): AnalysisResult {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleaned) as AnalysisResult;
}

function fallbackAnalysis(quote: MarketQuote, text: string): AnalysisResult {
  return {
    conclusion: text || "AI 已回應，但格式無法自動整理。",
    stance: "中性",
    facts: [
      `${quote.name} ${quote.symbol} 最新成交價為 ${quote.price ?? "未提供"}。`,
      `資料來源：${quote.source}，時間：${quote.updatedAt ?? "未提供"}。`,
    ],
    scenarios: {
      bullish: "若價格續強且量能放大，可觀察是否有族群同步轉強。",
      neutral: "若盤中量縮整理，先觀察支撐與法人籌碼是否延續。",
      bearish: "若跌破當日低點且量能放大，短線風險升高。",
    },
    risks: ["目前只有即時報價資料，尚未納入完整財報、籌碼與技術線型。"],
    nextChecks: ["補入均線、月營收、法人買賣與產業新聞後再提高判斷信心。"],
    disclaimer: "此內容為研究輔助，不構成投資建議或保證獲利。",
  };
}

function buildPrompt(context: MarketContext) {
  return `
請根據以下台股資料，產生可執行的台股投資決策摘要。

要求：
- 使用繁體中文與台灣投資人熟悉的語氣。
- 結論必須直接，第一句用「建議買」、「不買」、「建議賣出」或「續抱觀察」其中一種開頭。
- 判斷順序必須是：先看大盤制度與風險環境，再看個股趨勢、均線、波動、營收與新聞。
- 用機構交易邏輯：趨勢、風險報酬、部位控管、停損條件；不要用散戶追高、聽消息、猜低點的語氣。
- 不要說「一定買進」或「一定賣出」，但要清楚說明目前應該買、不買、賣出或續抱觀察。
- 只能根據提供的資料事實做推論，不得編造財報、法人、新聞或均線資料。
- 若資料不足，要明確指出下一步需要查什麼。
- 法人買賣超目前標示為待接授權資料時，不得推論外資、投信或自營商動向。
- 不要用「可以看看」、「再觀察看看」這類沒有決策力的模糊句；若要觀察，必須說明觸發買進或賣出的條件。
- 回傳 JSON，不要加 Markdown。

JSON 欄位：
{
  "conclusion": "一句話結論，開頭必須是建議買 / 不買 / 建議賣出 / 續抱觀察",
  "stance": "偏多 | 中性 | 偏保守",
  "facts": ["可由資料直接支持的事實"],
  "scenarios": {
    "bullish": "偏多情境",
    "neutral": "觀望情境",
    "bearish": "偏空情境"
  },
  "risks": ["主要風險"],
  "nextChecks": ["下一步應檢查的資料"],
  "disclaimer": "此內容為研究輔助，不構成投資建議或保證獲利。"
}

市場資料：
${JSON.stringify(context, null, 2)}
`.trim();
}

function errorResponse(error: string, code: string, status = 500) {
  return Response.json({ ok: false, error, code }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = cleanSymbol(searchParams.get("symbol"));

  if (!symbol) {
    return errorResponse("請提供股票代號。", "missing_symbol", 400);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return errorResponse(
      "尚未設定 OPENAI_API_KEY。補上 key 後即可產生 AI 分析。",
      "missing_openai_key",
      503,
    );
  }

  try {
    const context = await getMarketContext(symbol);
    const model = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions:
          "你是台股研究智能體。你的任務是先判斷大盤制度，再用已驗證資料輸出買、不買、賣出或續抱觀察的研究決策、風險提醒與情境推演。不得編造資料，不得保證獲利。",
        input: buildPrompt(context),
        reasoning: { effort: "low" },
        text: { verbosity: "medium" },
        store: false,
      }),
    });

    const payload = (await response.json()) as OpenAIResponse;

    if (!response.ok) {
      return errorResponse(
        payload.error?.message ?? "OpenAI 分析服務暫時無法回應。",
        "openai_error",
        response.status,
      );
    }

    const outputText = extractOutputText(payload);
    let analysis: AnalysisResult;

    try {
      analysis = parseJson(outputText);
    } catch {
      analysis = fallbackAnalysis(context.quote, outputText);
    }

    return Response.json({
      ok: true,
      quote: context.quote,
      context,
      analysis,
      model,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const err = error as { message?: string; code?: string; status?: number };
    return errorResponse(
      err.message ?? "AI 分析暫時無法使用。",
      err.code ?? "analysis_error",
      err.status ?? 500,
    );
  }
}
