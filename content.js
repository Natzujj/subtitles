console.log("Content script carregado!");

let recognition;
let legendaDiv;
let isDragging = false;
let dragOffsetX, dragOffsetY;

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
    legendaDiv.style.cursor = "grab";

    document.body.appendChild(legendaDiv);

    legendaDiv.addEventListener('mousedown', onDragMouseDown);
}

function removerLegenda() {
    if (legendaDiv) {
        legendaDiv.removeEventListener('mousedown', onDragMouseDown); 
        document.removeEventListener('mousemove', onDragMouseMove); 
        document.removeEventListener('mouseup', onDragMouseUp);  
        isDragging = false; 
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

// GRAB AND DRAG FUNCTIONALITY
function onDragMouseDown(e) {
    if (e.button !== 0) return;

    isDragging = true;

    const rect = legendaDiv.getBoundingClientRect();

    legendaDiv.style.left = rect.left + 'px';
    legendaDiv.style.top = rect.top + 'px';
    legendaDiv.style.bottom = 'auto'; 
    legendaDiv.style.transform = 'none'; 

    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    legendaDiv.style.cursor = 'grabbing'; 
    e.preventDefault(); 

    document.addEventListener('mousemove', onDragMouseMove);
    document.addEventListener('mouseup', onDragMouseUp);
}

function onDragMouseMove(e) {
    if (!isDragging) return;

    let newLeft = e.clientX - dragOffsetX;
    let newTop = e.clientY - dragOffsetY;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const divWidth = legendaDiv.offsetWidth;
    const divHeight = legendaDiv.offsetHeight;

    if (newLeft < 0) newLeft = 0;
    if (newTop < 0) newTop = 0;
    if (newLeft + divWidth > viewportWidth) newLeft = viewportWidth - divWidth;
    if (newTop + divHeight > viewportHeight) newTop = viewportHeight - divHeight;

    legendaDiv.style.left = newLeft + 'px';
    legendaDiv.style.top = newTop + 'px';
}

function onDragMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    legendaDiv.style.cursor = 'grab'; 
    document.removeEventListener('mousemove', onDragMouseMove);
    document.removeEventListener('mouseup', onDragMouseUp);
}