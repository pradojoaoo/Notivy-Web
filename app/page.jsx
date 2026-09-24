import Link from "next/link";
import Image from "next/image";
import NotificationPreview from "./_components/notification-preview";
import "./landing.css";

const features = [
  ["grid", "Seu print, com a sua marca", "Personalize app, logo, mensagem, horário e fundo para criar uma notificação com a identidade da sua campanha."],
  ["wand", "Sem instalar aplicativo", "Faça tudo pelo navegador. Você monta a tela, confere o resultado e baixa o PNG pronto."],
  ["bolt", "Pronto em poucos minutos", "Crie uma notificação simulada com rapidez, sem montar a tela manualmente em um editor de imagens."],
  ["phone", "Feito para vender nos stories", "Exporte em 1080 × 1920 px para campanhas, lançamentos, cursos, infoprodutos e conteúdos de influenciadores."],
  ["eye", "Veja antes de baixar", "Acompanhe a tela completa em tempo real e ajuste cada detalhe antes de gerar o print."],
];
const questions = [
  ["O que posso criar com o Notivy?", "Prints simulados de notificações para stories, campanhas de vendas, lançamentos, cursos, infoprodutos, vídeos e conteúdos de influenciadores. O Notivy cria somente a imagem e não envia notificações reais."],
  ["Qual é o formato da imagem?", "O editor baixa um PNG vertical de 1080 × 1920 px, com wallpaper e notificação em um layout inspirado na tela bloqueada do iPhone."],
  ["O que muda entre FREE e PRO?", "Os planos ainda não estão ativos. A proposta é oferecer os mesmos recursos visuais, com 1 exportação mensal no FREE e exportações ilimitadas no PRO por R$19,90/mês."],
  ["Preciso instalar algum aplicativo?", "Não. O editor funciona direto no navegador. Escolha os elementos, escreva sua mensagem e baixe o PNG pronto, sem instalar nada no celular."],
  ["Já posso criar uma conta e exportar?", "Sim. Você pode criar uma conta gratuita, salvar seus prints e baixar o PNG. Assinaturas PRO e limites mensais de exportação ainda não estão ativos."],
];
function Icon({ type = "arrow" }) {
  const paths = { arrow: "M5 12h14m-6-6 6 6-6 6", grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z", wand: "m4 20 14-14 2 2L6 22zM5 3v6M2 6h6m10 9v6m-3-3h6", bolt: "m13 2-9 12h7l-1 8 10-13h-8z", phone: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3 17h4", eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm7 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0", check: "m5 12 4 4L19 6", play: "m8 4 12 8-12 8z" };
  return <svg className="n-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[type]} /></svg>;
}
function IconStrip({ compact = false }) {
  return <div className={`n-icon-strip ${compact ? "n-icon-strip-compact" : ""}`}><Image src="/images/icones-notivy.jpeg" width={1208} height={273} sizes={compact ? "460px" : "(max-width: 760px) 100vw, 1208px"} alt={compact ? "" : "Seleção visual de ícones de aplicativos disponíveis como referência"} aria-hidden={compact || undefined} /></div>;
}
function Plan({ pro = false }) {
  return <article className={`n-pricecard ${pro ? "n-pro" : ""}`}>
    <span className="n-plan-label">{pro ? "MAIS LIBERDADE" : "COMECE POR AQUI"}</span>
    <h3>Notivy {pro ? "PRO" : "FREE"}</h3><p className="n-pill">{pro ? "Para campanhas sem limites" : "Para seus primeiros prints"}</p>
    <div className="n-price"><small>{pro ? "POR MÊS" : "GRÁTIS"}</small><strong><sup className="n-currency">R$</sup><span className="n-price-integer">{pro ? "19" : "0"}</span><sup className="n-price-cents">,{pro ? "90" : "00"}</sup></strong>{pro && <span>/mês</span>}</div>
    <ul>{[pro ? "Exportações ilimitadas" : "1 exportação por mês", "Todos os recursos visuais", "Personalização de texto e ícone", "Wallpaper e horário personalizados", "Imagem PNG de 1080 × 1920 px"].map(item => <li key={item}><Icon type="check" />{item}</li>)}</ul>
    <Link className="n-btn" href={pro ? "/assinar?plano=pro" : "/assinar?plano=free"}>{pro ? "Escolher PRO" : "Começar com FREE"}<Icon /></Link>
    <small className="n-plan-note">{pro ? "Preço provisório. Assinatura ainda indisponível." : "Plano previsto. Explore agora a demonstração."}</small>
  </article>;
}
export default function Home() {
  return <div className="n-landing">
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <div className="n-topbar">— &nbsp; CRIE SEU PRINT DIRETO NO NAVEGADOR &nbsp; —</div>
    <header className="n-nav n-shell"><nav aria-label="Navegação principal"><a href="#recursos">Recursos</a><a href="#como">Como funciona</a><a href="#planos">Planos</a></nav><Link className="n-brand" href="/">Notivy</Link><Link className="n-btn n-nav-cta" href="/editor">Criar meu print <Icon /></Link></header>
    <main id="conteudo">
      <section className="n-hero n-shell">
        <div><span className="n-tag"><i /> Prints de notificações sem instalar nada</span><h1>Crie notificações falsas <em>para stories que vendem.</em></h1><p>Monte um print realista direto no navegador e use em campanhas, lançamentos, cursos, vendas e conteúdos de influenciadores. Simples, rápido e sem baixar aplicativo no celular.</p><div className="n-actions"><Link className="n-btn" href="/editor">Criar meu print <Icon /></Link><a className="n-watch" href="#como"><Icon type="play" /> Ver como funciona</a></div><div className="n-trust">
          <div className="n-trust-avatars" aria-hidden="true"><span>R</span><span>C</span><span>L</span><span className="n-trust-more">+</span></div>
          <div className="n-trust-rating"><span className="n-trust-stars" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <svg key={index} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1.1 6.2-5.7-3-5.7 3 1.1-6.2L3.2 9.6l6.3-.9L12 3Z" /></svg>)}</span><span className="n-trust-label">Exemplo visual do protótipo</span></div>
        </div></div>
        <div className="n-hero-art"><div className="n-device"><NotificationPreview backgroundUrl="/images/iphone-generic-v4.png" editableLockScreen renderControls referenceStyle weekday="Thu" day="17" alarmTime="05:30" mainTime="13:25" clockSize={78} /></div></div>
      </section>
      <section className="n-proof" aria-label="Características do Notivy"><div className="n-shell">{[["Sem instalar", "DIRETO NO NAVEGADOR"], ["1080 × 1920", "PNG PARA STORIES"], ["Preview", "EM TEMPO REAL"], ["Poucos minutos", "DO TEXTO AO PRINT"]].map(([value, label]) => <p key={value}><strong>{value}</strong><span>{label}</span></p>)}</div></section>
      <section className="n-section n-shell" id="recursos"><header className="n-heading"><div><span className="n-kicker">SEM APLICATIVO, SEM COMPLICAÇÃO</span><h2>Seu print.<br /><em>Sua campanha.</em></h2></div><p>Crie notificações simuladas para chamar atenção, apresentar resultados e reforçar ofertas em conteúdos de marketing.</p></header><div className="n-features">{features.map(([icon, title, description], i) => <article key={title}><small>0{i + 1}</small><div className="n-feature-icon"><Icon type={icon} /></div><h3>{title}</h3><p>{description}</p>{i === 0 && <IconStrip compact />}</article>)}</div></section>
      <section className="n-showcase"><header className="n-center n-shell"><span className="n-kicker">SUA MARCA DENTRO DO PRINT</span><h2>Escolha o app.<br />Personalize a mensagem.</h2><p>Use um ícone pronto ou envie seu próprio logo para criar uma notificação alinhada à campanha. Os nomes e símbolos exibidos pertencem às respectivas marcas e aparecem apenas como exemplos visuais.</p></header><div className="n-shell"><IconStrip /></div></section>
      <section className="n-section n-shell" id="demonstracao"><header className="n-heading"><div><span className="n-kicker">UM PRINT PRONTO PARA PUBLICAR</span><h2>Da mensagem ao story.</h2></div><p>Combine uma notificação, seu wallpaper e a oferta que você quer comunicar.</p></header><div className="n-stage"><div><span className="n-kicker">NOTIVY / PREVIEW</span><h3>Sua campanha<br />acabou de chegar.</h3><p>Crie o print que vai aparecer no seu próximo story.</p><Link className="n-watch" href="#como">Ver como funciona <Icon /></Link></div><NotificationPreview backgroundUrl="/images/iphone-generic-v4.png" editableLockScreen renderControls weekday="Sex" day="19" month="Jun" alarmTime="05:30" mainTime="09:41" /></div><p className="n-caption">Print simulado para uso criativo. Nenhuma notificação real é enviada.</p></section>
      <section className="n-section n-shell n-how" id="como"><div><span className="n-kicker">SIMPLES E RÁPIDO</span><h2>Do navegador<br />para o seu story.</h2><p>Sem instalar aplicativo e sem precisar montar a tela do zero.</p><ol>{[["Escolha a aparência", "Defina app, logo, wallpaper e horário."], ["Escreva sua oferta", "Personalize título e mensagem para sua campanha."], ["Baixe o print", "Confira a prévia e gere o PNG em 1080 × 1920 px."]].map(([title, text]) => <li key={title}><strong>{title}</strong><span>{text}</span></li>)}</ol><Link className="n-btn" href="/editor">Criar meu print <Icon /></Link></div><div className="n-demo"><NotificationPreview backgroundUrl="/images/iphone-generic-v4.png" editableLockScreen renderControls weekday="Sex" day="19" month="Jun" alarmTime="05:30" mainTime="09:41" /><div className="n-demo-note"><Icon type="play" /><span><strong>Crie no Notivy</strong><small>Sem instalar nada no celular</small></span></div></div></section>
      <section className="n-section n-shell n-reviews" id="avaliacoes" aria-labelledby="reviews-title">
        <header className="n-heading"><div><span className="n-kicker">AVALIAÇÕES · EXEMPLOS DO PROTÓTIPO</span><h2 id="reviews-title">Quem vende, cria.</h2></div><div className="n-rating"><strong>4,9<small>/5</small></strong><div><span className="n-stars" aria-label="Nota ilustrativa: 4,9 de 5 estrelas">★★★★★</span><span className="n-rating-caption">Nota geral ilustrativa</span></div></div></header>
        <p className="n-review-disclaimer">Depoimentos fictícios para demonstrar o visual. Ainda não há avaliações de clientes publicadas.</p>
        <div className="n-review-grid">{[["A", "Ana", "Consigo montar um print para divulgar meu curso e publicar no story sem precisar instalar outro aplicativo."], ["L", "Lucas", "Personalizar a mensagem e ver a tela pronta deixa a criação da campanha muito mais rápida."], ["M", "Marina", "Uma forma prática de criar notificações para lançamentos, ofertas e conteúdos de influenciadores."]].map(([initial, name, quote]) => <figure key={name}><span className="n-stars" aria-label="5 estrelas ilustrativas">★★★★★</span><blockquote>{quote}</blockquote><figcaption><span className="n-review-avatar" aria-hidden="true">{initial}</span><span><strong>{name}</strong><small>Perfil fictício · exemplo</small></span></figcaption></figure>)}</div>
      </section>
      <section className="n-section n-plans" id="planos"><div className="n-offer-copy"><span className="n-kicker">ESCOLHA SEU RITMO</span><h2>Comece no FREE.<br />Crie mais com PRO.</h2><p>Faça seus primeiros prints para stories e escolha a quantidade de campanhas que deseja criar.</p><span className="n-offer-note"><Icon type="check" /> Mesmos recursos nos dois planos</span></div><Plan /><Plan pro /></section>
      <section className="n-section n-shell n-faq" id="faq"><header><span className="n-kicker">TUDO MAIS CLARO</span><h2>Vamos tirar<br />suas dúvidas.</h2><p>Veja como criar seus prints no Notivy.</p></header><div>{questions.map(([question, answer], i) => <details key={question} open={i === 0}><summary>{question}<span aria-hidden="true">＋</span></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className="n-footer"><div className="n-shell"><Link className="n-brand" href="/">Notivy</Link><p>Prints simulados de notificações para stories, campanhas e vendas.<br />Crie pelo navegador e baixe em PNG.</p><span>© 2026 Notivy<br /><Link href="/entrar">Área demonstrativa →</Link></span></div></footer>
  </div>;
}
