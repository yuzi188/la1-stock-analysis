const baseUrl = process.env.APP_BASE_URL;
const secret = process.env.CRON_SECRET;
const type = process.argv.includes("--review") ? "review" : "morning";

if (!baseUrl) {
  throw new Error("APP_BASE_URL is required, for example https://your-app.up.railway.app");
}

const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/reports?type=${type}`, {
  method: "POST",
  headers: {
    ...(secret ? { "x-cron-secret": secret } : {}),
  },
});

const payload = await response.json().catch(() => null);
if (!response.ok) {
  throw new Error(`Scheduled report failed: ${response.status} ${JSON.stringify(payload)}`);
}

console.log(JSON.stringify(payload, null, 2));
