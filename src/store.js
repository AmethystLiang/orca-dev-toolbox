// Saved panel state: pinned and recent tools, and the open tool.
// Orca's own plugin storage (the storage:own capability) keeps them in a file per plugin.
// localStorage is the fallback: for frames without orca.storage, and to carry over what 0.7.0
// saved there. Some frames refuse localStorage entirely, so every access is guarded.

function host() {
  try {
    return globalThis.orca?.storage ?? null
  } catch {
    return null
  }
}

function local(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}

/** The saved value, or null. */
export async function load(key) {
  const storage = host()
  if (storage) {
    try {
      const value = await storage.get(key)
      if (value !== null && value !== undefined) return value
    } catch {}
  }
  return local(key)
}

export function save(key, value) {
  const storage = host()
  if (storage) {
    try {
      storage.set(key, value).catch(() => {})
    } catch {}
    return
  }
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}
