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
const apiKey = "YOUR_API_KEY_HERE";

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
        if (legendaDiv) legendaDiv.innerText = "SpeechRecognition não suportado.";
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    let accumulatedFinalTranscript = '';
    let speechEndTimeout = null;
    const PAUSE_DURATION = 3000; 
    let interimDiv = null;

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                accumulatedFinalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        const fullLiveText = (accumulatedFinalTranscript + interimTranscript).trim();

        chrome.storage.sync.get(['historyMode'], (result) => {
            const contentDiv = document.getElementById("conteudoLegenda");
            if (result.historyMode && contentDiv) {
                if (!interimDiv) {
                    interimDiv = document.createElement("div");
                    interimDiv.style.color = "#90caf9"; 
                    interimDiv.style.fontStyle = "italic";
                    contentDiv.appendChild(interimDiv);
                }
                interimDiv.innerText = fullLiveText || "Ouvindo...";
                contentDiv.scrollTop = contentDiv.scrollHeight;
            } else if (legendaDiv) {
                legendaDiv.innerText = fullLiveText || "Ouvindo...";
            }
        });

        clearTimeout(speechEndTimeout);
        speechEndTimeout = setTimeout(() => {
            const textToProcess = accumulatedFinalTranscript.trim();
            if (textToProcess.length > 0) {
                atualizarTextoFinal(textToProcess);
                accumulatedFinalTranscript = '';
                if (interimDiv) {
                    interimDiv.remove();
                    interimDiv = null;
                }
            }
        }, PAUSE_DURATION);
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
            recognition.start(); 
        } else {
            console.error("Erro no reconhecimento:", event.error);
            if (legendaDiv) legendaDiv.innerText = "Erro: " + event.error;   
        }
    };

    recognition.onend = () => {
        if (recognition) {
            recognition.start();
        }
    };

    recognition.start();
}

function atualizarTextoFinal(transcript) {
  chrome.storage.sync.get(['historyMode'], (result) => {
    const historyEnabled = result.historyMode;

    if (historyEnabled) {
      currentFinalTextForPage += transcript + " ";
    } else {
      currentFinalTextForPage = transcript;
    }

    const contentDiv = document.getElementById("conteudoLegenda");
    if (contentDiv) {
      if (historyEnabled) {
        const bloco = document.createElement("div");
        bloco.style.borderBottom = "1px solid #3a3a3a";
        bloco.style.paddingBottom = "12px";
        bloco.style.marginBottom = "12px";

        const originalDiv = document.createElement("div");
        originalDiv.innerText = transcript.trim();
        originalDiv.style.color = "#9cdcfe"; 
        originalDiv.style.fontWeight = "500";

        bloco.appendChild(originalDiv);
        contentDiv.appendChild(bloco);
        contentDiv.scrollTop = contentDiv.scrollHeight;
      } else {
        const legendaNaoHistorico = document.querySelector("#legenda-container-moderno") || legendaDiv;
        if(legendaNaoHistorico) legendaNaoHistorico.innerText = currentFinalTextForPage;
      }
    } else if (legendaDiv) {
        legendaDiv.innerText = currentFinalTextForPage;
    }
  });
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
        if (legendaDiv) legendaDiv.innerText = "SpeechRecognition não suportado.";
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscriptForSegment = '';
    let speechEndTimeout = null;
    const PAUSE_DURATION = 2000; 
    let interimDiv = null; 

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscriptForSegment += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        const fullLiveText = (finalTranscriptForSegment + interimTranscript).trim();
        
        chrome.storage.sync.get(['historyMode'], (result) => {
            const contentDiv = document.getElementById("conteudoLegenda");
             if (result.historyMode && contentDiv) {
                if (!interimDiv) {
                    interimDiv = document.createElement("div");
                    interimDiv.style.color = "#90caf9";
                    interimDiv.style.fontStyle = "italic";
                    interimDiv.style.marginBottom = "12px";
                    contentDiv.appendChild(interimDiv);
                }
                interimDiv.innerText = fullLiveText || "Ouvindo...";
                contentDiv.scrollTop = contentDiv.scrollHeight;
            } else if (legendaDiv) {
                legendaDiv.innerText = fullLiveText || "Ouvindo...";
            }
        });


        clearTimeout(speechEndTimeout);
        speechEndTimeout = setTimeout(async () => {
            const textToProcess = finalTranscriptForSegment.trim();
            if (textToProcess.length > 0) {
                console.log("Bloco finalizado para tradução:", textToProcess);

                finalTranscriptForSegment = ''; 
                
                if (interimDiv) {
                    interimDiv.remove();
                    interimDiv = null;
                }

                const traducao = await traduzirTexto(textToProcess, fromLang, toLang);

                chrome.storage.sync.get(['historyMode'], (result) => {
                    if (result.historyMode) {
                        appendTextoTraduzido(textToProcess, traducao);
                    } else if (legendaDiv) {
                        legendaDiv.innerText = traducao;
                    }
                });
            } else if (interimDiv) { 
                interimDiv.remove();
                interimDiv = null;
            }
        }, PAUSE_DURATION);
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
            recognition.start(); 
        } else {
            console.error("Erro no reconhecimento:", event.error);
            if (legendaDiv) legendaDiv.innerText = "Erro: " + event.error;   
        }
    };
    
    recognition.onend = () => {
        if (recognition) { 
            recognition.start();
        }
    };

    recognition.start();
}


