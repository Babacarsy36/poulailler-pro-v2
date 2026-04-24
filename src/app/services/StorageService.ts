/**
 * StorageService - Centralized localStorage management with obfuscation.
 * Provides a secure layer over browser's localStorage.
 */

const PREFIX = "pp_"; // Poulailler Pro prefix

export const StorageService = {
  /**
   * Encodes a string to base64.
   */
  encode(data: string): string {
    try {
      return btoa(unescape(encodeURIComponent(data)));
    } catch (e) {
      return data;
    }
  },

  /**
   * Decodes a base64 string.
   */
  decode(data: string): string {
    try {
      return decodeURIComponent(escape(atob(data)));
    } catch (e) {
      return data;
    }
  },

  /**
   * Saves data to localStorage with obfuscation.
   */
  setItem<T>(key: string, value: T): void {
    const stringValue = JSON.stringify(value);
    const encodedValue = this.encode(stringValue);
    localStorage.setItem(PREFIX + key, encodedValue);
  },

  /**
   * Retrieves data from localStorage and decodes it.
   */
  getItem<T>(key: string): T | null {
    const encodedValue = localStorage.getItem(PREFIX + key);
    if (!encodedValue) {
      // Fallback to legacy key
      const rawValue = localStorage.getItem(key);
      if (rawValue) {
        try {
          const data = JSON.parse(rawValue) as T;
          // PERSIST MIGRATION: Save it in new format immediately
          this.setItem(key, data);
          return data;
        } catch (e) {
          return null;
        }
      }
      return null;
    }

    try {
      const decodedValue = this.decode(encodedValue);
      return JSON.parse(decodedValue) as T;
    } catch (e) {
      console.error(`Error decoding storage key: ${key}`, e);
      return null;
    }
  },

  /**
   * Removes an item from storage.
   */
  removeItem(key: string): void {
    localStorage.removeItem(PREFIX + key);
    localStorage.removeItem(key); // Also remove legacy key
  },

  /**
   * Clears all Poulailler Pro related items.
   */
  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(PREFIX) || ["theme", "poultry_type", "poultry_breed"].includes(key))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  /**
   * Migrates all legacy keys to the new format.
   */
  migrateAll(): void {
    // 1. Map 'transactions' to 'finances' if needed
    const oldTransactions = this.getItem<any[]>("transactions");
    if (oldTransactions && oldTransactions.length > 0) {
      const currentFinances = this.getItem<any[]>("finances") || [];
      if (currentFinances.length === 0) {
        this.setItem("finances", oldTransactions);
        console.log("Migrated transactions to finances successfully.");
      }
    }

    const legacyKeys = ["chickens", "eggs", "feed", "health", "finances", "incubation", "vaccine_reminders"];
    legacyKeys.forEach(key => {
      this.getItem(key); // Calling getItem will trigger the internal persistence migration
    });
  }
};
