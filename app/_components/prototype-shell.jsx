import Link from "next/link";

const steps = [
  { href: "/painel", label: "Painel" },
  { href: "/editor", label: "Editor" },
];

export default function PrototypeShell({ current, children }) {
  const customerArea = current === "/painel" || current === "/editor";
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <div className="prototype-banner"><span className="prototype-dot" aria-hidden="true" />Protótipo de navegação · dados ilustrativos</div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Notivy — início"><span className="brand-name">Notivy</span></Link>
        <nav className="step-nav" aria-label={customerArea ? "Área do cliente" : "Navegação de acesso"}>
          {customerArea ? <>{steps.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={current === href ? "page" : undefined}>{label}</Link>
          ))}<Link href="/">Voltar ao site</Link></> : <Link href="/">Voltar ao site</Link>}
        </nav>
      </header>
      <main id="conteudo" className="page-container">{children}</main>
      <footer className="site-footer"><span>Notivy · prints de notificações para marketing.</span><span>Crie pelo navegador, sem instalar aplicativo e sem disparar notificações reais.</span></footer>
    </>
  );
}
