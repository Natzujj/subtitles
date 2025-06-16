console.log("Content script carregado!");

let recognition;
let legendaDiv;
let isDragging = false;
let dragOffsetX, dragOffsetY;

let currentFinalTextForPage = "";
const MAX_CHARS_PER_PAGE = 100;

let ultimoTextoCapturado = "";
let timeoutVerificacao;
const INTERVALO_ANALISE = 2000; 
const MIN_PALAVRAS = 5;

const translateApiUrl = "https://deep-translate1.p.rapidapi.com/language/translate/v2";
const apiKey = "your_api_key_here"; 

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
    legendaDiv.style.maxWidth = "70%";
    legendaDiv.style.textAlign = "center";
    legendaDiv.style.cursor = "grab";

    document.body.appendChild(legendaDiv);
    currentFinalTextForPage = "";

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
        let accumulated_interim_for_this_event = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                atualizarTextoFinal(transcript);
            } else {
                accumulated_interim_for_this_event += transcript;
            }
        }

        if (accumulated_interim_for_this_event && legendaDiv) {
            legendaDiv.innerText = currentFinalTextForPage + accumulated_interim_for_this_event;
        }
    };


    recognition.onerror = (event) => {
        console.error("Erro no reconhecimento:", event.error);
        legendaDiv.innerText = "Erro no reconhecimento: " + event.error;
    };

    recognition.onend = () => {
        console.log("Reconhecimento de voz encerrado.");
    };

    recognition.start();
}

function atualizarTextoFinal(transcript) {
    const proximoTexto = currentFinalTextForPage + transcript;

    if (currentFinalTextForPage.length === 0 || (proximoTexto.length > MAX_CHARS_PER_PAGE && currentFinalTextForPage.length > 0)) {
        currentFinalTextForPage = transcript;
    } else {
        currentFinalTextForPage = transcript;
    }
    if (legendaDiv) {
        legendaDiv.innerText = currentFinalTextForPage;
    }
}

async function traduzirTexto(texto, de = "fr", para = "pt") {
    try {
        const response = await fetch(translateApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-rapidapi-key": apiKey,
                "x-rapidapi-host": "deep-translate1.p.rapidapi.com"
            },
            body: JSON.stringify({
                q: texto,
                source: de,
                target: para
            })
        });

        const data = await response.json();
        return data.data.translations.translatedText;
    } catch (err) {
        console.error("Erro na tradução:", err);
        return "[Erro na tradução]";
    }
}

function iniciarReconhecimentoComTraducao(lang, fromLang, toLang) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        legendaDiv.innerText = "SpeechRecognition não suportado neste navegador.";
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    let transcriptAtual = "";

    recognition.onresult = (event) => {
        let novoTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            novoTranscript += event.results[i][0].transcript;
        }

        transcriptAtual = novoTranscript.trim();

        // Atualiza o texto enquanto o usuário fala
        if (legendaDiv) {
            legendaDiv.innerText = transcriptAtual;
        }

        // Se já tiver um timer rodando, cancela
        if (timeoutVerificacao) clearTimeout(timeoutVerificacao);

        // Inicia novo timer
        timeoutVerificacao = setTimeout(async () => {
            const palavrasNovas = contarPalavrasDiferentes(ultimoTextoCapturado, transcriptAtual);

            if (palavrasNovas >= MIN_PALAVRAS) {
                const traducao = await traduzirTexto(transcriptAtual, fromLang, toLang);
                atualizarTextoFinal(traducao);
                ultimoTextoCapturado = transcriptAtual;
            }
        }, INTERVALO_ANALISE);
    };

    recognition.onerror = (event) => {
        console.error("Erro no reconhecimento:", event.error);
        legendaDiv.innerText = "Erro no reconhecimento: " + event.error;
    };

    recognition.start();
}

function contarPalavrasDiferentes(texto1, texto2) {
    const palavras1 = texto1.split(/\s+/);
    const palavras2 = texto2.split(/\s+/);

    let contador = 0;

    for (let i = 0; i < palavras2.length; i++) {
        if (palavras1[i] !== palavras2[i]) {
            contador++;
        }
    }

    return contador;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "onlySubtitles") {
        criarLegenda();
        iniciarReconhecimento(request.lang || "fr-FR");
        sendResponse({ status: "Legenda simples iniciada" });
    }

    if (request.action === "startTranslation") {
        criarLegenda();
        iniciarReconhecimentoComTraducao(request.lang || "fr-FR");
        sendResponse({ status: "Tradução iniciada" });
    }

    if (request.action === "stopSubtitles") {
        removerLegenda();
        sendResponse({ status: "Legenda parada" });
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