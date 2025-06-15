document.getElementById("onlySubtitles").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0 && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "startSubtitles" })
        .then(response => {
          console.log("Mensagem 'startSubtitles' enviada, resposta:", response);
        })
        .catch(error => {
          console.error("Erro ao enviar mensagem 'startSubtitles':", error.message);
        });
    } else {
      console.error("Não foi possível encontrar a aba ativa para enviar a mensagem 'startSubtitles'.");
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
