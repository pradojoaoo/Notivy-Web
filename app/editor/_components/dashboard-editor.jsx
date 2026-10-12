"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { domToBlob } from "modern-screenshot";
import { getSupabaseBrowserClient, withRequestTimeout } from "../../_lib/supabase-client";
import styles from "./dashboard-editor.module.css";

const EDITOR_TYPE = "tiktokshop-dashboard";
const DEFAULT_PROJECT_NAME = "Painel TikTokShop";
const INITIAL_DASHBOARD = {
  today: { gmv: "R$ 5,8 mil", items: "42", commission: "R$ 426,20" },
  week: { gmv: "R$ 4,3 mil", items: "26", commission: "R$ 476,54" },
};
const INITIAL_PERIOD_LABELS = { today: "Hoje", week: "Últimos 7 dias" };
const INITIAL_METRIC_LABELS = {
  gmv: "GMV atribuído",
  items: "Itens vendidos atribuídos",
  commission: "Comissão estimada",
};
const PERIODS = [{ id: "today" }, { id: "week" }];
const TEMPLATES = [
  { id: "clean", name: "Painel limpo", description: "Visual amplo, sem contorno e com seta lateral." },
  { id: "card", name: "Painel em cartão", description: "Conteúdo agrupado em um cartão com borda suave." },
];
const EXPORT_AUTH_VALUES = {
  weekday: "Thu", day: "17", month: "Jun", alarmTime: "05:30", mainTime: "13:25",
  appName: "Notivy", title: "Painel TikTokShop", message: "Exportação do painel", notificationTime: "agora",
  notificationTransparency: "less", notificationPosition: "below-clock", notificationX: 50, notificationY: 48,
};
const EXPORT_AUTH_CLOCK = { font: "SF Pro Rounded", weight: 700, color: "#ffffff", size: 92, spacing: -0.03 };

function formatResetDate(value) {
  if (!value) return "o início do próximo mês";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric", month: "long", timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function cloneDashboard(value = INITIAL_DASHBOARD) {
  return {
    today: { ...INITIAL_DASHBOARD.today, ...(value.today ?? {}) },
    week: { ...INITIAL_DASHBOARD.week, ...(value.week ?? {}) },
  };
}

export async function captureDashboardPng(node) {
  if (!node) throw new Error("preview_unavailable");
  await document.fonts.ready;

  const exportNode = node.cloneNode(true);
  exportNode.dataset.exporting = "true";
  Object.assign(exportNode.style, {
    position: "fixed",
    top: "0",
    left: "-10000px",
    zIndex: "-1",
    pointerEvents: "none",
  });
  document.body.appendChild(exportNode);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  try {
    const blob = await domToBlob(exportNode, {
      width: 1280,
      height: 720,
      scale: 1,
      backgroundColor: "#f6f6f6",
    });
    if (!(blob instanceof Blob) || !blob.size) throw new Error("empty_preview");
    return blob;
  } finally {
    exportNode.remove();
  }
}

