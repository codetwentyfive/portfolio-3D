let pending: Promise<SCWidgetFactory> | null = null;

export function loadSoundCloudApi(): Promise<SCWidgetFactory> {
  if (window.SC?.Widget) return Promise.resolve(window.SC.Widget);
  if (pending) return pending;
  pending = new Promise<SCWidgetFactory>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    const timer = window.setTimeout(fail, 12000);
    function fail() {
      window.clearTimeout(timer);
      script.onload = script.onerror = null;
      script.remove();
      reject(new Error("SoundCloud API unavailable"));
    }
    script.onload = () => {
      if (!window.SC?.Widget) {
        fail();
        return;
      }
      window.clearTimeout(timer);
      script.onload = script.onerror = null;
      resolve(window.SC.Widget);
    };
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    pending = null; // A retry must make a new request, not await a failed script.
    throw error;
  });
  return pending;
}
