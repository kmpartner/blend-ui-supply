import { useCallback, useEffect, useState } from 'react';

/** @dev @TODO check if is useful or not (why would you want both state and ls unless it affects renders) */
export const useLocalStorageState = (
  key: string,
  defaultState: string | undefined
): [string | undefined, (newState: string) => void] => {
  const [state, setState] = useState<string | undefined>(defaultState);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    /** @dev @TODO unhandled json .parse */
    setState(stored ? JSON.parse(stored) : defaultState);
  }, [defaultState, key]);

  const setLocalStorageState = useCallback(
    (newState: string) => {
      const changed = state !== newState;
      if (!changed) {
        return;
      }
      setState(newState);
      if (newState === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newState));
      }
    },
    [state, key]
  );

  return [state, setLocalStorageState];
};
