document.getElementById("onlySubtitles").addEventListener("click", () => {
  const lang = document.getElementById("langSelect").value;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0 && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "onlySubtitles", lang: lang })
        .then(response => {
          console.log("Mensagem 'onlySubtitles' enviada com idioma:", lang, "Resposta:", response);
        })
        .catch(error => {
          console.error("Erro ao enviar mensagem 'onlySubtitles':", error.message);
        });
    } else {
      console.error("Não foi possível encontrar a aba ativa para enviar a mensagem 'onlySubtitles'.");
    }
  });
});

document.getElementById("stop").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0 && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "stopSubtitles" })
        .then(response => {
          console.log("Mensagem 'stopSubtitles' enviada, resposta:", response);
        })
        .catch(error => {
          console.error("Erro ao enviar mensagem 'stopSubtitles':", error.message);
        });
    } else {
      console.error("Não foi possível encontrar a aba ativa para enviar a mensagem 'stopSubtitles'.");
    }
  });
});

document.getElementById("toggleConfig").addEventListener("click", () => {
  const select = document.getElementById("langSelect");
  select.classList.toggle("hidden");
});