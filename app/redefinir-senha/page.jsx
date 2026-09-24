"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PrototypeShell from "../_components/prototype-shell";
import { getSupabaseBrowserClient } from "../_lib/supabase-client";

export default function ResetPasswordPage() {
  const [checkingLink, setCheckingLink] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const linkError = hash.get("error_description");

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setCanReset(true);
        setCheckingLink(false);
        setMessage("");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setCanReset(true);
      } else if (linkError) {
        setMessage("Este link expirou ou já foi utilizado. Solicite um novo link.");
      }
      setCheckingLink(false);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const updatePassword = async (event) => {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setMessage("As senhas digitadas não são iguais.");
      return;
    }

    setSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setSubmitting(false);
      setMessage("Não foi possível alterar a senha. Solicite um novo link e tente novamente.");
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    setSubmitting(false);
    setComplete(true);
  };

  return (
    <PrototypeShell current="/entrar">
      <div className="access-layout">
        <section className="access-intro"><p className="eyebrow">Segurança da conta</p><h1>Crie uma nova<br /><span>senha de acesso.</span></h1><p className="lead">O link recebido por e-mail confirma que esta conta pertence a você.</p><Link className="text-link" href="/entrar">← Voltar para entrar</Link></section>
        <section className="panel access-card" aria-labelledby="reset-title">
          <h2 id="reset-title">Redefinir senha</h2>
          {checkingLink ? (
            <p className="hint" aria-live="polite">Validando seu link seguro...</p>
          ) : complete ? (
            <div className="reset-complete"><p className="auth-message auth-message-success" role="status">Senha alterada com sucesso. Entre novamente usando a nova senha.</p><Link className="button button-primary button-wide" href="/entrar">Entrar no Notivy <span aria-hidden="true">→</span></Link></div>
          ) : canReset ? (
            <form onSubmit={updatePassword}>
              <p className="hint" id="reset-note">Use pelo menos 8 caracteres e não reutilize a senha de outro serviço.</p>
              <fieldset disabled={submitting} aria-describedby="reset-note reset-message">
                <legend className="sr-only">Nova senha</legend>
                <label>Nova senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" minLength={8} required /></label>
                <label>Confirmar nova senha<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Digite novamente" autoComplete="new-password" minLength={8} required /></label>
              </fieldset>
              <button className="button button-primary button-wide" type="submit" disabled={submitting}>{submitting ? "Alterando..." : "Salvar nova senha"} <span aria-hidden="true">→</span></button>
            </form>
          ) : (
            <div><p className="auth-message auth-message-error" id="reset-message" role="alert">{message || "Este link não é válido ou expirou."}</p><Link className="button button-secondary button-wide reset-request-link" href="/entrar">Solicitar outro link</Link></div>
          )}
          {message && canReset && <p className="auth-message auth-message-error" id="reset-message" role="alert">{message}</p>}
        </section>
      </div>
    </PrototypeShell>
  );
}
