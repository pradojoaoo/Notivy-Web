import { BUILT_IN_ICONS } from "../_lib/editor-config";

export default function EditorControls({
  values,
  clock,
  appIcon,
  backgroundUrl,
  updateValue,
  updateClock,
  selectBuiltInIcon,
  chooseIcon,
  chooseBackground,
  resetEditor,
  downloadPng,
  isExporting,
  exportMessage,
  downloadFile,
  sharePng,
  saveProject,
  isSaving,
  saveMessage,
}) {
  return (
    <section className="panel editor-panel" aria-labelledby="fields-title" inert={isExporting || isSaving}>
      <h2 id="fields-title">Personalize seu print</h2>

      <fieldset>
        <legend>Data e horário</legend>
        <div className="editor-field-grid editor-field-grid-date">
          <label>Dia da semana<input type="text" value={values.weekday} maxLength={10} onInput={updateValue("weekday")} /></label>
          <label>Data<input type="number" min="1" max="31" value={values.day} onInput={updateValue("day")} /></label>
          <label>Mês<input type="text" value={values.month} maxLength={12} placeholder="Ex.: Jun" onInput={updateValue("month")} /></label>
          <label>Horário principal<input type="time" value={values.mainTime} onInput={updateValue("mainTime")} /></label>
          <label>Horário superior<input type="time" value={values.alarmTime} onInput={updateValue("alarmTime")} /></label>
        </div>
        <div className="clock-style-grid">
          <label>Fonte do relógio<select value={clock.font} onInput={updateClock("font")}><option>SF Pro Rounded</option><option>Arial Narrow</option><option>Arial</option><option>Georgia</option><option>Courier New</option><option>Trebuchet MS</option><option>Impact</option></select></label>
          <label>Cor do relógio<span className="color-control"><input type="color" value={clock.color} onInput={updateClock("color")} /><output>{clock.color}</output></span></label>
          <label>Peso: {clock.weight}<input type="range" min="100" max="900" step="100" value={clock.weight} onInput={updateClock("weight")} /></label>
          <label>Tamanho: {clock.size}px<input type="range" min="60" max="150" step="1" value={clock.size} onInput={updateClock("size")} /></label>
          <label>Espaçamento: {clock.spacing}<input type="range" min="-0.16" max="0.08" step="0.01" value={clock.spacing} onInput={updateClock("spacing")} /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Notificação</legend>
        <label>Nome do app<input type="text" value={values.appName} onInput={updateValue("appName")} /></label>
        <label>Título<input type="text" value={values.title} onInput={updateValue("title")} /></label>
        <label>Mensagem<textarea rows={3} value={values.message} onInput={updateValue("message")} /></label>
        <label>Horário exibido<input type="text" value={values.notificationTime} onInput={updateValue("notificationTime")} /></label>
        <label>Onde deixar a notificação<select value={values.notificationPosition} onInput={updateValue("notificationPosition")}><option value="below-clock">Embaixo do horário</option><option value="middle">No centro da tela</option><option value="lower">Mais abaixo</option><option value="free">Posição livre</option></select></label>
        {values.notificationPosition === "free" && (
          <div className="position-controls">
            <label>Horizontal: {values.notificationX}%<input type="range" min="12" max="88" value={values.notificationX} onInput={updateValue("notificationX")} /></label>
            <label>Vertical: {values.notificationY}%<input type="range" min="22" max="84" value={values.notificationY} onInput={updateValue("notificationY")} /></label>
          </div>
        )}
        <div className="icon-gallery" aria-label="Ícones prontos">
          <span className="field-label">Ícones prontos</span>
          <div>{BUILT_IN_ICONS.map((icon) => <button className={appIcon === icon.src ? "is-selected" : ""} type="button" key={icon.name} onClick={() => selectBuiltInIcon(icon)} aria-label={`Usar ícone ${icon.name}`} title={icon.name}><i style={{ backgroundImage: `url("${icon.src}")` }} /></button>)}</div>
        </div>
        <div className="upload-grid">
          <label className="file-picker"><span>Logo personalizado</span><span className="file-picker-button"><i className="file-preview file-preview-icon" style={{ backgroundImage: `url("${appIcon}")` }} />Enviar logo</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseIcon} /></label>
          <label className="file-picker"><span>Imagem de fundo</span><span className="file-picker-button"><i className="file-preview" style={{ backgroundImage: `url("${backgroundUrl}")` }} />Trocar imagem</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseBackground} /></label>
        </div>
      </fieldset>

      <div className="editor-actions">
        <button className="button button-secondary" type="button" onClick={resetEditor}>Restaurar exemplo</button>
        <button className="button button-secondary" type="button" disabled={isSaving} onClick={saveProject}>{isSaving ? "Salvando..." : "Salvar no painel"}</button>
        <button className="button button-primary" type="button" disabled={isExporting} onClick={downloadPng}>{isExporting ? "Preparando PNG..." : "Baixar PNG"}</button>
      </div>
      <p className="hint" id="save-note" aria-live="polite">{saveMessage}</p>
      <p className="hint" id="export-note" aria-live="polite">{exportMessage}</p>
      {downloadFile && <div className="export-ready-actions">
        <a className="text-link export-fallback" href={downloadFile.url} download={downloadFile.filename}>Baixar ou abrir o PNG →</a>
        {downloadFile.canShare && <button className="text-link" type="button" onClick={sharePng}>Compartilhar PNG →</button>}
      </div>}
    </section>
  );
}
