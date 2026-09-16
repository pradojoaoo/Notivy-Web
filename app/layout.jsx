import "./globals.css";

export const metadata = {
  title: "Notivy",
  description: "Crie visuais de notificações personalizadas para seus criativos.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
