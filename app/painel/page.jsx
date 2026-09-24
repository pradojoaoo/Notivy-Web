"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PrototypeShell from "../_components/prototype-shell";
import { getSupabaseBrowserClient } from "../_lib/supabase-client";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <PrototypeShell current="/painel">
      <div className="page-heading"><div><p className="eyebrow">Seu espaço</p><h1>Meus prints</h1><p>Crie notificações para stories, campanhas, lançamentos e vendas.</p></div><Link className="button button-primary" href="/editor">+ Novo print</Link></div>
      <div className="dashboard-toolbar"><p className="hint">{email ? `Conta: ${email}` : "Carregando sua conta..."}</p><button className="text-link" type="button" onClick={signOut}>Sair da conta</button></div>
      {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
      {loading ? (
        <section className="panel empty-state" aria-live="polite"><p>Carregando seus prints...</p></section>
      ) : projects.length === 0 ? (
        <section className="panel empty-state" aria-labelledby="empty-title"><span className="empty-symbol" aria-hidden="true">+</span><h2 id="empty-title">Seu primeiro print começa aqui</h2><p>Crie uma notificação simulada e salve as configurações na sua conta.</p><Link className="button button-primary" href="/editor">Criar meu primeiro print</Link></section>
      ) : (
        <div className="visual-grid">
          {projects.map((project) => {
            const values = project.editor_state?.values ?? {};
            return <article className="visual-card" key={project.id}><div className="visual-thumbnail" aria-hidden="true"><div className="mini-notification"><span>{values.appName?.slice(0, 1) || "N"}</span><div><strong>{values.title || project.name}</strong><p>{values.message || "Print salvo no Notivy."}</p></div></div></div><div className="visual-card-body"><span className="badge">Salvo</span><h2>{project.name}</h2><p>Atualizado em {new Intl.DateTimeFormat("pt-BR").format(new Date(project.updated_at))}</p><Link className="button button-secondary button-wide" href={`/editor/?project=${project.id}`}>Abrir print <span aria-hidden="true">→</span></Link></div></article>;
          })}
          <Link className="new-visual-card" href="/editor"><span className="empty-symbol" aria-hidden="true">+</span><strong>Criar outro print</strong><span>Comece uma nova campanha</span></Link>
        </div>
      )}
      <p className="hint section-note">O banco aplica regras para que cada conta consulte somente os próprios prints.</p>
    </PrototypeShell>
  );
}

