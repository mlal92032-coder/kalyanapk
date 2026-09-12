import "./globals.css";

export const metadata = {
  title: "Kalyana — Global Products. Trusted Suppliers.",
  description: "Kalyana is a B2B marketplace connecting bulk buyers with verified suppliers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 font-sans">
        {children}
      </body>
    </html>
  );
}