export default function DashboardEditor({ exportQuota, setExportQuota, showUpgradeOffer, setShowUpgradeOffer }) {
  const exportRef = useRef(null);
  const exportInProgress = useRef(false);
  const pendingExportRequest = useRef(null);
  const [template, setTemplate] = useState("clean");
  const [period, setPeriod] = useState("today");
  const [periodLabels, setPeriodLabels] = useState(INITIAL_PERIOD_LABELS);
  const [metricLabels, setMetricLabels] = useState(INITIAL_METRIC_LABELS);
  const [dashboard, setDashboard] = useState(() => cloneDashboard());
  const [projectName, setProjectName] = useState(DEFAULT_PROJECT_NAME);
  const [projectId, setProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Salve este painel para encontrá-lo novamente em Meus prints.");
  const [exportMessage, setExportMessage] = useState("O PNG será exportado no formato horizontal do painel.");
  const [downloadFile, setDownloadFile] = useState(null);

  useEffect(() => () => {
    if (downloadFile?.url) URL.revokeObjectURL(downloadFile.url);
  }, [downloadFile]);

  useEffect(() => {
    const requestedProjectId = new URL(window.location.href).searchParams.get("project");
    if (!requestedProjectId) return;
    let isActive = true;

    const loadProject = async () => {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("notification_projects")
        .select("id, name, editor_state")
        .eq("id", requestedProjectId)
        .single();
      if (!isActive) return;
      setIsLoading(false);
      const saved = data?.editor_state;
      if (error || !data || saved?.editorType !== EDITOR_TYPE) return;

      const savedDashboard = saved.dashboard ?? {};
      setProjectId(data.id);
      setProjectName(data.name || DEFAULT_PROJECT_NAME);
      setTemplate(savedDashboard.template === "card" ? "card" : "clean");
      setPeriod(savedDashboard.period === "week" ? "week" : "today");
      setPeriodLabels({ ...INITIAL_PERIOD_LABELS, ...(savedDashboard.periodLabels ?? {}) });
      setMetricLabels({ ...INITIAL_METRIC_LABELS, ...(savedDashboard.metricLabels ?? {}) });
      setDashboard(cloneDashboard(savedDashboard.values));
      setSaveMessage("Painel carregado. Suas próximas alterações podem ser salvas.");
    };

    loadProject();
    return () => { isActive = false; };
  }, []);

  const currentValues = dashboard[period];
  const updatePeriodLabel = (periodId) => (event) => setPeriodLabels((current) => ({ ...current, [periodId]: event.target.value }));
  const updateMetricLabel = (metric) => (event) => setMetricLabels((current) => ({ ...current, [metric]: event.target.value }));
  const updateMetricValue = (metric) => (event) => setDashboard((current) => ({
    ...current,
    [period]: { ...current[period], [metric]: event.target.value },
  }));
  const resetDashboard = () => {
    setTemplate("clean");
    setPeriod("today");
    setPeriodLabels(INITIAL_PERIOD_LABELS);
    setMetricLabels(INITIAL_METRIC_LABELS);
    setDashboard(cloneDashboard());
    setExportMessage("Exemplo restaurado. O PNG será exportado no formato horizontal do painel.");
  };
  const getEditorState = () => ({
    editorType: EDITOR_TYPE,
    dashboard: { template, period, periodLabels, metricLabels, values: dashboard },
  });

  const saveProject = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveMessage("Salvando o Painel TikTokShop...");
    const supabase = getSupabaseBrowserClient();
    let user;
    try {
      const { data, error } = await withRequestTimeout(supabase.auth.getUser());
      if (error || !data.user) throw error ?? new Error("missing_user");
      user = data.user;
    } catch {
      setIsSaving(false);
      setSaveMessage("Não foi possível confirmar sua sessão. Confira a conexão e tente novamente.");
      return;
    }

    const safeName = projectName.trim().slice(0, 120) || DEFAULT_PROJECT_NAME;
    const editorState = getEditorState();
    const nextProjectId = projectId ?? crypto.randomUUID();
    const isNewProject = !projectId;
    let result;
    try {
      if (isNewProject) {
        const { error: createError } = await withRequestTimeout(
          supabase.from("notification_projects").insert({
            id: nextProjectId,
            user_id: user.id,
            name: safeName,
            editor_state: editorState,
            updated_at: new Date().toISOString(),
          }),
        );
        if (createError) throw createError;
      }

      result = await withRequestTimeout(
        supabase
          .from("notification_projects")
          .update({ name: safeName, editor_state: editorState, updated_at: new Date().toISOString() })
          .eq("id", nextProjectId)
          .eq("user_id", user.id)
          .select("id")
          .single(),
      );
    } catch (error) {
      if (isNewProject) {
        await supabase.from("notification_projects").delete().eq("id", nextProjectId).eq("user_id", user.id);
      }
      setIsSaving(false);
      setSaveMessage(error?.message?.includes("project_limit_reached")
        ? "Você atingiu o limite de 100 projetos salvos. Exclua um item do painel para salvar outro."
        : "Não foi possível salvar o painel. Confira sua conexão e tente novamente.");
      return;
    }

    setIsSaving(false);
    if (result.error || !result.data) {
      if (isNewProject) {
        await supabase.from("notification_projects").delete().eq("id", nextProjectId).eq("user_id", user.id);
      }
      setSaveMessage(result.error?.message?.includes("project_limit_reached")
        ? "Você atingiu o limite de 100 projetos salvos. Exclua um item do painel para salvar outro."
        : "Não foi possível salvar o painel. Tente novamente.");
      return;
    }

    setProjectId(result.data.id);
    setProjectName(safeName);
    window.history.replaceState(null, "", `/editor/?project=${result.data.id}&mode=dashboard`);
    setSaveMessage("Painel TikTokShop salvo em Meus prints.");
  };

  const downloadPng = async () => {
    if (exportInProgress.current) return;
    exportInProgress.current = true;
    setIsExporting(true);
    setDownloadFile(null);
    setExportMessage("Preparando o Painel TikTokShop...");
    const supabase = getSupabaseBrowserClient();
    try {
      const { data: userData, error: userError } = await withRequestTimeout(supabase.auth.getUser());
      if (userError || !userData.user) {
        setExportMessage("Entre na sua conta para exportar o painel.");
        return;
      }

      if (exportQuota.usedCount >= exportQuota.monthlyLimit) {
        const { data: currentQuota, error: quotaError } = await supabase.rpc("get_monthly_export_status").single();
        if (quotaError || !currentQuota) {
          setExportMessage("Não foi possível consultar sua cota agora. Tente novamente.");
          return;
        }
        setExportQuota({
          isLoading: false, isAuthenticated: true, usedCount: currentQuota.used_count,
          monthlyLimit: currentQuota.monthly_limit, resetsAt: currentQuota.resets_at, hasError: false,
        });
        if (currentQuota.used_count >= currentQuota.monthly_limit) {
          setShowUpgradeOffer(true);
          setExportMessage(`Seu limite deste mês já foi usado. Nova exportação em ${formatResetDate(currentQuota.resets_at)}.`);
          return;
        }
      }

      const previewBlob = await captureDashboardPng(exportRef.current);
      const requestSignature = JSON.stringify({ projectId, template, periodLabels, metricLabels, dashboard });
      if (pendingExportRequest.current?.signature !== requestSignature) {
        pendingExportRequest.current = { id: crypto.randomUUID(), signature: requestSignature };
      }
      const { data: authorization, error: renderError } = await supabase.functions.invoke("render-png", {
        body: {
          requestId: pendingExportRequest.current.id,
          projectId,
          values: EXPORT_AUTH_VALUES,
          clock: EXPORT_AUTH_CLOCK,
        },
        timeout: 30000,
      });

      if (renderError || !authorization?.allowed) {
        let errorCode = "";
        try { errorCode = (await renderError?.context?.clone().json())?.code ?? ""; }
        catch { /* A mensagem genérica abaixo cobre respostas sem JSON. */ }
        if (errorCode === "quota_exhausted") {
          const { data: currentQuota } = await supabase.rpc("get_monthly_export_status").single();
          if (currentQuota) setExportQuota({
            isLoading: false, isAuthenticated: true, usedCount: currentQuota.used_count,
            monthlyLimit: currentQuota.monthly_limit, resetsAt: currentQuota.resets_at, hasError: false,
          });
          pendingExportRequest.current = null;
          setShowUpgradeOffer(true);
          setExportMessage(`Seu limite deste mês já foi usado. Nova exportação em ${formatResetDate(currentQuota?.resets_at)}.`);
          return;
        }
        if (errorCode === "rate_limited") {
          setExportMessage("Muitas tentativas de exportação. Aguarde alguns minutos e tente novamente.");
          return;
        }
        if (errorCode === "request_mismatch" || errorCode === "invalid_payload") pendingExportRequest.current = null;
        setExportMessage("Não foi possível autorizar a exportação. Tente novamente.");
        return;
      }

      setExportQuota((current) => ({
        ...current, isLoading: false, isAuthenticated: true,
        usedCount: Math.min(current.monthlyLimit, current.usedCount + 1), hasError: false,
      }));
      pendingExportRequest.current = null;
      const outputBlob = previewBlob;
      const filename = `notivy-tiktokshop-${Date.now()}.png`;
      const url = URL.createObjectURL(outputBlob);
      const file = new File([outputBlob], filename, { type: "image/png" });
      let canShare = false;
      try { canShare = typeof navigator.share === "function" && navigator.canShare?.({ files: [file] }); }
      catch { /* O download continua disponível. */ }
      setDownloadFile({ url, filename, file, canShare });

      if (canShare) {
        try {
          await navigator.share({ files: [file], title: "Painel TikTokShop" });
          setExportMessage("PNG pronto. Use a opção de salvar imagem do seu telefone; o link também permanece disponível abaixo.");
        } catch (error) {
          setExportMessage(error?.name === "AbortError"
            ? "O compartilhamento foi fechado. Use o link abaixo para baixar ou abrir o PNG."
            : "Não foi possível abrir o compartilhamento. Use o link abaixo para baixar ou abrir o PNG.");
        }
      } else {
        const link = document.createElement("a");
        link.download = filename;
        link.href = url;
        link.hidden = true;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setExportMessage("PNG pronto em 1280 × 720 px. Se o download não abrir, use o link abaixo.");
      }
      setShowUpgradeOffer(false);
    } catch {
      setExportMessage("Não foi possível gerar o PNG. Tente novamente.");
    } finally {
      exportInProgress.current = false;
      setIsExporting(false);
    }
  };

  const sharePng = async () => {
    if (!downloadFile?.canShare) return;
    try {
      await navigator.share({ files: [downloadFile.file], title: "Painel TikTokShop" });
      setExportMessage("Imagem compartilhada. Você também pode abrir o PNG pelo link abaixo.");
    } catch (error) {
      if (error?.name !== "AbortError") setExportMessage("Não foi possível compartilhar. Use o link abaixo para abrir o PNG.");
    }
  };

  let quotaMessage = "Tudo pronto para exportar seu PNG.";
  if (exportQuota.isLoading) quotaMessage = "Consultando sua exportação mensal...";
  else if (exportQuota.hasError) quotaMessage = "Não foi possível consultar sua cota agora.";

  return (
    <div className={styles.workspace}>
      <section className={`panel ${styles.previewPanel}`} aria-labelledby="dashboard-preview-title" aria-busy={isExporting}>
        <div className="section-heading"><h2 id="dashboard-preview-title">Preview do Painel TikTokShop</h2><span className="badge">Edição ao vivo</span></div>
        <div ref={exportRef} className={`${styles.canvas} ${template === "card" ? styles.canvasCard : styles.canvasClean}`}>
          <div className={styles.dashboardCard}>
            <div className={styles.periodSwitch} aria-label="Período exibido">
              {PERIODS.map(({ id }) => <button aria-pressed={period === id} key={id} onClick={() => setPeriod(id)} type="button">{periodLabels[id] || "Período"}</button>)}
            </div>
            <div className={styles.metrics}>
              <article><p>{metricLabels.gmv || "Métrica"}</p><strong>{currentValues.gmv || "—"}</strong></article>
              <article><p>{metricLabels.items || "Métrica"}</p><strong>{currentValues.items || "—"}</strong></article>
              <article><p>{metricLabels.commission || "Métrica"}</p><strong>{currentValues.commission || "—"}</strong></article>
            </div>
            {template === "clean" && <span className={styles.arrow} aria-hidden="true">›</span>}
          </div>
        </div>
        <p className={styles.previewHint}>Clique em “Hoje” ou “Últimos 7 dias” no preview para conferir cada conjunto de valores.</p>
      </section>

      <section className={`panel editor-panel ${styles.controls}`} aria-labelledby="dashboard-fields-title" inert={isSaving || isExporting}>
        <h2 id="dashboard-fields-title">Personalize o Painel TikTokShop</h2>
        <fieldset><legend>Projeto</legend><label>Nome no painel<input type="text" maxLength={120} value={projectName} onInput={(event) => setProjectName(event.target.value)} /></label></fieldset>
        <fieldset>
          <legend>Modelo visual</legend>
          <div className={styles.templateGrid}>{TEMPLATES.map((item) => <button aria-pressed={template === item.id} className={styles.templateButton} key={item.id} onClick={() => setTemplate(item.id)} type="button"><span className={`${styles.templateThumbnail} ${item.id === "card" ? styles.templateThumbnailCard : ""}`} aria-hidden="true"><i /><i /><i /></span><strong>{item.name}</strong><small>{item.description}</small></button>)}</div>
        </fieldset>
        <fieldset>
          <legend>Textos dos períodos</legend>
          <div className="editor-field-grid"><label>Primeiro período<input type="text" value={periodLabels.today} onInput={updatePeriodLabel("today")} /></label><label>Segundo período<input type="text" value={periodLabels.week} onInput={updatePeriodLabel("week")} /></label></div>
        </fieldset>
        <fieldset>
          <legend>Período em edição</legend>
          <div className={styles.periodEditor} role="group" aria-label="Escolha o período que deseja editar">{PERIODS.map(({ id }) => <button aria-pressed={period === id} key={id} onClick={() => setPeriod(id)} type="button">{periodLabels[id] || "Período"}</button>)}</div>
          <p className={styles.sectionHelp}>Os valores abaixo pertencem somente ao período selecionado.</p>
          <div className={styles.metricEditorGrid}>
            <div className={styles.metricEditor}><label>Nome da primeira métrica<input type="text" value={metricLabels.gmv} onInput={updateMetricLabel("gmv")} /></label><label>Valor<input type="text" value={currentValues.gmv} onInput={updateMetricValue("gmv")} /></label></div>
            <div className={styles.metricEditor}><label>Nome da segunda métrica<input type="text" value={metricLabels.items} onInput={updateMetricLabel("items")} /></label><label>Valor<input type="text" value={currentValues.items} onInput={updateMetricValue("items")} /></label></div>
            <div className={styles.metricEditor}><label>Nome da terceira métrica<input type="text" value={metricLabels.commission} onInput={updateMetricLabel("commission")} /></label><label>Valor<input type="text" value={currentValues.commission} onInput={updateMetricValue("commission")} /></label></div>
          </div>
        </fieldset>
        <div className="editor-actions">
          <button className="button button-secondary" type="button" onClick={resetDashboard}>Restaurar exemplo</button>
          <button className="button button-secondary" type="button" disabled={isSaving || isLoading} onClick={saveProject}>{isSaving ? "Salvando..." : "Salvar no painel"}</button>
          <button className="button button-primary" type="button" disabled={isExporting || isLoading} onClick={downloadPng}>{isExporting ? "Preparando PNG..." : "Salvar PNG no telefone"}</button>
        </div>
        <p className="hint" aria-live="polite">{isLoading ? "Carregando o painel salvo..." : saveMessage}</p>
        {projectId && <Link className="text-link export-fallback" href="/painel">Ver o Painel TikTokShop em Meus prints →</Link>}
        <p className="export-quota" aria-live="polite">{quotaMessage}</p>
        {showUpgradeOffer && <Link className="text-link export-upgrade-link" href="/assinar/?plano=pro">Conhecer o PRO para exportar mais →</Link>}
        <p className="hint" aria-live="polite">{exportMessage}</p>
        {downloadFile && <div className="export-ready-actions"><a className="text-link export-fallback" href={downloadFile.url} download={downloadFile.filename}>Baixar ou abrir o PNG →</a>{downloadFile.canShare && <button className="text-link" type="button" onClick={sharePng}>Compartilhar PNG →</button>}</div>}
      </section>
    </div>
  );
}
