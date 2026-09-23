"use client";

import { useState } from "react";
import Link from "next/link";
import PrototypeShell from "../_components/prototype-shell";

export default function AccessPage() {
  const [creatingAccount, setCreatingAccount] = useState(false);
  return (
    <PrototypeShell current="/entrar">
      <div className="access-layout">
        <section className="access-intro"><p className="eyebrow">Área do cliente</p><h1>Seus prints<br /><span>em um só lugar.</span></h1><p className="lead">Acesse sua conta para encontrar suas notificações, criar novas campanhas e abrir o editor. O acesso PRO será liberado após a confirmação da assinatura.</p><Link className="text-link" href="/#planos">Ainda não escolheu um plano? Conheça os planos →</Link></section>
        <section className="panel access-card" aria-labelledby="access-title">
          <div className="segmented-control" role="group" aria-label="Tipo de acesso"><button type="button" aria-pressed={!creatingAccount} onClick={() => setCreatingAccount(false)}>Entrar</button><button type="button" aria-pressed={creatingAccount} onClick={() => setCreatingAccount(true)}>Primeiro acesso</button></div>
          <h2 id="access-title">{creatingAccount ? "Crie seu espaço" : "Bom ter você de volta"}</h2>
          <p className="hint" id="access-note">Esta tela é demonstrativa. Nenhum dado de acesso é coletado e nenhuma conta será criada.</p>
          <fieldset disabled aria-describedby="access-note">
            <legend className="sr-only">Campos previstos para {creatingAccount ? "cadastro" : "login"}</legend>
            {creatingAccount && <label>Nome<input type="text" placeholder="Seu nome" autoComplete="off" /></label>}
            <label>E-mail<input type="email" placeholder="voce@exemplo.com" autoComplete="off" /></label>
            <label>Senha<input type="password" placeholder="Sua senha" autoComplete="off" /></label>
          </fieldset>
          <Link className="button button-primary button-wide" href="/painel">Explorar painel de demonstração <span aria-hidden="true">→</span></Link>
          <p className="hint centered">Você pode navegar sem informar seus dados.</p>
        </section>
      </div>
    </PrototypeShell>
  );
}
