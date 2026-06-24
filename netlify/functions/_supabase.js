const TENANT_ID = process.env.ISPROTEC_TENANT_ID || "isprotec-main";

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");
const localDate = (value) => {
  if (!value) return "-";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? day + "/" + month + "/" + year : "-";
};

function config() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!url || !key) throw new Error("Integração indisponível. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Netlify.");
  return { url, key };
}

async function request(path, options = {}) {
  const { url, key } = config();
  const response = await fetch(url + path, {
    ...options,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || payload?.hint || "Não foi possível acessar os dados.");
  return payload;
}

export async function loadState() {
  const rows = await request("/rest/v1/app_state?id=eq." + encodeURIComponent(TENANT_ID) + "&select=data");
  if (!rows?.[0]?.data) throw new Error("Base do sistema não encontrada.");
  return rows[0].data;
}

export async function saveState(data) {
  await request("/rest/v1/app_state?id=eq." + encodeURIComponent(TENANT_ID), {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ data, updated_at: new Date().toISOString() }),
  });
}

export function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  };
}

export { digitsOnly, localDate };
