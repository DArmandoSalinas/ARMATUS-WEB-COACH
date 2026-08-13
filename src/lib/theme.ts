export type ThemeMode = "studio" | "clara";

export const THEME_KEY = "armatus-view-mode";
export const THEME_EVENT = "armatus-view-mode";

export function readTheme(): ThemeMode {
  try {
    return window.localStorage.getItem(THEME_KEY) === "clara"
      ? "clara"
      : "studio";
  } catch {
    return "studio";
  }
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", mode);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", mode === "clara" ? "#F7F4EE" : "#000000");
  }
}

export function setTheme(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_KEY, mode);
  } catch {
    /* private mode / quota */
  }
  applyTheme(mode);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function subscribeTheme(onChange: () => void) {
  const wrap = () => {
    applyTheme(readTheme());
    onChange();
  };
  window.addEventListener(THEME_EVENT, wrap);
  window.addEventListener("storage", wrap);
  return () => {
    window.removeEventListener(THEME_EVENT, wrap);
    window.removeEventListener("storage", wrap);
  };
}

export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="clara"){document.documentElement.setAttribute("data-theme","clara");}}catch(e){}})();`;
