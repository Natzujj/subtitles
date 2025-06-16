![Project Banner](./Banner.png)

## 🇺🇸 [Read this in Portuguese](./README.pt-br.md)

# 🎙️ Close Captioner 🎙️

**A simple browser extension for real-time speech recognition subtitles — perfect for videos, language learning, livestreams, and more.**

---

## Why does this project exist?

While learning new languages, I noticed the **lack of a lightweight, functional tool for generating live subtitles**, especially for videos and livestreams that don't offer captions.

**I couldn’t find a simple, free, and reliable solution for this specific use case**, so I created this extension to:

- Capture system audio (or microphone input)  
- Transcribe it in real time using speech recognition  
- Display subtitles directly on screen  
- Optionally offer automatic translation  

---

## Technologies Used

- **HTML + CSS + JavaScript** — Lightweight extension built with plain Vanilla JS  
- **Web Speech API** — Native in Chromium browsers for speech recognition  
- **VB-CABLE** — Routes system audio as microphone input  

---

## 🖥️ Requirements 🖥️

### 1. Capture System Audio

By default, browsers can only access **microphones**, not system audio. To work around this:

- Install [VB-CABLE](https://vb-audio.com/Cable/)

This driver creates a **virtual microphone**. Here's how it works:

1. System audio (e.g., video or livestream sound) is redirected into this virtual mic  
2. The browser listens to the mic and generates subtitles  

---

## How to Use

### 1. Install [VB-CABLE](https://vb-audio.com/Cable/)

- Run the installer  
- Go to your **Sound Settings** and set:  
  - Default output: `VB-Cable Input`  
  - Default input: `VB-Cable Output`

This reroutes system audio as microphone input.

---

### 2. Install the Extension in Chrome (Developer Mode)

1. Go to `chrome://extensions/`  
2. Enable **Developer Mode** (top-right corner)  
3. Click **“Load unpacked”**  
4. Select the project folder  

---

### 3. Use the Extension

- Open the extension popup  
- Choose the input language  
- Click:  
  - `Only Subtitles` — Only transcribes audio  
  - `Translate` — Transcribes and translates  
  - `Stop` — Stops listening  

---

## Supported Languages

- 🇺🇸 English (`en-US`)  
- 🇫🇷 French (`fr-FR`)  
- 🇧🇷 Portuguese (`pt-BR`)  
- 🇪🇸 Spanish (`es-ES`)

You can easily add more languages by editing the `<select>` element in `popup.html`.

---

## Use Cases

- Watch foreign videos without subtitles  
- Practice listening comprehension while studying languages  
- Add real-time subtitles to **livestreams** or **online classes**  
- Improve accessibility for users with hearing impairments  

---

## Project Structure

```plaintext
subtitles-extension/
├── popup.html        # Popup interface
├── popup.js          # Speech recognition and translation logic
├── icon.png          # Extension icon
├── manifest.json     # Chrome extension manifest
```

---

## Limitations

- Depends on the Web Speech API for speech recognition (may have occasional misinterpretations)
- Translation uses built-in browser features `SpeechRecognition.lang, Intl` — no external APIs
- Does **not** record audio — only transcribes and displays subtitles
- Chrome is the recommended browser

---