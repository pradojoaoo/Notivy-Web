import "./globals.css";
import SiteMotion from "./_components/site-motion";

export const metadata = {
  title: "Notivy",
  description: "Crie visuais de notificações personalizadas para seus criativos.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body><SiteMotion />{children}</body>
    </html>
  );
}
