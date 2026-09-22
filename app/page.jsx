import Link from "next/link";
import Image from "next/image";
import NotificationPreview from "./_components/notification-preview";
import "./landing.css";

const features = [
  ["grid", "Um visual com a sua identidade", "App, ícone, título, mensagem e horário reunidos em uma composição feita para o seu conteúdo."],
  ["wand", "Cada detalhe é seu", "Transforme uma ideia em uma notificação com textos e elementos personalizados."],
  ["bolt", "Direto ao que importa", "Um fluxo simples para concentrar seu tempo na próxima ideia."],
  ["phone", "Pensado para stories", "Uma imagem vertical de 1080 × 1920 px, no formato dos seus conteúdos."],
  ["eye", "Acompanhe o resultado", "Uma prévia da tela inteira para conferir a composição antes de finalizar."],
];
const questions = [
  ["O que posso criar com o Notivy?", "Imagens de notificações personalizadas para stories, vídeos e demonstrações de marketing. O Notivy não envia notificações reais."],
  ["Qual é o formato da imagem?", "O editor baixa um PNG vertical de 1080 × 1920 px, com wallpaper e notificação em um layout inspirado na tela bloqueada do iPhone."],
  ["O que muda entre FREE e PRO?", "Os planos ainda não estão ativos. A proposta é oferecer os mesmos recursos visuais, com 3 exportações mensais no FREE e exportações ilimitadas no PRO por R$19,90/mês."],
  ["Preciso ter experiência com edição?", "Não. A proposta é escolher os elementos, escrever sua mensagem e conferir a composição em uma prévia."],
  ["Já posso assinar e exportar?", "Você já pode testar o editor e baixar um PNG sem conta. Assinaturas, contas e limites de exportação ainda não estão disponíveis."],
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
    <h3>Notivy {pro ? "PRO" : "FREE"}</h3><p className="n-pill">{pro ? "Para criar sem limites" : "Para suas primeiras ideias"}</p>
    <div className="n-price"><small>{pro ? "POR MÊS" : "GRÁTIS"}</small><strong><sup className="n-currency">R$</sup><span className="n-price-integer">{pro ? "19" : "0"}</span><sup className="n-price-cents">,{pro ? "90" : "00"}</sup></strong>{pro && <span>/mês</span>}</div>
    <ul>{[pro ? "Exportações ilimitadas" : "3 exportações por mês", "Todos os recursos visuais", "Personalização de texto e ícone", "Wallpaper e horário personalizados", "Imagem PNG de 1080 × 1920 px"].map(item => <li key={item}><Icon type="check" />{item}</li>)}</ul>
    <Link className="n-btn" href={pro ? "/assinar?plano=pro" : "/assinar?plano=free"}>{pro ? "Escolher PRO" : "Começar com FREE"}<Icon /></Link>
    <small className="n-plan-note">{pro ? "Preço provisório. Assinatura ainda indisponível." : "Plano previsto. Explore agora a demonstração."}</small>
  </article>;
}
export default function Home() {
  return <div className="n-landing">
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <div className="n-topbar">— &nbsp; TESTE GRÁTIS ANTES DE DECIDIR &nbsp; —</div>
    <header className="n-nav n-shell"><nav aria-label="Navegação principal"><a href="#recursos">Recursos</a><a href="#como">Como funciona</a><a href="#planos">Planos</a></nav><Link className="n-brand" href="/">Notivy</Link><Link className="n-btn n-nav-cta" href="/editor">Testar editor <Icon /></Link></header>
    <main id="conteudo">
      <section className="n-hero n-shell">
        <div><span className="n-tag"><i /> Seu próximo criativo começa no Notivy</span><h1>Notificações que fazem <em>suas ideias se destacarem.</em></h1><p>Monte sua mensagem, acompanhe o resultado na tela e prepare um visual profissional para stories, vídeos e conteúdos de marketing.</p><div className="n-actions"><Link className="n-btn" href="/editor">Testar o editor <Icon /></Link><a className="n-watch" href="#como"><Icon type="play" /> Ver como funciona</a></div><div className="n-trust">
          <div className="n-trust-avatars" aria-hidden="true"><span>R</span><span>C</span><span>L</span><span className="n-trust-more">+</span></div>
          <div className="n-trust-rating"><span className="n-trust-stars" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <svg key={index} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1.1 6.2-5.7-3-5.7 3 1.1-6.2L3.2 9.6l6.3-.9L12 3Z" /></svg>)}</span><span className="n-trust-label">Exemplo visual do protótipo</span></div>
        </div></div>
        <div className="n-hero-art"><div className="n-device"><NotificationPreview backgroundUrl="/images/iphone-generic-v4.png" editableLockScreen renderControls referenceStyle weekday="Thu" day="17" alarmTime="05:30" mainTime="13:25" /></div></div>
      </section>
      <section className="n-proof" aria-label="Características do Notivy"><div className="n-shell">{[["Seu logo", "PARA PERSONALIZAR"], ["1080 × 1920", "PNG VERTICAL"], ["Preview", "EM TEMPO REAL"], ["Um layout", "FOCO NO PRIMEIRO MVP"]].map(([value, label]) => <p key={value}><strong>{value}</strong><span>{label}</span></p>)}</div></section>
      <section className="n-section n-shell" id="recursos"><header className="n-heading"><div><span className="n-kicker">MENOS ETAPAS, MAIS IDEIAS</span><h2>Seu conteúdo.<br /><em>Do seu jeito.</em></h2></div><p>Uma experiência focada na criação de imagens de notificações, da escolha do visual à composição final.</p></header><div className="n-features">{features.map(([icon, title, description], i) => <article key={title}><small>0{i + 1}</small><div className="n-feature-icon"><Icon type={icon} /></div><h3>{title}</h3><p>{description}</p>{i === 0 && <IconStrip compact />}</article>)}</div></section>
      <section className="n-showcase"><header className="n-center n-shell"><span className="n-kicker">UMA IDENTIDADE EM CADA DETALHE</span><h2>Pequenos ícones.<br />Grandes possibilidades.</h2><p>Explore combinações para o seu conteúdo. Os nomes e símbolos exibidos pertencem às respectivas marcas e aparecem apenas como exemplos visuais.</p></header><div className="n-shell"><IconStrip /></div></section>
      <section className="n-section n-shell" id="demonstracao"><header className="n-heading"><div><span className="n-kicker">DA MENSAGEM À COMPOSIÇÃO</span><h2>Imagine na sua tela.</h2></div><p>Uma notificação, um fundo e uma ideia. Veja como esses elementos se encontram.</p></header><div className="n-stage"><div><span className="n-kicker">NOTIVY / PREVIEW</span><h3>Uma nova ideia<br />acabou de chegar.</h3><p>Crie o visual do seu próximo conteúdo.</p><Link className="n-watch" href="#como">Ver como funciona <Icon /></Link></div><NotificationPreview backgroundUrl="/images/iphone-generic-v4.png" editableLockScreen renderControls weekday="Sex" day="19" month="Jun" alarmTime="05:30" mainTime="09:41" /></div><p className="n-caption">Composição ilustrativa. Nenhuma notificação real é enviada.</p></section>
      <section className="n-section n-shell n-how" id="como"><div><span className="n-kicker">CONHEÇA O FLUXO</span><h2>Da primeira ideia<br />à imagem final.</h2><p>Um espaço para montar sua notificação e conferir cada detalhe.</p><ol>{[["Defina a aparência", "Comece pelo app, ícone e wallpaper."], ["Escreva sua mensagem", "Ajuste título, conteúdo e horário."], ["Confira a composição", "Veja o resultado no formato vertical completo."]].map(([title, text]) => <li key={title}><strong>{title}</strong><span>{text}</span></li>)}</ol><Link className="n-btn" href="/editor">Abrir o editor <Icon /></Link></div><div className="n-demo"><NotificationPreview backgroundUrl="/images/iphone-generic-v4.png" editableLockScreen renderControls weekday="Sex" day="19" month="Jun" alarmTime="05:30" mainTime="09:41" /><div className="n-demo-note"><Icon type="play" /><span><strong>Explore o Notivy</strong><small>Prévia demonstrativa do editor</small></span></div></div></section>
      <section className="n-section n-shell n-reviews" id="avaliacoes" aria-labelledby="reviews-title">
        <header className="n-heading"><div><span className="n-kicker">AVALIAÇÕES · EXEMPLOS DO PROTÓTIPO</span><h2 id="reviews-title">Quem cria, conta.</h2></div><div className="n-rating"><strong>4,9<small>/5</small></strong><div><span className="n-stars" aria-label="Nota ilustrativa: 4,9 de 5 estrelas">★★★★★</span><span className="n-rating-caption">Nota geral ilustrativa</span></div></div></header>
        <p className="n-review-disclaimer">Depoimentos fictícios para demonstrar o visual. Ainda não há avaliações de clientes publicadas.</p>
        <div className="n-review-grid">{[["A", "Ana", "Gostei de ver a ideia tomando forma na tela. O visual da notificação combina muito com os meus stories."], ["L", "Lucas", "Ter a mensagem e a prévia no mesmo lugar deixa o processo de criação muito mais claro."], ["M", "Marina", "Uma proposta prática para apresentar novidades e dar um toque diferente aos conteúdos."]].map(([initial, name, quote]) => <figure key={name}><span className="n-stars" aria-label="5 estrelas ilustrativas">★★★★★</span><blockquote>{quote}</blockquote><figcaption><span className="n-review-avatar" aria-hidden="true">{initial}</span><span><strong>{name}</strong><small>Perfil fictício · exemplo</small></span></figcaption></figure>)}</div>
      </section>
      <section className="n-section n-plans" id="planos"><div className="n-offer-copy"><span className="n-kicker">ESCOLHA SEU RITMO</span><h2>Comece no FREE.<br />Vá além com PRO.</h2><p>O mesmo cuidado com o visual. A liberdade de escolher quantas imagens criar.</p><span className="n-offer-note"><Icon type="check" /> Mesmos recursos nos dois planos</span></div><Plan /><Plan pro /></section>
      <section className="n-section n-shell n-faq" id="faq"><header><span className="n-kicker">TUDO MAIS CLARO</span><h2>Vamos tirar<br />suas dúvidas.</h2><p>Conheça a proposta do Notivy.</p></header><div>{questions.map(([question, answer], i) => <details key={question} open={i === 0}><summary>{question}<span aria-hidden="true">＋</span></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className="n-footer"><div className="n-shell"><Link className="n-brand" href="/">Notivy</Link><p>Imagens de notificações para dar forma às suas ideias.<br />Editor e exportação PNG disponíveis para teste.</p><span>© 2026 Notivy<br /><Link href="/entrar">Área demonstrativa →</Link></span></div></footer>
  </div>;
}
