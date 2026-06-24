const trackForm = document.getElementById("trackOrderForm");
const trackResult = document.getElementById("trackOrderResult");
const appointmentForm = document.getElementById("appointmentForm");
const appointmentFeedback = document.getElementById("appointmentFeedback");

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function showTrackResult(message, tone = "neutral") {
  trackResult.hidden = false;
  trackResult.dataset.tone = tone;
  trackResult.innerHTML = message;
}

trackForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(trackForm);
  const payload = {
    orderNumber: formData.get("orderNumber"),
    phone: digitsOnly(formData.get("phone")),
  };

  showTrackResult("Consultando sua ordem de serviço...", "neutral");
  try {
    const response = await fetch("/.netlify/functions/track-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Não foi possível localizar a OS.");

    showTrackResult(
      "<strong>OS " + escapeHtml(data.order.number) + " - " + escapeHtml(data.order.status) + "</strong>" +
        "<span>Equipamento: " + escapeHtml(data.order.equipment) + "</span>" +
        "<span>Prazo: " + escapeHtml(data.order.deadline) + "</span>" +
        "<span>Atualização: " + escapeHtml(data.order.lastUpdate) + "</span>",
      "success"
    );
  } catch (error) {
    showTrackResult(error.message || "Não foi possível localizar a OS.", "error");
  }
});

appointmentForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = appointmentForm.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(appointmentForm).entries());
  payload.phone = digitsOnly(payload.phone);

  submitButton.disabled = true;
  appointmentFeedback.textContent = "Enviando sua solicitação...";
  try {
    const response = await fetch("/.netlify/functions/request-appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Não foi possível enviar o agendamento.");

    appointmentForm.reset();
    appointmentFeedback.textContent = "Solicitação recebida. Sua OS é " + data.orderNumber + ". A equipe confirmará pelo WhatsApp.";
  } catch (error) {
    appointmentFeedback.textContent = error.message || "Não foi possível enviar. Chame a ISPROTEC pelo WhatsApp.";
  } finally {
    submitButton.disabled = false;
  }
});
