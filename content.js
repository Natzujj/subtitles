console.log("Content script carregado!");

let legendaDiv;

function criarLegenda() {
  if (legendaDiv) return;

  legendaDiv = document.createElement("div");
  legendaDiv.innerText = "Legenda ativada... (simulação)";
  legendaDiv.style.position = "fixed";
  legendaDiv.style.bottom = "10%";
  legendaDiv.style.left = "50%";
  legendaDiv.style.transform = "translateX(-50%)";
  legendaDiv.style.background = "rgba(0, 0, 0, 0.8)";
  legendaDiv.style.color = "#fff";
  legendaDiv.style.padding = "12px 20px";
  legendaDiv.style.fontSize = "18px";
  legendaDiv.style.borderRadius = "10px";
  legendaDiv.style.zIndex = "9999";

  document.body.appendChild(legendaDiv);
}

function removerLegenda() {
  if (legendaDiv) {
    legendaDiv.remove();
    legendaDiv = null;
  }
}

// Escuta as mensagens do popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startSubtitles") {
    console.log("Recebido: startSubtitles");
    criarLegenda();
    sendResponse({ status: "Legenda iniciada" });
  } else if (request.action === "stopSubtitles") {
    console.log("Recebido: stopSubtitles");
    removerLegenda();
    sendResponse({ status: "Legenda parada" });
  }
  // Retornar true é importante se você usa sendResponse de forma assíncrona,
  // ou mesmo síncrona em alguns casos, para manter o canal de mensagem aberto
  // até que sendResponse seja chamado.
  return true;
});
