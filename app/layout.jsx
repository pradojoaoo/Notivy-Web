import "./globals.css";
import SiteMotion from "./_components/site-motion";

export const metadata = {
  title: "Notivy — Prints de notificações para marketing",
  description: "Crie prints realistas de notificações pelo navegador, sem instalar nada no celular, para stories, campanhas, vendas, cursos e conteúdos de influenciadores.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body><SiteMotion />{children}</body>
    </html>
  );
}
