"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PrototypeShell from "../_components/prototype-shell";
import NotificationPreview from "../_components/notification-preview";

const DEFAULT_BACKGROUND = "/images/iphone-generic-v4.png";

const INITIAL_VALUES = {
  weekday: "Thu", day: "17", month: "", alarmTime: "05:30", mainTime: "13:25",
  title: "Transferência recebida", message: "Você recebeu uma transferência de R$427,80 de SHPAY.",
  notificationTime: "agora", notificationPosition: "below-clock", notificationX: 50, notificationY: 48,
};

const INITIAL_CLOCK = { font: "Arial Narrow", weight: 200, color: "#ffffff", size: 7.5, spacing: -0.1 };

const svgData = (markup) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
const letterIcon = (letters, background, foreground = "#ffffff") => svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="${background}"/><text x="64" y="76" text-anchor="middle" fill="${foreground}" font-family="Arial,sans-serif" font-size="44" font-weight="800">${letters}</text></svg>`);
const TIKTOK_SHOP_ICON = svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#080808"/><path d="M32 49h64l-5 57H37z" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><path d="M46 51c0-14 7-24 18-24s18 10 18 24" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M70 42v32c0 12-8 19-18 19-8 0-14-5-14-12s6-13 15-13c3 0 5 1 7 2V41h10c2 8 8 13 17 14v10c-7 0-13-2-17-6" fill="none" stroke="#25f4ee" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M73 39v32c0 12-8 19-18 19-5 0-10-2-12-6" fill="none" stroke="#fe2c55" stroke-width="5" stroke-linecap="round"/></svg>`);

const REFERENCE_ICONS = Array.from({ length: 24 }, (_, index) => ({
  name: `Logo da galeria ${index + 1}`,
  src: `/images/logos/gallery-${String(index + 1).padStart(2, "0")}.png`,
}));

const BUILT_IN_ICONS = [
  { name: "Notivy", src: "/images/nu-notification-icon-v1.png" }, { name: "TikTok Shop", src: TIKTOK_SHOP_ICON },
  { name: "Inter", src: letterIcon("in", "#ff6a00") }, { name: "Nubank", src: letterIcon("nu", "#820ad1") },
  { name: "Itaú", src: letterIcon("itaú", "#ff7900", "#102a83") }, { name: "Shopee", src: letterIcon("S", "#ee4d2d") },
  { name: "WhatsApp", src: letterIcon("W", "#25d366") }, { name: "Instagram", src: letterIcon("◎", "#c13584") },
  { name: "Gmail", src: letterIcon("M", "#ffffff", "#ea4335") }, { name: "iFood", src: letterIcon("iF", "#ea1d2c") },
  { name: "PicPay", src: letterIcon("P", "#21c25e") }, { name: "Mercado Pago", src: letterIcon("MP", "#009ee3") },
  ...REFERENCE_ICONS,
];

const loadImage = (source) => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = source; });
const canvasToPng = (canvas) => new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG vazio")), "image/png"));

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath(); context.moveTo(x + r, y); context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r); context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r); context.closePath();
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = text.split(/\s+/); let line = ""; let lineNumber = 0;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, y + lineNumber * lineHeight); line = word; lineNumber += 1;
      if (lineNumber === maxLines - 1) break;
    } else line = candidate;
  }
  if (lineNumber < maxLines) context.fillText(line, x, y + lineNumber * lineHeight);
}

