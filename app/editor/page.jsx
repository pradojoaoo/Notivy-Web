"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PrototypeShell from "../_components/prototype-shell";
import NotificationPreview from "../_components/notification-preview";
import { exportPreviewPng } from "../_lib/export-preview";
import { getSupabaseBrowserClient } from "../_lib/supabase-client";
import EditorControls from "./_components/editor-controls";
import { loadExportDraft, removeExportDraft, saveExportDraft } from "./_lib/export-draft";
import { DEFAULT_BACKGROUND, DEFAULT_ICON, EXPORT_READY_MESSAGE, INITIAL_CLOCK, INITIAL_VALUES } from "./_lib/editor-config";

const ASSET_BUCKET = "notivy-assets";
const MAX_ASSET_SIZE = 5 * 1024 * 1024;
const ALLOWED_ASSET_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const FREE_EXPORT_LIMIT = 1;

const INITIAL_EXPORT_QUOTA = {
  isLoading: true,
  isAuthenticated: false,
  usedCount: 0,
  monthlyLimit: FREE_EXPORT_LIMIT,
  resetsAt: null,
};

function formatResetDate(value) {
  if (!value) return "o início do próximo mês";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function validateAsset(file) {
  if (!ALLOWED_ASSET_TYPES.has(file.type)) return "Use uma imagem PNG, JPEG ou WebP.";
  if (file.size > MAX_ASSET_SIZE) return "A imagem deve ter no máximo 5 MB.";
  return "";
}

export default function EditorPage() {
  const router = useRouter();
  const previewRef = useRef(null);
  const exportInProgress = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [clock, setClock] = useState(INITIAL_CLOCK);
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_BACKGROUND);
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState("");
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [backgroundStoragePath, setBackgroundStoragePath] = useState(null);
  const [appIcon, setAppIcon] = useState(DEFAULT_ICON);
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [iconStoragePath, setIconStoragePath] = useState(null);
  const [exportMessage, setExportMessage] = useState(EXPORT_READY_MESSAGE);
  const [downloadFile, setDownloadFile] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Entre na sua conta para salvar este print.");
  const [exportQuota, setExportQuota] = useState(INITIAL_EXPORT_QUOTA);
  const [showUpgradeOffer, setShowUpgradeOffer] = useState(false);

  useEffect(() => () => { if (customBackgroundUrl) URL.revokeObjectURL(customBackgroundUrl); }, [customBackgroundUrl]);
  useEffect(() => () => { if (customIconUrl) URL.revokeObjectURL(customIconUrl); }, [customIconUrl]);
  useEffect(() => () => { if (downloadFile?.url) URL.revokeObjectURL(downloadFile.url); }, [downloadFile]);
  useEffect(() => {
    const shouldResumeExport = new URL(window.location.href).searchParams.get("resume") === "export";
    if (!shouldResumeExport) return;

    let isActive = true;
    loadExportDraft().then((draft) => {
      if (!isActive || !draft) return;

      setValues({ ...INITIAL_VALUES, ...(draft.values ?? {}) });
      setClock({ ...INITIAL_CLOCK, ...(draft.clock ?? {}) });

      if (draft.backgroundFile) {
        const url = URL.createObjectURL(draft.backgroundFile);
        setBackgroundFile(draft.backgroundFile);
        setCustomBackgroundUrl(url);
        setBackgroundUrl(url);
      } else {
        setBackgroundUrl(draft.backgroundUrl || DEFAULT_BACKGROUND);
      }

      if (draft.iconFile) {
        const url = URL.createObjectURL(draft.iconFile);
        setIconFile(draft.iconFile);
        setCustomIconUrl(url);
        setAppIcon(url);
      } else {
        setAppIcon(draft.appIcon || DEFAULT_ICON);
      }

      setExportMessage("Sua edição foi restaurada. Agora você pode baixar o PNG.");
    }).catch(() => {
      if (isActive) setExportMessage("Não foi possível restaurar a edição anterior.");
    });

    return () => { isActive = false; };
  }, []);
  useEffect(() => {
    let isActive = true;
    const supabase = getSupabaseBrowserClient();

    const refreshExportQuota = async (user) => {
      if (!user) {
        if (isActive) setExportQuota({ ...INITIAL_EXPORT_QUOTA, isLoading: false });
        return;
      }

      if (isActive) setExportQuota((current) => ({ ...current, isLoading: true, isAuthenticated: true }));
      const { data, error } = await supabase.rpc("get_monthly_export_status").single();
      if (!isActive) return;

      if (error || !data) {
        setExportQuota({ ...INITIAL_EXPORT_QUOTA, isLoading: false, isAuthenticated: true, hasError: true });
        return;
      }

      setExportQuota({
        isLoading: false,
        isAuthenticated: true,
        usedCount: data.used_count,
        monthlyLimit: data.monthly_limit,
        resetsAt: data.resets_at,
        hasError: false,
      });
    };

    supabase.auth.getUser().then(({ data }) => refreshExportQuota(data.user));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => refreshExportQuota(session?.user ?? null), 0);
    });

    return () => {
      isActive = false;
      authListener.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const requestedProjectId = new URL(window.location.href).searchParams.get("project");
    if (!requestedProjectId) {
      supabase.auth.getSession().then(({ data }) => {
        setSaveMessage(data.session
          ? "Salve este print para encontrá-lo novamente no painel."
          : "Entre na sua conta para salvar este print.");
      });
      return;
    }

    const loadProject = async () => {
      setSaveMessage("Carregando o print salvo...");
      const { data, error } = await supabase
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
      setBackgroundStoragePath(saved.backgroundStoragePath ?? null);
      setIconStoragePath(saved.appIconStoragePath ?? null);
      setProjectId(data.id);

      const restoreAsset = async (path, setCustomUrl, setDisplayedUrl) => {
        if (!path) return true;
        const { data: fileBlob, error: downloadError } = await supabase.storage.from(ASSET_BUCKET).download(path);
        if (downloadError || !fileBlob) return false;
        const localUrl = URL.createObjectURL(fileBlob);
        setCustomUrl(localUrl);
        setDisplayedUrl(localUrl);
        return true;
      };

      const restored = await Promise.all([
        restoreAsset(saved.backgroundStoragePath, setCustomBackgroundUrl, setBackgroundUrl),
        restoreAsset(saved.appIconStoragePath, setCustomIconUrl, setAppIcon),
      ]);
      setSaveMessage(restored.every(Boolean)
        ? "Print e imagens carregados. Suas próximas alterações podem ser salvas."
        : "Print carregado, mas uma imagem privada não pôde ser recuperada.");
    };

    loadProject();
  }, []);

  const updateValue = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const updateClock = (field) => (event) => setClock((current) => ({ ...current, [field]: event.target.value }));
  const chooseBackground = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateAsset(file);
    if (validationError) { event.target.value = ""; setSaveMessage(validationError); return; }
    const nextUrl = URL.createObjectURL(file);
    setBackgroundFile(file); setCustomBackgroundUrl(nextUrl); setBackgroundUrl(nextUrl);
    setSaveMessage("Wallpaper pronto para ser enviado quando você salvar o print.");
  };
  const chooseIcon = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateAsset(file);
    if (validationError) { event.target.value = ""; setSaveMessage(validationError); return; }
    const nextUrl = URL.createObjectURL(file);
    setIconFile(file); setCustomIconUrl(nextUrl); setAppIcon(nextUrl);
    setSaveMessage("Logo pronto para ser enviado quando você salvar o print.");
  };
  const selectBuiltInIcon = (icon) => {
    setIconFile(null);
    setIconStoragePath(null);
    setCustomIconUrl("");
    setAppIcon(icon.src);
    setValues((current) => ({ ...current, appName: icon.name }));
  };
  const setFreePosition = ({ x, y }) => setValues((current) => ({ ...current, notificationPosition: "free", notificationX: x, notificationY: y }));

  const resetEditor = () => {
    setValues(INITIAL_VALUES); setClock(INITIAL_CLOCK); setBackgroundUrl(DEFAULT_BACKGROUND); setCustomBackgroundUrl(""); setBackgroundFile(null); setBackgroundStoragePath(null);
    setAppIcon(DEFAULT_ICON); setCustomIconUrl(""); setIconFile(null); setIconStoragePath(null); setDownloadFile(null); setExportMessage(EXPORT_READY_MESSAGE);
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

    const nextProjectId = projectId ?? crypto.randomUUID();
    const uploadAsset = async (file, assetType) => {
      const path = `${userData.user.id}/${nextProjectId}/${assetType}`;
      const { error } = await supabase.storage.from(ASSET_BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true,
      });
      if (error) throw error;
      return path;
    };

    let nextBackgroundStoragePath = backgroundStoragePath;
    let nextIconStoragePath = iconStoragePath;
    try {
      [nextBackgroundStoragePath, nextIconStoragePath] = await Promise.all([
        backgroundFile ? uploadAsset(backgroundFile, "background") : Promise.resolve(backgroundStoragePath),
        iconFile ? uploadAsset(iconFile, "icon") : Promise.resolve(iconStoragePath),
      ]);
    } catch {
      setIsSaving(false);
      setSaveMessage("Não foi possível enviar uma das imagens. Confira o formato e tente novamente.");
      return;
    }

    const editorState = {
      values,
      clock,
      backgroundUrl: (nextBackgroundStoragePath || backgroundUrl.startsWith("blob:")) ? DEFAULT_BACKGROUND : backgroundUrl,
      appIcon: (nextIconStoragePath || appIcon.startsWith("blob:")) ? DEFAULT_ICON : appIcon,
      backgroundStoragePath: nextBackgroundStoragePath,
      appIconStoragePath: nextIconStoragePath,
    };
    const projectName = values.title.trim().slice(0, 120) || "Print sem título";
    const projectData = {
      name: projectName,
      editor_state: editorState,
      updated_at: new Date().toISOString(),
    };

    const result = projectId
      ? await supabase.from("notification_projects").update(projectData).eq("id", projectId).select("id").single()
      : await supabase.from("notification_projects").insert({ id: nextProjectId, ...projectData, user_id: userData.user.id }).select("id").single();

    setIsSaving(false);
    if (result.error) {
      setSaveMessage("Não foi possível salvar. Tente novamente.");
      return;
    }

    setBackgroundStoragePath(nextBackgroundStoragePath);
    setIconStoragePath(nextIconStoragePath);
    setBackgroundFile(null);
    setIconFile(null);
    setProjectId(result.data.id);
    window.history.replaceState(null, "", `/editor/?project=${result.data.id}`);
    setSaveMessage("Print e imagens salvos no seu painel.");
  };

  const downloadPng = async () => {
    if (exportInProgress.current) return;
    exportInProgress.current = true;
    setIsExporting(true);
    setDownloadFile(null);
    const supabase = getSupabaseBrowserClient();
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setExportQuota({ ...INITIAL_EXPORT_QUOTA, isLoading: false });
        setExportMessage("Crie uma conta gratuitamente para exportar.");
        try {
          await saveExportDraft({
            values,
            clock,
            backgroundUrl: backgroundUrl.startsWith("blob:") ? DEFAULT_BACKGROUND : backgroundUrl,
            backgroundFile,
            appIcon: appIcon.startsWith("blob:") ? DEFAULT_ICON : appIcon,
            iconFile,
          });
        } catch {
          setExportMessage("Não foi possível guardar sua edição neste navegador. Tente novamente.");
          return;
        }
        router.push("/entrar/?intent=export&next=%2Feditor%2F%3Fresume%3Dexport");
        return;
      }

      if (exportQuota.usedCount >= exportQuota.monthlyLimit) {
        const { data: currentQuota, error: quotaError } = await supabase
          .rpc("get_monthly_export_status")
          .single();

        if (quotaError || !currentQuota) {
          setExportMessage("Não foi possível consultar sua cota agora. Tente novamente.");
          return;
        }

        setExportQuota({
          isLoading: false,
          isAuthenticated: true,
          usedCount: currentQuota.used_count,
          monthlyLimit: currentQuota.monthly_limit,
          resetsAt: currentQuota.resets_at,
          hasError: false,
        });

        if (currentQuota.used_count >= currentQuota.monthly_limit) {
          setShowUpgradeOffer(true);
          setExportMessage(`Seu limite deste mês já foi usado. Nova exportação em ${formatResetDate(currentQuota.resets_at)}.`);
          return;
        }
      }

      setExportMessage("Preparando a imagem...");
      const blob = await exportPreviewPng(previewRef.current);
      setExportMessage("Confirmando sua exportação mensal...");
      const { data: claim, error: claimError } = await supabase
        .rpc("claim_monthly_export", { p_project_id: projectId })
        .single();

      if (claimError || !claim) {
        setExportMessage("Não foi possível confirmar sua cota mensal. Tente novamente.");
        return;
      }

      setExportQuota({
        isLoading: false,
        isAuthenticated: true,
        usedCount: claim.used_count,
        monthlyLimit: claim.monthly_limit,
        resetsAt: claim.resets_at,
        hasError: false,
      });

      if (!claim.allowed) {
        setShowUpgradeOffer(true);
        setExportMessage(`Seu limite deste mês já foi usado. Nova exportação em ${formatResetDate(claim.resets_at)}.`);
        return;
      }

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
      setShowUpgradeOffer(false);
      removeExportDraft().catch(() => {});
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
        exportQuota={exportQuota}
        showUpgradeOffer={showUpgradeOffer}
        saveProject={saveProject} isSaving={isSaving} saveMessage={saveMessage}
      />
    </div>
  </PrototypeShell>;
}
