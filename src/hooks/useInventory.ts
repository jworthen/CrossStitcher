import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlossStatus } from '../data/dmcColors';

const STORAGE_KEY = '@floss_inventory';

type Inventory = Record<string, FlossStatus>;

export function useInventory() {
  const [inventory, setInventory] = useState<Inventory>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) {
        setInventory(JSON.parse(json));
      }
      setLoaded(true);
    });
  }, []);

  const setStatus = useCallback(
    async (number: string, status: FlossStatus) => {
      const next = { ...inventory, [number]: status };
      setInventory(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    [inventory]
  );

  const cycleStatus = useCallback(
    (number: string) => {
      const current = inventory[number] ?? 'unowned';
      const next: FlossStatus =
        current === 'unowned' ? 'in_stock' : current === 'in_stock' ? 'low' : 'unowned';
      setStatus(number, next);
    },
    [inventory, setStatus]
  );

  const getStatus = useCallback(
    (number: string): FlossStatus => inventory[number] ?? 'unowned',
    [inventory]
  );

  return { inventory, loaded, setStatus, cycleStatus, getStatus };
}
