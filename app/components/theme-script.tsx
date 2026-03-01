import Script from "next/script";

export const ThemeScript = () => (
  <Script
    id="theme-init"
    strategy="beforeInteractive"
    dangerouslySetInnerHTML={{
      __html: `(function(){var e=localStorage.getItem("jsonic-theme");var m=window.matchMedia("(prefers-color-scheme: dark)");var t=e||(m.matches?"dark":"light");document.documentElement.classList.toggle("dark",t==="dark");})();`,
    }}
  />
);