export default function EditorPage() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [clock, setClock] = useState(INITIAL_CLOCK);
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_BACKGROUND);
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState("");
  const [appIcon, setAppIcon] = useState("/images/nu-notification-icon-v1.png");
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [exportMessage, setExportMessage] = useState("A imagem será baixada em PNG com 1080 × 1920 px.");
  const [downloadFile, setDownloadFile] = useState(null);

  useEffect(() => () => { if (customBackgroundUrl) URL.revokeObjectURL(customBackgroundUrl); }, [customBackgroundUrl]);
  useEffect(() => () => { if (customIconUrl) URL.revokeObjectURL(customIconUrl); }, [customIconUrl]);
  useEffect(() => () => { if (downloadFile?.url) URL.revokeObjectURL(downloadFile.url); }, [downloadFile]);

  const updateValue = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const updateClock = (field) => (event) => setClock((current) => ({ ...current, [field]: event.target.value }));
  const chooseBackground = (event) => { const file = event.target.files?.[0]; if (!file) return; const nextUrl = URL.createObjectURL(file); setCustomBackgroundUrl(nextUrl); setBackgroundUrl(nextUrl); };
  const chooseIcon = (event) => { const file = event.target.files?.[0]; if (!file) return; const nextUrl = URL.createObjectURL(file); setCustomIconUrl(nextUrl); setAppIcon(nextUrl); };
  const selectBuiltInIcon = (source) => { setCustomIconUrl(""); setAppIcon(source); };
  const setFreePosition = ({ x, y }) => setValues((current) => ({ ...current, notificationPosition: "free", notificationX: x, notificationY: y }));

  const resetEditor = () => {
    setValues(INITIAL_VALUES); setClock(INITIAL_CLOCK); setBackgroundUrl(DEFAULT_BACKGROUND); setCustomBackgroundUrl("");
    setAppIcon("/images/nu-notification-icon-v1.png"); setCustomIconUrl(""); setDownloadFile(null); setExportMessage("A imagem será baixada em PNG com 1080 × 1920 px.");
  };

  const downloadPng = async () => {
    setExportMessage("Preparando a imagem...");
    try {
      const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1920;
      const context = canvas.getContext("2d"); const wallpaper = await loadImage(backgroundUrl);
      const scale = Math.max(canvas.width / wallpaper.width, canvas.height / wallpaper.height);
      const drawWidth = wallpaper.width * scale; const drawHeight = wallpaper.height * scale;
      context.drawImage(wallpaper, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
      const shade = context.createLinearGradient(0, 0, 0, canvas.height); shade.addColorStop(0, "rgba(0,0,0,.2)"); shade.addColorStop(.55, "rgba(0,0,0,0)"); shade.addColorStop(1, "rgba(0,0,0,.18)");
      context.fillStyle = shade; context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = "#000"; roundedRect(context, 400, 30, 280, 82, 42); context.fill();
      context.fillStyle = "#fff"; context.font = "500 42px Arial"; context.textAlign = "left"; context.fillText("NuCel", 68, 86);
      context.textAlign = "right"; context.fillText("▮▮▮▮  4G  ▰", 1012, 86);
      context.textAlign = "center"; context.fillStyle = clock.color; context.font = "500 58px Arial";
      context.fillText(`${values.weekday} ${values.day}${values.month ? ` ${values.month}` : ""}  ◷ ${values.alarmTime}`, 540, 280);
      context.font = `${clock.weight} ${Number(clock.size) * 48}px "${clock.font}"`;
      if ("letterSpacing" in context) context.letterSpacing = `${Number(clock.spacing) * 48}px`;
      context.fillText(values.mainTime, 540, 685); if ("letterSpacing" in context) context.letterSpacing = "0px";

      const presetY = { "below-clock": 40, middle: 59, lower: 70 }; const isFree = values.notificationPosition === "free";
      const width = isFree ? 850 : 1010; const height = 190; const centerX = (isFree ? Number(values.notificationX) : 50) * 10.8;
      const left = Math.max(35, Math.min(1080 - width - 35, centerX - width / 2));
      const top = isFree ? Number(values.notificationY) * 19.2 - height / 2 : presetY[values.notificationPosition] * 19.2;
      context.fillStyle = "rgba(244,244,244,.48)"; context.strokeStyle = "rgba(255,255,255,.65)"; context.lineWidth = 3;
      roundedRect(context, left, top, width, height, 68); context.fill(); context.stroke();

      const icon = await loadImage(appIcon); roundedRect(context, left + 28, top + 31, 128, 128, 30); context.save(); context.clip();
      context.drawImage(icon, left + 28, top + 31, 128, 128); context.restore();
      const textX = left + 182; const timeWidth = 135; context.fillStyle = "#111"; context.textAlign = "left";
      context.font = "700 45px Arial"; context.fillText(values.title, textX, top + 68, width - 220 - timeWidth);
      context.font = "400 37px Arial"; drawWrappedText(context, values.message, textX, top + 116, width - 220, 43, 2);
      context.fillStyle = "#4a4a4a"; context.textAlign = "right"; context.font = "400 34px Arial"; context.fillText(values.notificationTime, left + width - 35, top + 65);

      context.fillStyle = "rgba(20,20,20,.58)"; roundedRect(context, 90, 1670, 142, 142, 71); context.fill(); roundedRect(context, 848, 1670, 142, 142, 71); context.fill();
      context.fillStyle = "#fff"; context.textAlign = "center"; context.font = "64px Arial"; context.fillText("⚡", 161, 1765); context.fillText("●", 919, 1765);
      roundedRect(context, 355, 1872, 370, 16, 8); context.fill();

      const blob = await canvasToPng(canvas);
      const filename = `notivy-${Date.now()}.png`;
      const url = URL.createObjectURL(blob);
      setDownloadFile({ url, filename });

      const file = new File([blob], filename, { type: "image/png" });
      const canShareFile = typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
      if (canShareFile && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        try {
          await navigator.share({ files: [file], title: "Imagem Notivy" });
          setExportMessage("Imagem pronta. Escolha salvar em Fotos ou Arquivos no menu do telefone.");
        } catch (shareError) {
          if (shareError?.name === "AbortError") setExportMessage("Imagem pronta. Use o link abaixo para baixar ou abrir o PNG.");
          else throw shareError;
        }
      } else {
        const link = document.createElement("a"); link.download = filename; link.href = url; link.hidden = true;
        document.body.appendChild(link); link.click(); link.remove();
        setExportMessage("Imagem baixada com sucesso em 1080 × 1920 px.");
      }
    } catch { setExportMessage("Não foi possível gerar a imagem. Tente novamente."); }
  };

  return <PrototypeShell current="/editor">
    <Link className="text-link back-link" href="/painel">← Voltar aos meus visuais</Link>
    <div className="page-heading"><div><p className="eyebrow">Editor de demonstração</p><h1>Seu novo visual</h1><p>Altere os campos e acompanhe o resultado na tela.</p></div><span className="badge">Edição ao vivo</span></div>
    <p className="notice" id="editor-note">O editor está liberado para testes. As alterações aparecem imediatamente no telefone.</p>
    <div className="editor-grid">
      <section className="panel preview-panel" aria-labelledby="preview-title">
        <div className="section-heading"><h2 id="preview-title">Preview</h2><span className="badge">1080 × 1920</span></div>
        <NotificationPreview backgroundUrl={backgroundUrl} appIcon={appIcon} title={values.title} message={values.message} notificationTime={values.notificationTime} notificationPosition={values.notificationPosition} notificationX={Number(values.notificationX)} notificationY={Number(values.notificationY)} onNotificationMove={setFreePosition} editableLockScreen renderControls weekday={values.weekday} day={values.day} month={values.month} alarmTime={values.alarmTime} mainTime={values.mainTime} clockFont={clock.font} clockWeight={Number(clock.weight)} clockColor={clock.color} clockSize={Number(clock.size)} clockSpacing={Number(clock.spacing)} />
        {values.notificationPosition === "free" && <p className="preview-drag-hint">Arraste a notificação diretamente na tela.</p>}
      </section>
      <section className="panel editor-panel" aria-labelledby="fields-title">
        <h2 id="fields-title">Personalize a tela</h2>
        <fieldset><legend>Data e horário</legend>
          <div className="editor-field-grid editor-field-grid-date">
            <label>Dia da semana<input type="text" value={values.weekday} maxLength={10} onInput={updateValue("weekday")} /></label><label>Data<input type="number" min="1" max="31" value={values.day} onInput={updateValue("day")} /></label><label>Mês<input type="text" value={values.month} maxLength={12} placeholder="Ex.: Jun" onInput={updateValue("month")} /></label><label>Horário principal<input type="time" value={values.mainTime} onInput={updateValue("mainTime")} /></label><label>Horário superior<input type="time" value={values.alarmTime} onInput={updateValue("alarmTime")} /></label>
          </div>
          <div className="clock-style-grid">
            <label>Fonte do relógio<select value={clock.font} onInput={updateClock("font")}><option>Arial Narrow</option><option>Arial</option><option>Georgia</option><option>Courier New</option><option>Trebuchet MS</option><option>Impact</option></select></label>
            <label>Cor do relógio<span className="color-control"><input type="color" value={clock.color} onInput={updateClock("color")} /><output>{clock.color}</output></span></label>
            <label>Peso: {clock.weight}<input type="range" min="100" max="900" step="100" value={clock.weight} onInput={updateClock("weight")} /></label><label>Tamanho: {clock.size}<input type="range" min="5.5" max="9.5" step="0.1" value={clock.size} onInput={updateClock("size")} /></label><label>Espaçamento: {clock.spacing}<input type="range" min="-0.16" max="0.08" step="0.01" value={clock.spacing} onInput={updateClock("spacing")} /></label>
          </div>
        </fieldset>
        <fieldset><legend>Notificação</legend>
          <label>Título<input type="text" value={values.title} onInput={updateValue("title")} /></label><label>Mensagem<textarea rows={3} value={values.message} onInput={updateValue("message")} /></label><label>Horário exibido<input type="text" value={values.notificationTime} onInput={updateValue("notificationTime")} /></label>
          <label>Onde deixar a notificação<select value={values.notificationPosition} onInput={updateValue("notificationPosition")}><option value="below-clock">Embaixo do horário</option><option value="middle">No centro da tela</option><option value="lower">Mais abaixo</option><option value="free">Posição livre</option></select></label>
          {values.notificationPosition === "free" && <div className="position-controls"><label>Horizontal: {values.notificationX}%<input type="range" min="12" max="88" value={values.notificationX} onInput={updateValue("notificationX")} /></label><label>Vertical: {values.notificationY}%<input type="range" min="22" max="84" value={values.notificationY} onInput={updateValue("notificationY")} /></label></div>}
          <div className="icon-gallery" aria-label="Ícones prontos"><span className="field-label">Ícones prontos</span><div>{BUILT_IN_ICONS.map((icon) => <button className={appIcon === icon.src ? "is-selected" : ""} type="button" key={icon.name} onClick={() => selectBuiltInIcon(icon.src)} aria-label={`Usar ícone ${icon.name}`} title={icon.name}><i style={{ backgroundImage: `url("${icon.src}")` }} /></button>)}</div></div>
          <div className="upload-grid"><label className="file-picker"><span>Logo personalizado</span><span className="file-picker-button"><i className="file-preview file-preview-icon" style={{ backgroundImage: `url("${appIcon}")` }} />Enviar logo</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseIcon} /></label><label className="file-picker"><span>Imagem de fundo</span><span className="file-picker-button"><i className="file-preview" style={{ backgroundImage: `url("${backgroundUrl}")` }} />Trocar imagem</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseBackground} /></label></div>
        </fieldset>
        <div className="editor-actions"><button className="button button-secondary" type="button" onClick={resetEditor}>Restaurar exemplo</button><button className="button button-primary" type="button" onClick={downloadPng}>Baixar PNG</button></div>
        <p className="hint" id="export-note" aria-live="polite">{exportMessage}</p>
        {downloadFile && <a className="text-link export-fallback" href={downloadFile.url} download={downloadFile.filename}>Baixar ou abrir o PNG novamente →</a>}
      </section>
    </div>
  </PrototypeShell>;
}