function appendTextoTraduzido(original, traduzido) {
    const contentDiv = document.getElementById("conteudoLegenda");
    if (!contentDiv) return;

    const bloco = document.createElement("div");
    bloco.style.borderBottom = "1px solid #3a3a3a";
    bloco.style.paddingBottom = "12px";
    bloco.style.marginBottom = "12px";

    const originalDiv = document.createElement("div");
    originalDiv.innerText = String(original).trim();
    originalDiv.style.color = "#9cdcfe";
    originalDiv.style.marginBottom = "6px";
    originalDiv.style.fontWeight = "500";

    const traduzidoDiv = document.createElement("div");
    traduzidoDiv.innerText = String(traduzido).trim();
    traduzidoDiv.style.color = "#d4d4d4"; 

    bloco.appendChild(originalDiv);
    bloco.appendChild(traduzidoDiv);
    contentDiv.appendChild(bloco);

    contentDiv.scrollTop = contentDiv.scrollHeight;
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
    chrome.storage.sync.get(['historyMode'], (result) => {
        const historyEnabled = result.historyMode;

        if (request.action === "onlySubtitles") {
            if (historyEnabled) {
                criarCaixaHistorico();
            } else {
                criarLegenda();
            }
            iniciarReconhecimento(request.lang || "fr-FR");
            sendResponse({ status: "Legenda iniciada" });
        }

        if (request.action === "startTranslation") {
            if (historyEnabled) {
                criarCaixaHistorico();
            } else {
                criarLegenda();
            }
            iniciarReconhecimentoComTraducao(request.lang || "fr-FR", request.translateFrom, request.translateTo);
            sendResponse({ status: "Tradução iniciada" });
        }

        if (request.action === "stopSubtitles") {
            removerLegenda();
            sendResponse({ status: "Legenda parada" });
        }
    });

    return true;
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

function limparHistorico() {
    const contentDiv = document.getElementById("conteudoLegenda");
    if (contentDiv) {
        contentDiv.innerText = "";
    }
    currentFinalTextForPage = "";
}

function criarCaixaHistorico() {
    if (legendaDiv) return;

    const ICON_TRASH = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
    const ICON_CLOSE = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    legendaDiv = document.createElement("div");
    legendaDiv.id = "legenda-container-moderno"; 
    legendaDiv.style.position = "fixed";
    legendaDiv.style.top = "10%";
    legendaDiv.style.left = "10%";
    legendaDiv.style.width = "450px";
    legendaDiv.style.height = "350px";
    legendaDiv.style.background = "rgba(30, 30, 30, 0.9)"; 
    legendaDiv.style.backdropFilter = "blur(10px)"; 
    legendaDiv.style.color = "#d4d4d4"; 
    legendaDiv.style.borderRadius = "12px";
    legendaDiv.style.zIndex = "9999";
    legendaDiv.style.resize = "both";
    legendaDiv.style.overflow = "hidden";
    legendaDiv.style.display = "flex";
    legendaDiv.style.flexDirection = "column";
    legendaDiv.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)"; 
    legendaDiv.style.fontFamily = "'Segoe UI', 'Roboto', sans-serif";
    legendaDiv.style.userSelect = "text";
    legendaDiv.style.border = "1px solid rgba(255, 255, 255, 0.1)"; 

    // --- Header ---
    const header = document.createElement("div");
    header.style.background = "#252526"; 
    header.style.padding = "8px 16px";
    header.style.cursor = "grab";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.flexShrink = "0";
    header.style.userSelect = "none";
    header.style.borderBottom = "1px solid #3e3e42";

    const title = document.createElement("span");
    title.innerText = "Live Subtitles";
    title.style.fontWeight = "600";
    title.style.fontSize = "15px";
    title.style.color = "#cccccc";

    const btnGroup = document.createElement("div");
    btnGroup.style.display = "flex";
    btnGroup.style.alignItems = "center";

    function createHeaderButton(svgIcon, tooltip) {
        const btn = document.createElement("button");
        btn.innerHTML = svgIcon;
        btn.title = tooltip;
        btn.style.background = "transparent";
        btn.style.border = "none";
        btn.style.color = "#cccccc";
        btn.style.cursor = "pointer";
        btn.style.marginLeft = "8px";
        btn.style.padding = "6px";
        btn.style.borderRadius = "5px";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.transition = "background-color 0.2s ease, color 0.2s ease";

        btn.onmouseover = () => {
            btn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            btn.style.color = '#fff';
        };
        btn.onmouseout = () => {
            btn.style.backgroundColor = 'transparent';
            btn.style.color = '#cccccc';
        };
        return btn;
    }

    const clearBtn = createHeaderButton(ICON_TRASH, "Clear history");
    clearBtn.onclick = () => limparHistorico();

    const closeBtn = createHeaderButton(ICON_CLOSE, "Close");
    closeBtn.onclick = () => removerLegenda();

    btnGroup.appendChild(clearBtn);
    btnGroup.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(btnGroup);

    const content = document.createElement("div");
    content.id = "conteudoLegenda";
    content.style.padding = "16px";
    content.style.overflowY = "auto";
    content.style.flexGrow = "1";
    content.style.fontSize = "15px";
    content.style.lineHeight = "1.5";
    content.style.whiteSpace = "pre-wrap";
    content.style.textAlign = "left"; 

    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        #conteudoLegenda::-webkit-scrollbar {
            width: 8px;
        }
        #conteudoLegenda::-webkit-scrollbar-track {
            background: transparent;
        }
        #conteudoLegenda::-webkit-scrollbar-thumb {
            background-color: #555;
            border-radius: 10px;
            border: 2px solid transparent;
            background-clip: content-box;
        }
        #conteudoLegenda::-webkit-scrollbar-thumb:hover {
            background-color: #777;
        }
    `;
    legendaDiv.appendChild(styleSheet);


    legendaDiv.appendChild(header);
    legendaDiv.appendChild(content);
    document.body.appendChild(legendaDiv);

    header.addEventListener("mousedown", onDragMouseDown);
}