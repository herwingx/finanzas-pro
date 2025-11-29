// hooks/useStorage.ts
import { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { StorageEventType } from '../services/storageService';

type StorageGetter<T> = () => T;

export const useStorage = <T>(getter: StorageGetter<T>, eventType: StorageEventType) => {
  const [data, setData] = useState<T>(getter());

  useEffect(() => {
    const handleChange = () => {
      setData(getter());
    };

    const unsubscribe = StorageService.subscribe(eventType, handleChange);

    return () => {
      unsubscribe();
    };
  }, [getter, eventType]);

  return data;
};
