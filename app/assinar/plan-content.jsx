"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PrototypeShell from "../_components/prototype-shell";

export default function PlanContent() {
  const searchParams = useSearchParams();
  const pro = searchParams.get("plano") === "pro";

  return (
    <PrototypeShell current="/assinar">
      <div className="access-layout">
        <section className="access-intro">
          <p className="eyebrow">Seu plano, seus prints</p>
          <h1>{pro ? "Mais campanhas" : "O primeiro print"}<br /><span>começa aqui.</span></h1>
          <p className="lead">{pro ? "Após a confirmação da assinatura, você receberá acesso à sua conta, ao painel e ao editor." : "O FREE começa com a ativação gratuita da conta. Depois, você terá acesso ao painel e ao editor."}</p>
          <Link className="text-link" href="/#planos">← Comparar os planos</Link>
        </section>
        <section className="panel access-card" aria-labelledby="plan-title">
          <p className="eyebrow">Plano selecionado</p>
          <h2 id="plan-title">Notivy {pro ? "PRO" : "FREE"}</h2>
          <p className="selected-plan-price">{pro ? "R$19,90" : "R$0,00"}<small>{pro ? "/mês" : " · gratuito"}</small></p>
          <p>{pro ? "Exportações ilimitadas." : "3 exportações por mês por conta."}<br />Editor completo para stories, campanhas, cursos e vendas.</p>
          <p className="notice">Esta é uma prévia do fluxo. Nenhuma compra, ativação ou criação de conta será realizada.</p>
          <button className="button button-primary button-wide" disabled>{pro ? "Assinatura em breve" : "Ativação em breve"}</button>
          <Link className="text-link" href="/entrar">Simular próxima etapa: acesso →</Link>
          <p className="hint">Na versão final, o acesso PRO dependerá do pagamento confirmado. O FREE terá ativação sem cobrança.</p>
        </section>
      </div>
    </PrototypeShell>
  );
}
