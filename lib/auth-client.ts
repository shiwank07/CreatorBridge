export function clearBranzzoClientState() {
  if (typeof window === "undefined") return;

  for (const storage of [window.localStorage, window.sessionStorage]) {
    const keysToRemove: string[] = [];

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith("branzzo:")) keysToRemove.push(key);
    }

    keysToRemove.forEach((key) => storage.removeItem(key));
  }
}
