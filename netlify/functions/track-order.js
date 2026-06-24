import { digitsOnly, json, loadState, localDate } from "./_supabase.js";

function quoteForOrder(state, order) {
  const catalog = state.services || [];
  const services = (order.services?.length ? order.services : (Number(order.labor || 0) ? [{ name: "Mão de obra técnica", qty: 1, price: order.labor }] : []))
    .map((item) => {
      const catalogItem = catalog.find((service) => service.id === item.serviceId);
      const qty = Number(item.qty || 1);
      const price = Number(item.price ?? catalogItem?.price ?? 0);
      return { name: item.name || catalogItem?.name || "Serviço técnico", qty, price, total: qty * price };
    });
  const parts = (order.parts || []).map((item) => {
    const catalogItem = (state.parts || []).find((part) => part.id === item.partId);
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    return { name: catalogItem?.name || "Peça", qty, price, total: qty * price };
  });
  const labor = services.reduce((sum, item) => sum + item.total, 0);
  const partsTotal = parts.reduce((sum, item) => sum + item.total, 0);
  const discount = Number(order.discount || 0);
  return { services, parts, labor, partsTotal, discount, total: Math.max(0, labor + partsTotal - discount) };
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { message: "Método não permitido." });

  try {
    const { orderNumber, phone } = JSON.parse(event.body || "{}");
    const normalizedPhone = digitsOnly(phone);
    if (!orderNumber || normalizedPhone.length < 10) return json(400, { message: "Informe o número da OS e o telefone cadastrado." });

    const state = await loadState();
    const order = (state.orders || []).find((item) => String(item.number) === String(orderNumber).trim());
    if (!order) return json(404, { message: "Não encontramos uma OS com esses dados." });

    const customer = (state.customers || []).find((item) => item.id === order.customerId);
    const customerPhone = digitsOnly(customer?.phone);
    if (!customerPhone || customerPhone.slice(-11) !== normalizedPhone.slice(-11)) {
      return json(404, { message: "Não encontramos uma OS com esses dados." });
    }

    const equipment = (state.equipment || []).find((item) => item.id === order.equipmentId);
    const latest = order.history?.[order.history.length - 1];
    const quote = quoteForOrder(state, order);
    const canRespond = ["Orçamento", "Aguardando aprovação"].includes(order.status);
    return json(200, {
      order: {
        number: order.number,
        status: order.status || "Entrada",
        equipment: [equipment?.brand, equipment?.model].filter(Boolean).join(" ") || "Equipamento em análise",
        deadline: localDate(order.deadline),
        lastUpdate: latest?.text || "OS registrada e aguardando atendimento.",
        issue: order.issue || order.title || "-",
        diagnosis: order.diagnosis || "-",
        solution: order.solution || "-",
        quote,
        canRespond,
      },
    });
  } catch (error) {
    return json(500, { message: error.message || "Não foi possível consultar a OS." });
  }
};
