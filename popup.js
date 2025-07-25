document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["selectedLang", "historyMode"], (result) => {
    if (result.selectedLang) {
      document.getElementById("langSelect").value = result.selectedLang;
    }

    if (typeof result.historyMode === "boolean") {
      document.getElementById("toggleHistory").checked = result.historyMode;
    }
  });
});

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

document.getElementById("translation").addEventListener("click", () => {
  const lang = document.getElementById("langSelect").value;
  const fromLang = lang.split("-")[0];
  const toLang = "pt";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0 && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "startTranslation",
        lang: lang,
        translateFrom: fromLang,
        translateTo: toLang
      }).then(response => {
        console.log("Tradução iniciada:", response);
      }).catch(error => {
        console.error("Erro ao iniciar tradução:", error.message);
      });
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
  const panel = document.getElementById("configPanel");
  panel.classList.toggle("hidden");
});

document.getElementById("langSelect").addEventListener("change", (e) => {
  const lang = e.target.value;
  chrome.storage.sync.set({ selectedLang: lang }, () => {
    console.log("Idioma salvo:", lang);
  });
});

document.getElementById("toggleHistory").addEventListener("change", (e) => {
  const isEnabled = e.target.checked;
  chrome.storage.sync.set({ historyMode: isEnabled }, () => {
    console.log("Histórico ativado?", isEnabled);
  });
});
