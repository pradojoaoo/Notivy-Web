"use client";

import { useState } from "react";
import Link from "next/link";
import PrototypeShell from "../_components/prototype-shell";

export default function DashboardPage() {
  const [empty, setEmpty] = useState(false);
  return (
    <PrototypeShell current="/painel">
      <div className="page-heading"><div><p className="eyebrow">Seu espaço</p><h1>Meus visuais</h1><p>Um lugar para criar e revisitar suas ideias.</p></div><Link className="button button-primary" href="/editor">+ Novo visual</Link></div>
      <div className="dashboard-toolbar"><p className="hint">Área do cliente demonstrativa · nenhum plano foi ativado.</p><button className="text-link" type="button" aria-pressed={empty} onClick={() => setEmpty(!empty)}>{empty ? "Mostrar exemplo" : "Ver painel vazio"}</button></div>
      {empty ? (
        <section className="panel empty-state" aria-labelledby="empty-title"><span className="empty-symbol" aria-hidden="true">+</span><h2 id="empty-title">Sua primeira ideia começa aqui</h2><p>Crie um visual de notificação para o seu próximo story.</p><Link className="button button-primary" href="/editor">Criar meu primeiro visual</Link></section>
      ) : (
        <div className="visual-grid">
          <article className="visual-card"><div className="visual-thumbnail" aria-hidden="true"><div className="mini-notification"><span>M</span><div><strong>Nova coleção</strong><p>As novidades chegaram.</p></div></div></div><div className="visual-card-body"><span className="badge">Exemplo ilustrativo</span><h2>Nova coleção</h2><p>Vertical · 1080 × 1920 px</p><Link className="button button-secondary button-wide" href="/editor">Abrir exemplo <span aria-hidden="true">→</span></Link></div></article>
          <Link className="new-visual-card" href="/editor"><span className="empty-symbol" aria-hidden="true">+</span><strong>Criar outro visual</strong><span>Comece com uma nova ideia</span></Link>
        </div>
      )}
      <p className="hint section-note">O exemplo não é um arquivo salvo. Salvar, duplicar e excluir serão adicionados quando as contas estiverem disponíveis.</p>
    </PrototypeShell>
  );
}

