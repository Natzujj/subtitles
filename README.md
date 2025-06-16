![Banner do projeto](./Banner.png)

# 🎙️ Subtitles Assistant

**Uma extensão simples para gerar legendas automáticas com reconhecimento de voz — ideal para vídeos, estudos de idiomas, transmissões ao vivo (lives) e muito mais.**

---

## 🧠 Por que esse projeto existe?

Enquanto aprendia novos idiomas, percebi a **ausência de uma ferramenta leve e funcional para gerar legendas em tempo real**, especialmente em vídeos e lives que não tinham legendas embutidas.

⚠️ **Não encontrei nenhuma solução simples, gratuita e funcional para esse caso específico**, então criei esta extensão para:

- Capturar áudio do sistema (ou do microfone)
- Transcrever em tempo real usando reconhecimento de voz
- Mostrar as legendas diretamente na tela
- Permitir a tradução automática se desejado

---

## 🧰 Tecnologias usadas

- **HTML + CSS + JavaScript**: Extensão leve, toda feita em código puro (Vanilla JS)
- **Web Speech API (Reconhecimento de voz)**: Nativa em navegadores Chromium
- **VB-CABLE**: Para redirecionar o áudio do sistema como se fosse um microfone

---

## 🖥️ Requisitos

### 🎧 1. Capturar áudio do sistema

Por padrão, o navegador só acessa **microfones**, não o som que sai do seu computador. Para resolver isso:

> 🔧 Instale o [VB-CABLE](https://vb-audio.com/Cable/)

Esse driver cria um **microfone virtual** que você pode configurar como entrada. Assim:

1. O som do sistema (como o som do vídeo ou live) vai para esse "microfone virtual"
2. O navegador escuta esse microfone e gera a legenda

---

## 🚀 Como usar

### 1. Instale o [VB-CABLE](https://vb-audio.com/Cable/)
- Siga o instalador
- Vá em **Configurações de Som** e defina:
  - Saída padrão: `VB-Cable Input`
  - Entrada padrão: `VB-Cable Output`

⚠️ Isso faz o som do sistema ser redirecionado como microfone.

---

### 2. Instale a extensão no Chrome (modo desenvolvedor)

1. Acesse `chrome://extensions/`
2. Ative o **Modo do desenvolvedor** (canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta do projeto

---

### 3. Use a extensão

- Abra o popup da extensão
- Selecione o idioma de entrada
- Clique em:
  - `Apenas Legenda`: Só transcreve o áudio
  - `Tradução`: Transcreve e traduz
  - `Parar`: Para a escuta

---

## 🌍 Idiomas suportados

- 🇺🇸 Inglês (en-US)
- 🇫🇷 Francês (fr-FR)
- 🇧🇷 Português (pt-BR)
- 🇪🇸 Espanhol (es-ES)

⚠️ Você pode adicionar mais idiomas facilmente modificando o seletor `<select>` no HTML.

---

## 🧪 Exemplos de uso

- Assistir vídeos estrangeiros sem legenda
- Praticar listening enquanto estuda idiomas
- Adicionar legendas automáticas em **lives** ou **aulas**
- Acessibilidade: ajudar pessoas com deficiência auditiva

---

## 📦 Estrutura do Projeto

```plaintext
subtitles-extension/
├── popup.html        # Interface do popup
├── popup.js          # Lógica de reconhecimento de voz e tradução
├── icon.png          # Ícone da extensão
├── manifest.json     # Manifesto da extensão Chrome
```

---

## ⚠️ Limitações

- Depende do reconhecimento de voz da Web Speech API (pode ter pequenas falhas)
- Tradução automática usa `SpeechRecognition.lang` e `Intl` (sem APIs externas)
- Não grava o áudio, apenas transcreve e exibe
- Chrome é o navegador recomendado

---