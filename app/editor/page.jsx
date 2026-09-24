"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PrototypeShell from "../_components/prototype-shell";
import NotificationPreview from "../_components/notification-preview";
import { exportPreviewPng } from "../_lib/export-preview";
import { getSupabaseBrowserClient } from "../_lib/supabase-client";
import EditorControls from "./_components/editor-controls";
import { DEFAULT_BACKGROUND, DEFAULT_ICON, EXPORT_READY_MESSAGE, INITIAL_CLOCK, INITIAL_VALUES } from "./_lib/editor-config";

export default function EditorPage() {
  const previewRef = useRef(null);
  const exportInProgress = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [clock, setClock] = useState(INITIAL_CLOCK);
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_BACKGROUND);
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState("");
  const [appIcon, setAppIcon] = useState(DEFAULT_ICON);
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [exportMessage, setExportMessage] = useState(EXPORT_READY_MESSAGE);
  const [downloadFile, setDownloadFile] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Entre na sua conta para salvar este print.");

  useEffect(() => () => { if (customBackgroundUrl) URL.revokeObjectURL(customBackgroundUrl); }, [customBackgroundUrl]);
  useEffect(() => () => { if (customIconUrl) URL.revokeObjectURL(customIconUrl); }, [customIconUrl]);
  useEffect(() => () => { if (downloadFile?.url) URL.revokeObjectURL(downloadFile.url); }, [downloadFile]);
  useEffect(() => {
    const requestedProjectId = new URL(window.location.href).searchParams.get("project");
    if (!requestedProjectId) return;

    const loadProject = async () => {
      setSaveMessage("Carregando o print salvo...");
      const { data, error } = await getSupabaseBrowserClient()
        .from("notification_projects")
        .select("id, editor_state")
        .eq("id", requestedProjectId)
        .single();

      if (error || !data) {
        setSaveMessage("Não foi possível abrir este print. Confirme que você entrou na conta correta.");
        return;
      }

      const saved = data.editor_state ?? {};
      setValues({ ...INITIAL_VALUES, ...(saved.values ?? {}) });
      setClock({ ...INITIAL_CLOCK, ...(saved.clock ?? {}) });
      setBackgroundUrl(saved.backgroundUrl || DEFAULT_BACKGROUND);
      setAppIcon(saved.appIcon || DEFAULT_ICON);
      setProjectId(data.id);
      setSaveMessage("Print carregado. Suas próximas alterações podem ser salvas.");
    };

    loadProject();
  }, []);

  const updateValue = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const updateClock = (field) => (event) => setClock((current) => ({ ...current, [field]: event.target.value }));
  const chooseBackground = (event) => { const file = event.target.files?.[0]; if (!file) return; const nextUrl = URL.createObjectURL(file); setCustomBackgroundUrl(nextUrl); setBackgroundUrl(nextUrl); };
  const chooseIcon = (event) => { const file = event.target.files?.[0]; if (!file) return; const nextUrl = URL.createObjectURL(file); setCustomIconUrl(nextUrl); setAppIcon(nextUrl); };
  const selectBuiltInIcon = (icon) => {
    setCustomIconUrl("");
    setAppIcon(icon.src);
    setValues((current) => ({ ...current, appName: icon.name }));
  };
  const setFreePosition = ({ x, y }) => setValues((current) => ({ ...current, notificationPosition: "free", notificationX: x, notificationY: y }));

  const resetEditor = () => {
    setValues(INITIAL_VALUES); setClock(INITIAL_CLOCK); setBackgroundUrl(DEFAULT_BACKGROUND); setCustomBackgroundUrl("");
    setAppIcon(DEFAULT_ICON); setCustomIconUrl(""); setDownloadFile(null); setExportMessage(EXPORT_READY_MESSAGE);
  };

  const saveProject = async () => {
    setIsSaving(true);
    setSaveMessage("Salvando no seu painel...");
    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setIsSaving(false);
      setSaveMessage("Entre na sua conta antes de salvar o print.");
      return;
    }

    const hasTemporaryImages = backgroundUrl.startsWith("blob:") || appIcon.startsWith("blob:");
    const editorState = {
      values,
      clock,
      backgroundUrl: backgroundUrl.startsWith("blob:") ? DEFAULT_BACKGROUND : backgroundUrl,
      appIcon: appIcon.startsWith("blob:") ? DEFAULT_ICON : appIcon,
    };
    const projectName = values.title.trim().slice(0, 120) || "Print sem título";
    const projectData = {
      name: projectName,
      editor_state: editorState,
      updated_at: new Date().toISOString(),
    };

    const result = projectId
      ? await supabase.from("notification_projects").update(projectData).eq("id", projectId).select("id").single()
      : await supabase.from("notification_projects").insert({ ...projectData, user_id: userData.user.id }).select("id").single();

    setIsSaving(false);
    if (result.error) {
      setSaveMessage("Não foi possível salvar. Tente novamente.");
      return;
    }

    setProjectId(result.data.id);
    window.history.replaceState(null, "", `/editor/?project=${result.data.id}`);
    setSaveMessage(hasTemporaryImages
      ? "Configurações salvas. Imagens enviadas do aparelho ainda não são armazenadas."
      : "Print salvo no seu painel.");
  };

  const downloadPng = async () => {
    if (exportInProgress.current) return;
    exportInProgress.current = true;
    setIsExporting(true);
    setDownloadFile(null);
    setExportMessage("Preparando a imagem...");
    try {
      const blob = await exportPreviewPng(previewRef.current);
      const filename = `notivy-${Date.now()}.png`;
      const url = URL.createObjectURL(blob);
      const file = new File([blob], filename, { type: "image/png" });
      let canShare = false;
      try { canShare = typeof navigator.share === "function" && navigator.canShare?.({ files: [file] }); }
      catch { /* O download continua disponível mesmo se o compartilhamento não for suportado. */ }
      setDownloadFile({ url, filename, file, canShare });

      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExportMessage("PNG pronto em 1080 × 1920 px. Se o download não abrir, use o link abaixo.");
    } catch { setExportMessage("Não foi possível gerar a imagem. Tente novamente."); }
    finally { exportInProgress.current = false; setIsExporting(false); }
  };

  const sharePng = async () => {
    if (!downloadFile?.canShare) return;
    try {
      await navigator.share({ files: [downloadFile.file], title: "Imagem Notivy" });
      setExportMessage("Imagem compartilhada. Você também pode abrir o PNG pelo link abaixo.");
    } catch (error) {
      if (error?.name !== "AbortError") setExportMessage("Não foi possível compartilhar. Use o link abaixo para abrir o PNG.");
    }
  };

  return <PrototypeShell current="/editor">
    <Link className="text-link back-link" href="/painel">← Voltar aos meus prints</Link>
    <div className="page-heading"><div><p className="eyebrow">Criador de notificações</p><h1>Crie seu print</h1><p>Personalize a notificação e veja o resultado pronto para seu story.</p></div><span className="badge">Edição ao vivo</span></div>
    <p className="notice" id="editor-note">Crie direto no navegador, sem instalar aplicativo. As alterações aparecem imediatamente no telefone.</p>
    <div className="editor-grid">
      <section className="panel preview-panel" aria-labelledby="preview-title" aria-busy={isExporting}>
        <div className="section-heading"><h2 id="preview-title">Preview</h2><span className="badge">1080 × 1920</span></div>
        <NotificationPreview previewRef={previewRef} backgroundUrl={backgroundUrl} appIcon={appIcon} appName={values.appName} title={values.title} message={values.message} notificationTime={values.notificationTime} notificationPosition={values.notificationPosition} notificationX={Number(values.notificationX)} notificationY={Number(values.notificationY)} onNotificationMove={isExporting ? undefined : setFreePosition} editableLockScreen renderControls weekday={values.weekday} day={values.day} month={values.month} alarmTime={values.alarmTime} mainTime={values.mainTime} clockFont={clock.font} clockWeight={Number(clock.weight)} clockColor={clock.color} clockSize={Number(clock.size)} clockSpacing={Number(clock.spacing)} />
        {values.notificationPosition === "free" && <p className="preview-drag-hint">Arraste a notificação diretamente na tela.</p>}
      </section>
      <EditorControls
        values={values} clock={clock} appIcon={appIcon} backgroundUrl={backgroundUrl}
        updateValue={updateValue} updateClock={updateClock}
        selectBuiltInIcon={selectBuiltInIcon} chooseIcon={chooseIcon} chooseBackground={chooseBackground}
        resetEditor={resetEditor} downloadPng={downloadPng} isExporting={isExporting}
        exportMessage={exportMessage} downloadFile={downloadFile} sharePng={sharePng}
        saveProject={saveProject} isSaving={isSaving} saveMessage={saveMessage}
      />
    </div>
  </PrototypeShell>;
}
