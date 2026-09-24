"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PrototypeShell from "../_components/prototype-shell";
import { getSupabaseBrowserClient } from "../_lib/supabase-client";

function translateAuthError(message) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (normalized.includes("user already registered")) return "Já existe uma conta com este e-mail.";
  if (normalized.includes("password should be")) return "A senha precisa ter pelo menos 8 caracteres.";
  if (normalized.includes("email rate limit")) return "Muitas tentativas por e-mail. Aguarde alguns minutos.";
  return "Não foi possível concluir o acesso. Tente novamente.";
}

export default function AccessPage() {
  const router = useRouter();
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/painel");
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/painel");
    });
    return () => authListener.subscription.unsubscribe();
  }, [router]);

  const changeMode = (nextCreatingAccount) => {
    setCreatingAccount(nextCreatingAccount);
    setMessage("");
  };

  const submitAccess = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    const result = creatingAccount
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (result.error) {
      setMessageType("error");
      setMessage(translateAuthError(result.error.message));
      return;
    }

    if (result.data.session) {
      router.push("/painel");
      return;
    }

    setMessageType("success");
    setMessage("Conta criada. Confira seu e-mail para confirmar o acesso.");
  };

  return (
    <PrototypeShell current="/entrar">
      <div className="access-layout">
        <section className="access-intro"><p className="eyebrow">Área do cliente</p><h1>Seus prints<br /><span>em um só lugar.</span></h1><p className="lead">Crie uma conta gratuita para salvar suas notificações e encontrá-las novamente no painel.</p><Link className="text-link" href="/#planos">Ainda não escolheu um plano? Conheça os planos →</Link></section>
        <section className="panel access-card" aria-labelledby="access-title">
          <div className="segmented-control" role="group" aria-label="Tipo de acesso"><button type="button" aria-pressed={!creatingAccount} onClick={() => changeMode(false)}>Entrar</button><button type="button" aria-pressed={creatingAccount} onClick={() => changeMode(true)}>Primeiro acesso</button></div>
          <h2 id="access-title">{creatingAccount ? "Crie seu espaço" : "Bom ter você de volta"}</h2>
          <p className="hint" id="access-note">{creatingAccount ? "O cadastro gratuito usa e-mail e senha." : "Entre para acessar os prints vinculados à sua conta."}</p>
          <form onSubmit={submitAccess}>
            <fieldset disabled={submitting} aria-describedby="access-note access-message">
              <legend className="sr-only">Campos para {creatingAccount ? "cadastro" : "login"}</legend>
              {creatingAccount && <label>Nome<input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" autoComplete="name" required /></label>}
              <label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" autoComplete="email" required /></label>
              <label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete={creatingAccount ? "new-password" : "current-password"} minLength={8} required /></label>
            </fieldset>
            <button className="button button-primary button-wide" type="submit" disabled={submitting}>{submitting ? "Aguarde..." : creatingAccount ? "Criar conta gratuita" : "Entrar"} <span aria-hidden="true">→</span></button>
          </form>
          {message && <p className={`auth-message auth-message-${messageType}`} id="access-message" role={messageType === "error" ? "alert" : "status"}>{message}</p>}
          <p className="hint centered">A criação da conta não ativa cobrança.</p>
        </section>
      </div>
    </PrototypeShell>
  );
}
