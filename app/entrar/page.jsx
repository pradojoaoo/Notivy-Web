"use client";

import { useEffect, useRef, useState } from "react";
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

function safeReturnPath(value) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/painel";
  return value;
}

export default function AccessPage() {
  const router = useRouter();
  const returnPath = useRef("/painel");
  const [mode, setMode] = useState("login");
  const [exportIntent, setExportIntent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const params = new URL(window.location.href).searchParams;
    const nextPath = safeReturnPath(params.get("next"));
    const shouldExport = params.get("intent") === "export";
    returnPath.current = nextPath;
    const displayTimer = setTimeout(() => {
      setExportIntent(shouldExport);
      if (shouldExport) setMode("signup");
    }, 0);

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(nextPath);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace(returnPath.current);
    });
    return () => {
      clearTimeout(displayTimer);
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const creatingAccount = mode === "signup";
  const recoveringPassword = mode === "recovery";

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setMessage("");
  };

  const submitAccess = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    if (recoveringPassword) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha/`,
      });
      setSubmitting(false);
      if (error) {
        setMessageType("error");
        setMessage(translateAuthError(error.message));
        return;
      }
      setMessageType("success");
      setMessage("Se existir uma conta com este e-mail, você receberá um link para criar uma nova senha.");
      return;
    }

    const result = creatingAccount
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/entrar/?intent=${exportIntent ? "export" : "access"}&next=${encodeURIComponent(returnPath.current)}`,
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (result.error) {
      setMessageType("error");
      setMessage(translateAuthError(result.error.message));
      return;
    }

    if (result.data.session) {
      router.push(returnPath.current);
      return;
    }

    setMessageType("success");
    setMessage("Conta criada. Confira seu e-mail para confirmar o acesso.");
  };

  return (
    <PrototypeShell current="/entrar">
      <div className="access-layout">
        <section className="access-intro"><p className="eyebrow">Área do cliente</p><h1>{exportIntent ? <>Seu print está<br /><span>quase pronto.</span></> : <>Seus prints<br /><span>em um só lugar.</span></>}</h1><p className="lead">{exportIntent ? "Crie uma conta gratuitamente para exportar." : "Crie uma conta gratuita para salvar suas notificações e encontrá-las novamente no painel."}</p>{exportIntent ? <Link className="text-link" href="/editor/?resume=export">← Voltar para a edição</Link> : <Link className="text-link" href="/#planos">Conheça os planos →</Link>}</section>
        <section className="panel access-card" aria-labelledby="access-title">
          {!recoveringPassword && <div className="segmented-control" role="group" aria-label="Tipo de acesso"><button type="button" aria-pressed={mode === "login"} onClick={() => changeMode("login")}>Entrar</button><button type="button" aria-pressed={creatingAccount} onClick={() => changeMode("signup")}>Primeiro acesso</button></div>}
          <h2 id="access-title">{recoveringPassword ? "Recupere seu acesso" : creatingAccount ? "Crie seu espaço" : "Bom ter você de volta"}</h2>
          <p className="hint" id="access-note">{recoveringPassword ? "Informe seu e-mail para receber um link seguro de redefinição." : creatingAccount ? exportIntent ? "Crie sua conta e volte para a edição sem perder as alterações." : "O cadastro gratuito usa e-mail e senha." : exportIntent ? "Entre e volte para a edição sem perder as alterações." : "Entre para acessar os prints vinculados à sua conta."}</p>
          <form onSubmit={submitAccess}>
            <fieldset disabled={submitting} aria-describedby="access-note access-message">
              <legend className="sr-only">Campos para {recoveringPassword ? "recuperação de senha" : creatingAccount ? "cadastro" : "login"}</legend>
              {creatingAccount && <label>Nome<input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" autoComplete="name" required /></label>}
              <label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" autoComplete="email" required /></label>
              {!recoveringPassword && <label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete={creatingAccount ? "new-password" : "current-password"} minLength={8} required /></label>}
            </fieldset>
            <button className="button button-primary button-wide" type="submit" disabled={submitting}>{submitting ? "Aguarde..." : recoveringPassword ? "Enviar link seguro" : creatingAccount ? "Criar conta gratuita" : "Entrar"} <span aria-hidden="true">→</span></button>
          </form>
          {mode === "login" && <button className="text-link access-recovery-link" type="button" onClick={() => changeMode("recovery")}>Esqueci minha senha</button>}
          {recoveringPassword && <button className="text-link access-recovery-link" type="button" onClick={() => changeMode("login")}>← Voltar para entrar</button>}
          {message && <p className={`auth-message auth-message-${messageType}`} id="access-message" role={messageType === "error" ? "alert" : "status"}>{message}</p>}
          <p className="hint centered">A criação da conta não ativa cobrança.</p>
        </section>
      </div>
    </PrototypeShell>
  );
}
