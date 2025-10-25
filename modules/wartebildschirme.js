const { BrowserWindow, screen } = require('electron');
const { safeLoadUrl } = require('./safeload');
let warteWindows = [];

function zeigeWartebildschirme() {
  const displays = screen.getAllDisplays();
  warteWindows = [];
  displays.forEach((display, idx) => {
    const monitorNum = idx + 1;
    const win = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      fullscreen: true,
      alwaysOnTop: true,
      backgroundColor: '#222',
      show: true,
     webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  webSecurity: true
}
    });

const html = `
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TTQuotes – Wartebildschirm</title>
  <link href="https://fonts.googleapis.com/css?family=Inter:400,600,700&display=swap" rel="stylesheet">
  <style>
    :root {
      --tt-black: #000000;
      --tt-green: #269947;
      --tt-white: #ffffff;
    }
    html, body {
      height: 100vh;
      width: 100vw;
      margin: 0;
      padding: 0;
    }
    body {
      background: var(--tt-black, #000);
      color: var(--tt-white, #fff);
      font-size: 21px;
      font-family: 'Inter', Arial, sans-serif;
      min-height: 100vh;
      min-width: 100vw;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }
    .waiting-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 72vh;
      width: 100%;
    }
    .waiting-logo {
      height: 220px;
      max-width: 420px;
      object-fit: contain;
      background: transparent;
      display: block;
      margin: 0 auto 44px auto;
      border-radius: 24px;
      filter: drop-shadow(0 1px 10px #26994755);
    }
    .waiting-status {
      font-size: 30px;
      color: var(--tt-green, #269947);
      font-weight: 700;
      letter-spacing: 0.09em;
      margin-bottom: 22px;
      text-align: center;
      text-shadow: 0 2px 16px #26994710;
    }
    .info-box {
      background: rgba(38, 153, 71, 0.1);
      border: 2px solid var(--tt-green, #269947);
      border-radius: 16px;
      padding: 32px 48px;
      margin-top: 48px;
      max-width: 800px;
      text-align: center;
    }
    .info-title {
      font-size: 28px;
      color: var(--tt-green, #269947);
      font-weight: 700;
      margin-bottom: 24px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .info-text {
      font-size: 20px;
      line-height: 1.6;
      color: #ffffff;
      margin-bottom: 16px;
    }
    .info-highlight {
      color: var(--tt-green, #269947);
      font-weight: 700;
    }
    .waiting-bar {
      width: 100px;
      height: 5px;
      border-radius: 4px;
      background: var(--tt-green, #269947);
      opacity: 0.3;
      margin-top: 10px;
      animation: pulseBar 2s infinite linear;
    }
    @keyframes pulseBar {
      0%,100%{ opacity: 0.3; }
      50%{ opacity: 1; }
    }
    .waiting-spinner {
      width: 48px;
      height: 48px;
      border: 6px solid #252725;
      border-top: 6px solid var(--tt-green, #269947);
      border-radius: 50%;
      animation: spin 1.1s linear infinite;
      margin: 44px auto 0 auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg);}
      100% { transform: rotate(360deg);}
    }
    .waiting-footer {
      margin-top: 42px;
      font-size: 14px;
      color: #aaa;
      opacity: 0.62;
      letter-spacing: 0.09em;
      text-align: center;
      width: 100%;
    }
    @media (max-width: 1000px) {
      .waiting-logo { height: 120px; max-width: 210px;}
      .waiting-status { font-size: 22px; }
      .waiting-footer { font-size: 12px;}
      .waiting-center { min-height: 60vh;}
    }
    .monitor-num {
      position: fixed;
      left: 2vw;
      bottom: 2vw;
      font-size: 7vw;
      font-weight: bold;
      color: #fff;
      opacity: 0.25;
      filter: drop-shadow(0 2px 8px #222);
      pointer-events: none;
      z-index: 999;
    }
  </style>
</head>
<body>
  <div class="waiting-center">
    <img class="waiting-logo"
      src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjEwODVweCIgaGVpZ2h0PSIyMzBweCIgc3R5bGU9InNoYXBlLXJlbmRlcmluZzpnZW9tZXRyaWNQcmVjaXNpb247IHRleHQtcmVuZGVyaW5nOmdlb21ldHJpY1ByZWNpc2lvbjsgaW1hZ2UtcmVuZGVyaW5nOm9wdGltaXplUXVhbGl0eTsgZmlsbC1ydWxlOmV2ZW5vZGQ7IGNsaXAtcnVsZTpldmVub2RkIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGc+PHBhdGggc3R5bGU9Im9wYWNpdHk6MSIgZmlsbD0iIzI0YWY0ZCIgZD0iTSA3MjcuNSw4Mi41IEMgNzI2LjE1Miw3OS40OTEgNzIzLjgxOSw3Ny44MjQ0IDcyMC41LDc3LjVDIDcyMC4zNCw3NS44MDA4IDcyMC41MDYsNzQuMTM0MSA3MjEsNzIuNUMgNzIxLjQxNCw3Mi45NTc0IDcyMS45MTQsNzMuMjkwNyA3MjIuNSw3My41QyA3MjMuNDI0LDcxLjYwOTUgNzI0Ljc1Nyw3MC4xMDk1IDcyNi41LDY5QyA3MjQuNDk0LDY4LjE1MTMgNzIzLjgyOCw2Ni45ODQ2IDcyNC41LDY1LjVDIDczMS4wODksNjYuODc3IDczNy43NTUsNjcuODc3IDc0NC41LDY4LjVDIDc0MS45NzMsNjkuMjEzNiA3MzkuNDczLDY5Ljg4MDMgNzM3LDcwLjVDIDczNi44MzMsNzAuODMzMyA3MzYuNjY3LDcxLjE2NjcgNzM2LjUsNzEuNUMgNzQxLjcyNSw3Mi44NjM1IDc0Ni43MjUsNzIuMzYzNSA3NTEuNSw3MEMgNzY1LjQ3NCw2OC44NzU3IDc3OS40NzQsNjguMjA5MSA3OTMuNSw2OEMgNzk0LjQxNiw2Ny43MjE2IDc5NS4wODIsNjcuMjIxNiA3OTUuNSw2Ni41QyA4MDAuOTMyLDY1LjMwNDkgODA2LjU5OSw2My40NzE2IDgxMi41LDYxQyA4MjEuMDc5LDU0Ljg2MDkgODIzLjkxMiw0Ni42OTQyIDgyMSwzNi41QyA4MTguMDU3LDI5LjYxNzggODE0Ljg5LDIyLjk1MTEgODExLjUsMTYuNUMgODI5LjY4MiwyMy41MjEgODQwLjM0OSwzNi42ODc3IDg0My41LDU2QyA4NDIuNDMxLDY0LjM5MTYgODM4Ljc2NCw3MS4zOTE2IDgzMi41LDc3QyA4MjUuMjc0LDgxLjc4MDEgODE3LjYwOCw4NS43ODAxIDgwOS41LDg5QyA3OTYuNjc0LDkzLjIyMSA3ODMuNjc0LDk2LjcyMSA3NzAuNSw5OS41QyA3NjMuMjAxLDk5LjYyNTQgNzYwLjAzNCw5NS45NTg4IDc2MSw4OC41QyA3NTcuMjEzLDg1LjA4NjEgNzUyLjcxMyw4My4yNTI3IDc0Ny41LDgzQyA3NDAuODQyLDgyLjUwMDQgNzM0LjE3NSw4Mi4zMzM3IDcyNy41LDgyLjUgWiIvPjwvZz48Zz48cGF0aCBzdHlsZT0ib3BhY2l0eToxIiBmaWxsPSIjMjZhZjRkIiBkPSJNIDc5NS41LDY2LjUgQyA3OTUuMDgyLDY3LjIyMTYgNzk0LjQxNiw2Ny43MjE2IDc5My41LDY4IDc3OS40NzQsNjguMjA5MSA3NjUuNDc0LDY4Ljg3NTcgNzUxLjUsNzBDIDc0Ni43MjUsNzIuMzYzNSA3NDEuNzI1LDcyLjg2MzUgNzM2LjUsNzEuNUMgNzM2LjY2Nyw3MS4xNjY3IDczNi44MzMsNzAuODMzMyA3MzcsNzAuNUMgNzM5LjQ3Myw2OS44ODAzIDc0MS45NzMsNjkuMjEzNiA3NDQuNSw2OC41QyA3MzcuNzU1LDY3Ljg3NyA3MzEuMDg5LDY2Ljg3NyA3MjQuNSw2NS41QyA3MjMuODI4LDY2Ljk4NDYgNzI0LjQ5NCw2OC4xNTEzIDcyNi41LDY5QyA3MjQuNzU3LDcwLjEwOTUgNzIzLjQyNCw3MS42MDk1IDcyMi41LDczLjVDIDcyMS45MTQsNzMuMjkwNyA3MjEuNDE0LDcyLjk1NzQgNzIxLDcyLjVDIDcyMC41MDYsNzQuMTM0MSA3MjAuMzQsNzUuODAwOCA3MjAuNSw3Ny41QyA3MjMuODE5LDc3LjgyNDQgNzI2LjE1Miw3OS40OTEgNzI3LjUsODIuNUMgNzIxLjQ1NSw4MS4yODgyIDcxNy45NTUsNzcuNjIxNSA3MTcsNzEuNUMgNzE2LjY4Nyw3NS45NjU0IDcxNC41MjEsNzkuMTMyMSA3MTAuNSw4MUMgNzAzLjY2NCw4Mi4wNjY5IDY5Ni44MzEsODIuOTAwMiA2OTAsODMuNUMgNjg1LjA4OCw4My4wMTE1IDY4MC4yNTUsODMuODQ0OSA2NzUuNSw4NkMgNjcyLjgzMSw4OS4zMzU2IDY3MS4zMzEsOTMuMTY4OSA2NzEsOTcuNUMgNjY4LjkyMyw5OC45NTc3IDY2Ni41OSw5OS42MjQzIDY2NCw5OS41QyA2NDQuMjAxLDk2LjE3NzYgNjI1LjM2Nyw5MC4wMTA5IDYwNy41LDgxQyA1OTQuNzA0LDczLjkwNTggNTg5LjUzOCw2My4wNzI1IDU5Miw0OC41QyA1OTcuMTE0LDMzLjU1MDEgNjA2Ljk0NywyMi44ODM0IDYyMS41LDE2LjVDIDYyMi41ODMsMTcuMzY1IDYyMi43NDksMTguMzY1IDYyMiwxOS41QyA2MTcuNTU1LDI1Ljg5MDQgNjE0LjA1NSwzMi43MjM3IDYxMS41LDQwQyA2MTEuNDQsNTMuMzQ2NSA2MTguNDQsNjEuNjc5OCA2MzIuNSw2NUMgNjQxLjU3Niw2Ni43ODYyIDY1MC43NDMsNjcuNjE5NSA2NjAsNjcuNUMgNjgyLjg5MSw2Ni4yMDc0IDcwNS41NTcsNjQuODc0MSA3MjgsNjMuNUMgNzUwLjE1Niw2Ny4yMTU5IDc3Mi42NTYsNjguMjE1OSA3OTUuNSw2Ni41IFoiLz48L2c+CjxnPjxwYXRoIHN0eWxlPSJvcGFjaXR5OjAuMjI0IiBmaWxsPSIjNGVhMTY4IiBkPSJNIDI3MS41LDEyMS41IEMgMjcwLjA0MSwxMjEuNTY3IDI2OC43MDgsMTIxLjIzNCAyNjcuNSwxMjAuNUMgMjY4LjE4OSwxMTkuMjI2IDI2OS4wMjMsMTE5LjIyNiAyNzAsMTIwLjVDIDI3MC40OTksMTE1LjUxMSAyNzAuNjY2LDExMC41MTEgMjcwLjUsMTA1LjVDIDI2NC43OTQsMTA1LjE3MSAyNTkuMTI4LDEwNS41MDUgMjUzLjUsMTA2LjVDIDI1My44NjMsMTA3LjE4MyAyNTQuMTk2LDEwNy44NSAyNTQuNSwxMDguNUMgMjUyLjYxNiwxMDguMjg4IDI1MS4yODMsMTA3LjI4OCAyNTAuNSwxMDUuNUMgMjU3LjQ2OCwxMDQuNTAzIDI2NC40NjgsMTA0LjE3IDI3MS41LDEwNC41QyAyNzEuNSwxMTAuMTY3IDI3MS41LDExNS44MzMgMjcxLjUsMTIxLjUgWiIvPjwvZz4KPGc+PHBhdGggc3R5bGU9Im9wYWNpdHk6MC45NDUiIGZpbGw9IiNmZWZlZmUiIGQ9Ik0gMTQyLjUsMTA1LjUgQyAxNzUuNSwxMDUuNSAyMDguNSwxMDUuNSAyNDEuNSwxMDUuNUMgMjQxLjUsMTExLjUgMjQxLjUsMTE3LjUgMjQxLjUsMTIzLjVDIDIyOC40OTYsMTIzLjMzMyAyMTUuNDk2LDEyMy41IDIwMi41LDEyNEMgMjAyLjE5MiwxNDIuMzk3IDIwMi41MjUsMTYwLjg5NyAyMDMuNSwxNzkuNUMgMTk2LjE5NywxODAuNDk3IDE4OC44NjMsMTgwLjgzMSAxODEuNSwxODAuNUMgMTgxLjUsMTYxLjUgMTgxLjUsMTQyLjUgMTgxLjUsMTIzLjVDIDE2OC41LDEyMy41IDE1NS41LDEyMy41IDE0Mi41LDEyMy41QyAxNDIuNSwxMTcuNSAxNDIuNSwxMTEuNSAxNDIuNSwxMDUuNSBaIi8+PC9nPgo8Zz48cGF0aCBzdHlsZT0ib3BhY2l0eTowLjk0MyIgZmlsbD0iI2ZlZmVmZSIgZD0iTSAyNzkuNSwxMDUuNSBDIDMwNi41MDIsMTA1LjMzMyAzMzMuNTAyLDEwNS41IDM2MC41LDEwNkMgMzc0LjMsMTA5LjEzNyAzODEuNjMzLDExNy44MDQgMzgyLjUsMTMyQyAzODEuMDY4LDE0My40MzEgMzc1LjA2OCwxNTEuNDMxIDM2NC41LDE1NkMgMzQzLjU2NywxNTcuNDY2IDMyMi41NjcsMTU3Ljk2NiAzMDEuNSwxNTcuNUMgMzAxLjUsMTY1LjE2NyAzMDEuNSwxNzIuODMzIDMwMS41LDE4MC41QyAyOTQuMTY3LDE4MC41IDI4Ni44MzMsMTgwLjUgMjc5LjUsMTgwLjVDIDI3OS41LDE1NS41IDI3OS41LDEzMC41IDI3OS41LDEwNS41IFogTSAzMDEuNSwxMjMuNSBDIDMxOS41MDMsMTIzLjMzMyAzMzcuNTAzLDEyMy41IDM1NS41LDEyNEMgMzYwLjY4OSwxMjYuOTEzIDM2MS44NTYsMTMxLjA4IDM1OSwxMzYuNUMgMzU4LjA5NywxMzcuNzAxIDM1Ni45MzEsMTM4LjUzNSAzNTUuNSwxMzlDIDMzNy41MDMsMTM5LjUgMzE5LjUwMywxMzkuNjY3IDMwMS41LDEzOS41QyAzMDEuNSwxMzQuMTY3IDMwMS41LDEyOC44MzMgMzAxLjUsMTIzLjUgWiIvPjwvZz4KPGc+PHBhdGggc3R5bGU9Im9wYWNpdHk6MC45MzYiIGZpbGw9IiNmZWZlZmUiIGQ9Ik0gMzg2LjUsMTA1LjUgQyA0MTkuMTY3LDEwNS41IDQ1MS44MzMsMTA1LjUgNDg0LjUsMTA1LjVDIDQ4NC41LDExMS41IDQ4NC41LDExNy41IDQ4NC41LDEyMy41QyA0NzEuODMzLDEyMy41IDQ1OS4xNjcsMTIzLjUgNDQ2LjUsMTIzLjVDIDQ0Ni41LDE0Mi41IDQ0Ni41LDE2MS41IDQ0Ni41LDE4MC41QyA0MzkuMTY3LDE4MC41IDQzMS44MzMsMTgwLjUgNDI0LjUsMTgwLjVDIDQyNC41LDE2MS41IDQyNC41LDE0Mi41IDQyNC41LDEyMy41QyA0MTEuODMzLDEyMy41IDM5OS4xNjcsMTIzLjUgMzg2LjUsMTIzLjVDIDM4Ni41LDExNy41IDM4Ni41LDExMS41IDM4Ni41LDEwNS41IFoiLz48L2c+CjxnPjxwYXRoIHN0eWxlPSJvcGFjaXR5OjAuOTQxIiBmaWxsPSIjZmVmZWZlIiBkPSJNIDUxMS41LDEwNS41IEMgNTM1LjE2OSwxMDUuMzMzIDU1OC44MzYsMTA1LjUgNTgyLjUsMTA2QyA1OTIuMTAzLDEwOC42MDMgNTk3LjkzNiwxMTQuNzY5IDYwMCwxMjQuNUMgNjAwLjY2NywxMzYuODMzIDYwMC42NjcsMTQ5LjE2NyA2MDAsMTYxLjVDIDU5Ny44NiwxNzEuNjQgNTkxLjY5NCwxNzcuODA2IDU4MS41LDE4MEMgNTU4LjE2NywxODAuNjY3IDUzNC44MzMsMTgwLjY2NyA1MTEuNSwxODBDIDUwMS43NzgsMTc3Ljk0NSA0OTUuNjExLDE3Mi4xMTIgNDkzLDE2Mi41QyA0OTIuMzMzLDE0OS44MzMgNDkyLjMzMywxMzcuMTY3IDQ5MywxMjQuNUMgNDk1LjM0OCwxMTQuMzIgNTAxLjUxNSwxMDcuOTg3IDUxMS41LDEwNS41IFogTSA1MTkuNSwxMjMuNSBDIDUzOC4yNiwxMjMuMDI2IDU1Ni45MjcsMTIzLjUyNiA1NzUuNSwxMjVDIDU3Ni43MDEsMTI1LjkwMyA1NzcuNTM1LDEyNy4wNjkgNTc4LDEyOC41QyA1NzguMTY3LDEzMi4xNjcgNTc4LjMzMywxMzUuODMzIDU3OC41LDEzOS41QyA1NzguMDA4LDE0NC45MTIgNTc4LjAwOCwxNTAuMjQ1IDU3OC41LDE1NS41QyA1NzcuNzAyLDE1OC43OTcgNTc1LjcwMiwxNjAuOTY0IDU3Mi41LDE2MkMgNTU0LjEwMSwxNjIuOTYgNTM1Ljc2OCwxNjIuNjI3IDUxNy41LDE2MUMgNTE2LjU0LDE1OS41ODEgNTE1LjcwNywxNTguMDgxIDUxNSwxNTYuNUMgNTE0LjMzMywxNDcuNSA1MTQuMzMzLDEzOC41IDUxNSwxMjkuNUMgNTE2LjI3NywxMjcuMjUzIDUxNy43NzcsMTI1LjI1MyA1MTkuNSwxMjMuNSBaIi8+PC9nPgo8Zz48cGF0aCBzdHlsZT0ib3BhY2l0eTowLjk1IiBmaWxsPSIjZmVmZWZlIiBkPSJNIDYwOC41LDEwNS41IEMgNjM0LjgzNSwxMDUuMzMzIDY2MS4xNjksMTA1LjUgNjg3LjUsMTA2QyA3MDYuMTY4LDExMS4zNDMgNzEyLjMzNCwxMjMuMTc2IDcwNiwxNDEuNUMgNzAxLjAzOCwxNDguMDY0IDY5NC41MzgsMTUyLjIzMSA2ODYuNSwxNTRDIDY5NC4zNTIsMTYyLjM1MSA3MDIuMDE4LDE3MC44NTEgNzA5LjUsMTc5LjVDIDcwMS4xODcsMTgwLjY2NSA2OTIuODUzLDE4MC44MzIgNjg0LjUsMTgwQyA2NzIuNjA5LDE2NS43IDY2MC42MDksMTUxLjUzNCA2NDguNSwxMzcuNUMgNjU5LjgxOSwxMzYuNjY4IDY3MS4xNTIsMTM2LjE2OCA2ODIuNSwxMzZDIDY4OC42NjEsMTMyLjUwOSA2ODguOTk0LDEyOC41MDkgNjgzLjUsMTI0QyA2NjUuODM2LDEyMy41IDY0OC4xNywxMjMuMzMzIDYzMC41LDEyMy41QyA2MzAuNSwxNDIuNSA2MzAuNSwxNjEuNSA2MzAuNSwxODAuNUMgNjIzLjE2NywxODAuNSA2MTUuODMzLDE4MC41IDYwOC41LDE4MC41QyA2MDguNSwxNTUuNSA2MDguNSwxMzAuNSA2MDguNSwxMDUuNSBaIi8+PC9nPgo8Zz48cGF0aCBzdHlsZT0ib3BhY2l0eTowLjk0MyIgZmlsbD0iI2ZlZmVmZSIgZD0iTSA3NDguNSwxMDUuNSBDIDc3NC4xNjcsMTA1LjUgNzk5LjgzMywxMDUuNSA4MjUuNSwxMDUuNUMgODI1LjUsMTMwLjUgODI1LjUsMTU1LjUgODI1LjUsMTgwLjVDIDgxOC4xNjcsMTgwLjUgODEwLjgzMywxODAuNSA4MDMuNSwxODAuNUMgODAzLjUsMTYxLjUgODAzLjUsMTQyLjUgODAzLjUsMTIzLjVDIDc4NS43MzksMTIzLjAyNyA3NjguMDczLDEyMy41MjcgNzUwLjUsMTI1QyA3NDguNTIyLDEyNy40OTcgNzQ4LjAyMiwxMzAuMzMxIDc0OSwxMzMuNUMgNzQ5LjkwMywxMzQuNzAxIDc1MS4wNjksMTM1LjUzNSA3NTIuNSwxMzZDIDc2My41MTUsMTM2LjE2OCA3NzQuNTE1LDEzNi42NjggNzg1LjUsMTM3LjVDIDc3My43MTQsMTUxLjU3NSA3NjIuMDQ3LDE2NS43NDEgNzUwLjUsMTgwQyA3NDIuMTQ3LDE4MC44MzIgNzMzLjgxMywxODAuNjY1IDcyNS41LDE3OS41QyA3MzIuOTgyLDE3MC44NTEgNzQwLjY0OCwxNjIuMzUxIDc0OC41LDE1NEMgNzI4Ljk5NywxNDguNTE2IDcyMi44MywxMzYuMzQ5IDczMCwxMTcuNUMgNzM0Ljc0MywxMTEuMDYgNzQwLjkxLDEwNy4wNiA3NDguNSwxMDUuNSBaIi8+PC9nPgo8Zz48cGF0aCBzdHlsZT0ib3BhY2l0eTowLjk1NCIgZmlsbD0iI2ZlZmVmZSIgZD0iTSA4NTMuNSwxMDUuNSBDIDg3Ny41MDIsMTA1LjMzMyA5MDEuNTAyLDEwNS41IDkyNS41LDEwNkMgOTMzLjUwMiwxMDguMDAzIDkzOS4wMDIsMTEyLjgzNiA5NDIsMTIwLjVDIDk0Mi42NjcsMTM1LjUgOTQyLjY2NywxNTAuNSA5NDIsMTY1LjVDIDkzOC40NDMsMTczLjAzNSA5MzIuNjEsMTc3Ljg2OCA5MjQuNSwxODBDIDkwMS4xNjcsMTgwLjY2NyA4NzcuODMzLDE4MC42NjcgODU0LjUsMTgwQyA4NDMuMjA4LDE3Ny4zNzkgODM2Ljg3NCwxNzAuMzc5IDgzNS41LDE1OUMgODM1LjIzNywxNDYuMzQ2IDgzNS43MzcsMTMzLjUxMyA4MzcsMTIwLjVDIDg0MC4xOSwxMTIuODQzIDg0NS42OSwxMDcuODQzIDg1My41LDEwNS41IFogTSA4NjIuNSwxMjMuNSBDIDg4MS4yNiwxMjMuMDI2IDg5OS45MjcsMTIzLjUyNiA5MTguNSwxMjVDIDkxOS40NiwxMjYuNDE5IDkyMC4yOTMsMTI3LjkxOSA5MjEsMTI5LjVDIDkyMS4yODgsMTM4LjkwNiA5MjEuMjg4LDE0OC4yMzkgOTIxLDE1Ny41QyA5MTkuNDU3LDE1OS4zNzggOTE3LjYyNCwxNjAuODc4IDkxNS41LDE2MkMgODk3LjEwMSwxNjIuOTYgODc4Ljc2OCwxNjIuNjI3IDg2MC41LDE2MUMgODU5LjU0LDE1OS41ODEgODU4LjcwNywxNTguMDgxIDg1OCwxNTYuNUMgODU3LjMzMywxNDcuNSA4NTcuMzMzLDEzOC41IDg1OCwxMjkuNUMgODU4LjU5OSwxMjYuNzQ2IDg2MC4wOTksMTI0Ljc0NiA4NjIuNSwxMjMuNSBaIi8+PC9nPgo8Zz48cGF0aCBzdHlsZT0ib3BhY2l0eToxIiBmaWxsPSIjMmJhZDUxIiBkPSJNIDI2Ny41LDEyMC41IEMgMjY3LjE2NywxMjAuNSAyNjYuODMzLDEyMC41IDI2Ni41LDEyMC41QyAyNjIuNSwxMTYuNSAyNTguNSwxMTIuNSAyNTQuNSwxMDguNUMgMjU0LjE5NiwxMDcuODUgMjUzLjg2MywxMDcuMTgzIDI1My41LDEwNi41QyAyNTkuMTI4LDEwNS41MDUgMjY0Ljc5NCwxMDUuMTcxIDI3MC41LDEwNS41QyAyNzAuNjY2LDExMC41MTEgMjcwLjQ5OSwxMTUuNTExIDI3MCwxMjAuNUMgMjY5LjAyMywxMTkuMjI2IDI2OC4xODksMTE5LjIyNiAyNjcuNSwxMjAuNSBaIi8+PC9nPgo8Zz48cGF0aCBzdHlsZT0ib3BhY2l0eTowLjkzMSIgZmlsbD0iI2ZkZmVmZCIgZD0iTSAyNjYuNSwxMjAuNSBDIDI2Ni44MzMsMTIwLjUgMjY3LjE2NywxMjAuNSAyNjcuNSwxMjAuNUMgMjY4LjcwOCwxMjEuMjM0IDI3MC4wNDEsMTIxLjU2NyAyNzEuNSwxMjEuNUMgMjcxLjUsMTQxLjE2NyAyNzEuNSwxNjAuODMzIDI3MS41LDE4MC41QyAyNjQuMTY3LDE4MC41IDI1Ni44MzMsMTgwLjUgMjQ5LjUsMTgwLjVDIDI0OS41LDE2MC44MzMgMjQ5LjUsMTQxLjE2NyAyNDkuNSwxMjEuNUMgMjU1LjM1OCwxMjEuODIyIDI2MS4wMjUsMTIxLjQ4OSAyNjYuNSwxMjAuNSBaIi8+PC9nPgo8Zz48cGF0aCBzdHlsZT0ib3BhY2l0eTowLjI4MiIgZmlsbD0iIzU0YjA3MCIgZD0iTSA3NTAuNSwxODkuNSBDIDc1MC41LDE4OC41IDc1MC41LDE4Ny41IDc1MC41LDE4Ni41QyA3MjcuNDc1LDE4NS44NDQgNzA0LjgwOSwxODYuNTEgNjgyLjUsMTg4LjVDIDY4MS41OTYsMTg3Ljc5MSA2ODEuMjYzLDE4Ni43OTEgNjgxLjUsMTg1LjVDIDcwNS41MDIsMTg1LjMzMyA3MjkuNTAyLDE4NS41IDc1My41LDE4NkMgNzUyLjgzNywxODcuNTE4IDc1MS44MzcsMTg4LjY4NSA3NTAuNSwxODkuNSBaIi8+PC9nPgo8Zz48cGF0aCBzdHlsZT0ib3BhY2l0eToxIiBmaWxsPSIjMjNhZjRkIiBkPSJNIDc1MC41LDE4OS41IEMgNzQ2LjA5NiwxOTYuMjkzIDc0MC43NjMsMjAyLjI5MyA3MzQuNSwyMDcuNUMgNzMyLjU2NywyMDcuNzI5IDczMC45LDIwOC41NjIgNzI5LjUsMjEwQyA3MjIuMTY3LDIxMC4zMzMgNzE0LjgzMywyMTAuNjY3IDcwNy41LDIxMUMgNzA2LjU4NCwyMTEuMjc4IDcwNS45MTgsMjExLjc3OCA3MDUuNSwyMTIuNUMgNjk2LjUxNCwyMDUuODQ2IDY4OC44NDcsMTk3Ljg0NiA2ODIuNSwxODguNUMgNzA0LjgwOSwxODYuNTEgNzI3LjQ3NSwxODUuODQ0IDc1MC41LDE4Ni41QyA3NTAuNSwxODcuNSA3NTAuNSwxODguNSA3NTAuNSwxODkuNSBaIi8+PC9nPgo8Zz48cGF0aCBzdHlsZT0ib3BhY2l0eT0wLjk2MSIgZmlsbD0iIzM2OWM1NiIgZD0iTSA3MzQuNSwyMDcuNSBDIDczMy4zNTgsMjA5LjQzMyA3MzEuNjkyLDIxMC45MzMgNzI5LjUsMjEyQyA3MjEuNTA3LDIxMi41IDcxMy41MDcsMjEyLjY2NiA3MDUuNSwyMTIuNUMgNzA1LjkxOCwyMTEuNzc4IDcwNi41ODQsMjExLjI3OCA3MDcuNSwyMTFDIDcxNC44MzMsMjEwLjY2NyA3MjIuMTY3LDIxMC4zMzMgNzI5LjUsMjEwQyA3MzAuOSwyMDguNTYyIDczMi41NjcsMjA3LjcyOSA3MzQuNSwyMDcuNSBaIi8+PC9nPgo8L3N2Zz4="
      alt="Logo">
    <div class="waiting-status">System wird konfiguriert</div>
    <div class="waiting-bar"></div>
    
    <div class="info-box">
      <div class="info-title">⚠️ Konfiguration erforderlich</div>
      <div class="info-text">
        Dieser Monitor (Nr. <span class="info-highlight">${monitorNum}</span>) wurde noch nicht eingerichtet.
      </div>
      <div class="info-text">
        Bitte kontaktieren Sie den <span class="info-highlight">Support</span>, um die gewünschten<br>
        Einstellungen für diesen Bildschirm festzulegen.
      </div>
    </div>
  </div>
  <div class="monitor-num">${monitorNum}</div>
  <div class="waiting-footer">Torrotec Live Quotes &copy; 2025 – Tiptorro Sportwetten</div>
</body>
</html>
`;

    safeLoadUrl(win,'data:text/html;charset=utf-8,' + encodeURIComponent(html));
    warteWindows.push(win);
  });
}

function schliesseWartebildschirme() {
  warteWindows.forEach(win => {
    if (!win.isDestroyed()) win.close();
  });
  warteWindows = [];
}

module.exports = {
  zeigeWartebildschirme,
  schliesseWartebildschirme
};

