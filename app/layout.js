import "./globals.css";

export const metadata = {
  title: "Smart Drawio",
  description: "AI 驱动的图表生成",
};

// Anti-flash script for theme
const themeScript = `
(function() {
  try {
    var mode = localStorage.getItem('smart-drawio-theme-mode');
    if (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) || (!mode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.dataset.theme = 'dark';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          suppressHydrationWarning
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
