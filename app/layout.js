import "./globals.css";

export const metadata = {
  title: "FirzzPay",
  description: "Dompet digital demo FirzzPay",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
