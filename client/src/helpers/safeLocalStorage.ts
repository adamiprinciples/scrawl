let available: boolean | null = null;
let memoryStorage: any = {};

function localStorageAvailable(context): boolean {
  if (available !== null) {
    return available;
  }

  context.memoryStorage = {};

  if (typeof localStorage === "undefined") {
    return false;
  }

  const key = "__localstorage_test__";

  try {
    localStorage.setItem(key, key);
    localStorage.removeItem(key);
    available = true;
  } catch (err) {
    available = false;
  }

  return available;
}

export namespace SafeLocalStorage {
  export function getItem(key: string): string | null {
    if (localStorageAvailable(this)) {
      return localStorage.getItem(key);
    } else {
      return this.memoryStorage[key];
    }
  }

  export function setItem(key: string, value: string): void {
    if (localStorageAvailable(this)) {
      localStorage.setItem(key, value);
    } else {
      this.memoryStorage[key] = value;
    }
  }

  export function removeItem(key: string): void {
    if (localStorageAvailable(this)) {
      localStorage.removeItem(key);
    } else {
      delete this.memoryStorage[key];
    }
  }

  export function clear(): void {
    if (localStorageAvailable(this)) {
      localStorage.clear();
    } else {
      this.memoryStorage = {};
    }
  }
}
