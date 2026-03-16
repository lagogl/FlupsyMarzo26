import { useState, useEffect, useRef } from 'react';

export type FilterState = Record<string, any>;

function loadFromStorage(storageKey: string): FilterState | null {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error("Errore nel caricamento dei filtri salvati:", err);
  }
  return null;
}

/**
 * Hook per la persistenza dei filtri per pagina, con supporto chiave dinamica (es. per utente).
 */
export function useFilterPersistence(pageKey: string, defaultFilters: FilterState) {
  const storageKey = `app_filters_${pageKey}`;
  const prevKeyRef = useRef(storageKey);

  const [filters, setFiltersState] = useState<FilterState>(() => {
    return loadFromStorage(storageKey) ?? defaultFilters;
  });

  // Quando la chiave cambia (es. utente caricato dopo il primo render) rilegge lo storage
  useEffect(() => {
    if (prevKeyRef.current !== storageKey) {
      prevKeyRef.current = storageKey;
      const saved = loadFromStorage(storageKey);
      setFiltersState(saved ?? defaultFilters);
    }
  }, [storageKey]);

  const setFilters = (newFilters: FilterState | ((prev: FilterState) => FilterState)) => {
    setFiltersState((prevFilters) => {
      const updatedFilters = typeof newFilters === 'function'
        ? newFilters(prevFilters)
        : newFilters;
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedFilters));
      } catch (err) {
        console.error("Errore nel salvataggio dei filtri:", err);
      }
      return updatedFilters;
    });
  };

  // Sincronizza con altre schede
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          setFiltersState(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Errore nell'aggiornamento dei filtri da un'altra scheda:", err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  return [filters, setFilters] as const;
}
