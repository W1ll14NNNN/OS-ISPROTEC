import { digitsOnly, json, loadState, saveState } from "./_supabase.js";

const today = () => new Date().toISOString().slice(0, 10);

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { message: "Método não permitido." });

  try {
    const { orderNumber, phone, decision } = JSON.parse(event.body || "{}");
    const normalizedPhone = digitsOnly(phone);
    if (!orderNumber || normalizedPhone.length < 10 || !["approve", "reject"].includes(decision)) {
      return json(400, { message: "Dados de aprovação inválidos." });
    }

    const state = await loadState();
    const order = (state.orders || []).find((item) => String(item.number) === String(orderNumber).trim());
    const customer = (state.customers || []).find((item) => item.id === order?.customerId);
    if (!order || digitsOnly(customer?.phone).slice(-11) !== normalizedPhone.slice(-11)) {
      return json(404, { message: "Não encontramos uma OS com esses dados." });
    }
    if (!["Orçamento", "Aguardando aprovação"].includes(order.status)) {
      return json(409, { message: "Esta OS não está disponível para aprovação." });
    }

    if (decision === "approve") {
      const requested = {};
      (order.parts || []).forEach((item) => {
        requested[item.partId] = (requested[item.partId] || 0) + Number(item.qty || 0);
      });
      for (const [partId, qty] of Object.entries(requested)) {
        const part = (state.parts || []).find((item) => item.id === partId);
        if (!part || Number(part.stock || 0) < qty) {
          return json(409, { message: "Não foi possível aprovar: uma peça do orçamento não está disponível." });
        }
      }
      Object.entries(requested).forEach(([partId, qty]) => {
        const part = state.parts.find((item) => item.id === partId);
        part.stock = Number(part.stock || 0) - qty;
      });
      order.status = "Em reparo";
      order.partsReserved = true;
      order.history = [...(order.history || []), { date: today(), text: "Orçamento aprovado pelo cliente no portal." }];
    } else {
      order.status = "Cancelada";
      if (order.partsReserved) {
        (order.parts || []).forEach((item) => {
          const part = (state.parts || []).find((partItem) => partItem.id === item.partId);
          if (part) part.stock = Number(part.stock || 0) + Number(item.qty || 0);
        });
      }
      order.partsReserved = false;
      order.history = [...(order.history || []), { date: today(), text: "Orçamento não aprovado pelo cliente no portal." }];
    }

    await saveState(state);
    return json(200, {
      order: {
        number: order.number,
        status: order.status,
        message: decision === "approve" ? "Orçamento aprovado. A ISPROTEC iniciará o reparo." : "Orçamento não aprovado. A OS foi cancelada.",
      },
    });
  } catch (error) {
    return json(500, { message: error.message || "Não foi possível registrar sua decisão." });
  }
};
