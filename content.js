console.log("Content script carregado!");

let recognition;
let legendaDiv;

function criarLegenda() {
    if (legendaDiv) return;

    legendaDiv = document.createElement("div");
    legendaDiv.innerText = "Ativando reconhecimento de voz...";
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
    legendaDiv.style.maxWidth = "90%";
    legendaDiv.style.textAlign = "center";

    document.body.appendChild(legendaDiv);
}

function removerLegenda() {
    if (legendaDiv) {
        legendaDiv.remove();
        legendaDiv = null;
    }

    if (recognition) {
        recognition.stop();
        recognition = null;
    }
}

function iniciarReconhecimento(lang = "fr-FR") {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        legendaDiv.innerText = "SpeechRecognition não suportado neste navegador.";
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = lang; 
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        let texto = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            texto += event.results[i][0].transcript;
        }
        legendaDiv.innerText = texto;
    };

    recognition.onerror = (event) => {
        console.error("Erro no reconhecimento:", event.error);
        legendaDiv.innerText = "Erro no reconhecimento: " + event.error;
    };

    recognition.onend = () => {
        console.log("Reconhecimento de voz encerrado.");
        // Opcional: reinicia
        recognition.start();
    };

    recognition.start();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startSubtitles") {
        criarLegenda();
        iniciarReconhecimento(request.lang || "fr-FR");
        sendResponse({ status: "Legenda iniciada" });
    }

    if (request.action === "stopSubtitles") {
        removerLegenda();
        sendResponse({ status: "Legenda parada" });
    }

    if (request.action === "onlySubtitles") {
        criarLegenda();
        iniciarReconhecimento(request.lang || "fr-FR");
        sendResponse({ status: "Legenda simples iniciada" });
    }
});
