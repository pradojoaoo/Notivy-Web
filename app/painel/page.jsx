"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PrototypeShell from "../_components/prototype-shell";
import { getSupabaseBrowserClient } from "../_lib/supabase-client";

const ASSET_BUCKET = "notivy-assets";

function getProjectAssetPaths(project, userId) {
  const prefix = `${userId}/${project.id}/`;
  const paths = [
    project.editor_state?.backgroundStoragePath,
    project.editor_state?.appIconStoragePath,
  ];

  return [...new Set(paths.filter((path) => typeof path === "string" && path.startsWith(prefix)))];
}

function getCopyName(name) {
  const suffix = " (cópia)";
  const baseName = name?.trim() || "Print sem título";
  return `${baseName.slice(0, 120 - suffix.length)}${suffix}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busyProjectId, setBusyProjectId] = useState(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: userData, error: userError }) => {
      if (userError || !userData.user) {
        router.replace("/entrar");
        return;
      }

      setEmail(userData.user.email ?? "");
      const { data, error: projectsError } = await supabase
        .from("notification_projects")
        .select("id, name, editor_state, updated_at")
        .order("updated_at", { ascending: false });

      if (projectsError) {
        setError("Não foi possível carregar seus prints.");
      } else {
        setProjects(data ?? []);
      }
      setLoading(false);
    });
  }, [router]);

  const signOut = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/entrar");
  };

  const duplicateProject = async (project) => {
    setBusyProjectId(project.id);
    setFeedback(null);
    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setBusyProjectId(null);
      router.replace("/entrar");
      return;
    }

    const userId = userData.user.id;
    const copyId = crypto.randomUUID();
    const copiedPaths = [];
    const sourcePaths = getProjectAssetPaths(project, userId);
    const nextState = { ...(project.editor_state ?? {}) };

    for (const sourcePath of sourcePaths) {
      const assetType = sourcePath.endsWith("/icon") ? "icon" : "background";
      const destinationPath = `${userId}/${copyId}/${assetType}`;
      const { error: copyError } = await supabase.storage
        .from(ASSET_BUCKET)
        .copy(sourcePath, destinationPath);

      if (copyError) {
        if (copiedPaths.length) await supabase.storage.from(ASSET_BUCKET).remove(copiedPaths);
        setFeedback({ type: "error", text: "Não foi possível duplicar as imagens deste print." });
        setBusyProjectId(null);
        return;
      }

      copiedPaths.push(destinationPath);
      if (assetType === "icon") nextState.appIconStoragePath = destinationPath;
      else nextState.backgroundStoragePath = destinationPath;
    }

    const { data, error: insertError } = await supabase
      .from("notification_projects")
      .insert({
        id: copyId,
        user_id: userId,
        name: getCopyName(project.name),
        editor_state: nextState,
        updated_at: new Date().toISOString(),
      })
      .select("id, name, editor_state, updated_at")
      .single();

    if (insertError) {
      if (copiedPaths.length) await supabase.storage.from(ASSET_BUCKET).remove(copiedPaths);
      setFeedback({ type: "error", text: "Não foi possível duplicar este print. Tente novamente." });
    } else {
      setProjects((current) => [data, ...current]);
      setFeedback({ type: "success", text: `“${project.name}” foi duplicado com as imagens.` });
    }
    setBusyProjectId(null);
  };

  const deleteProject = async (project) => {
    const confirmed = window.confirm(`Excluir “${project.name}” permanentemente? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    setBusyProjectId(project.id);
    setFeedback(null);
    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setBusyProjectId(null);
      router.replace("/entrar");
      return;
    }

    const assetPaths = getProjectAssetPaths(project, userData.user.id);
    if (assetPaths.length) {
      const { error: storageError } = await supabase.storage.from(ASSET_BUCKET).remove(assetPaths);
      if (storageError) {
        setFeedback({ type: "error", text: "Não foi possível excluir as imagens. O print foi mantido para você tentar novamente." });
        setBusyProjectId(null);
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from("notification_projects")
      .delete()
      .eq("id", project.id)
      .select("id")
      .single();

    if (deleteError) {
      setFeedback({ type: "error", text: "As imagens foram removidas, mas o registro não pôde ser excluído. Recarregue e tente novamente." });
    } else {
      setProjects((current) => current.filter(({ id }) => id !== project.id));
      setFeedback({ type: "success", text: `“${project.name}” e suas imagens foram excluídos.` });
    }
    setBusyProjectId(null);
  };

  return (
    <PrototypeShell current="/painel">
      <div className="page-heading"><div><p className="eyebrow">Seu espaço</p><h1>Meus prints</h1><p>Crie notificações para stories, campanhas, lançamentos e vendas.</p></div><Link className="button button-primary" href="/editor">+ Novo print</Link></div>
      <div className="dashboard-toolbar"><p className="hint">{email ? `Conta: ${email}` : "Carregando sua conta..."}</p><button className="text-link" type="button" onClick={signOut}>Sair da conta</button></div>
      {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
      {feedback && <p className={`auth-message auth-message-${feedback.type}`} role="status">{feedback.text}</p>}
      {loading ? (
        <section className="panel empty-state" aria-live="polite"><p>Carregando seus prints...</p></section>
      ) : projects.length === 0 ? (
        <section className="panel empty-state" aria-labelledby="empty-title"><span className="empty-symbol" aria-hidden="true">+</span><h2 id="empty-title">Seu primeiro print começa aqui</h2><p>Crie uma notificação simulada e salve as configurações na sua conta.</p><Link className="button button-primary" href="/editor">Criar meu primeiro print</Link></section>
      ) : (
        <div className="visual-grid">
          {projects.map((project) => {
            const values = project.editor_state?.values ?? {};
            const isBusy = busyProjectId === project.id;
            return (
              <article className="visual-card" key={project.id} aria-busy={isBusy}>
                <div className="visual-thumbnail" aria-hidden="true"><div className="mini-notification"><span>{values.appName?.slice(0, 1) || "N"}</span><div><strong>{values.title || project.name}</strong><p>{values.message || "Print salvo no Notivy."}</p></div></div></div>
                <div className="visual-card-body">
                  <span className="badge">Salvo</span><h2>{project.name}</h2><p>Atualizado em {new Intl.DateTimeFormat("pt-BR").format(new Date(project.updated_at))}</p>
                  <Link className="button button-secondary button-wide" href={`/editor/?project=${project.id}`} aria-disabled={isBusy}>Abrir print <span aria-hidden="true">→</span></Link>
                  <div className="visual-card-actions">
                    <button className="button button-quiet" type="button" disabled={busyProjectId !== null} onClick={() => duplicateProject(project)}>{isBusy ? "Aguarde..." : "Duplicar"}</button>
                    <button className="button button-danger" type="button" disabled={busyProjectId !== null} onClick={() => deleteProject(project)}>Excluir</button>
                  </div>
                </div>
              </article>
            );
          })}
          <Link className="new-visual-card" href="/editor"><span className="empty-symbol" aria-hidden="true">+</span><strong>Criar outro print</strong><span>Comece uma nova campanha</span></Link>
        </div>
      )}
      <p className="hint section-note">O banco e o Storage aplicam regras para que cada conta gerencie somente os próprios prints e imagens.</p>
    </PrototypeShell>
  );
}
