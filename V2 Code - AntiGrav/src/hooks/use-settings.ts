
import { useState, useEffect } from 'react';

const STORAGE_KEYS = {
    API_KEY: 'job_jet_openai_key',
    MODEL: 'job_jet_openai_model'
};

export interface SettingsHook {
    apiKey: string;
    setApiKey: (key: string) => Promise<void>;
    model: string;
    setModel: (model: string) => Promise<void>;
    isLoading: boolean;
}

export function useSettings(): SettingsHook {
    const [apiKey, setApiKeyState] = useState<string>('');
    const [model, setModelState] = useState<string>('gpt-4o-mini');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Load settings on mount
        chrome.storage.local.get([STORAGE_KEYS.API_KEY, STORAGE_KEYS.MODEL], (result) => {
            if (result[STORAGE_KEYS.API_KEY]) {
                setApiKeyState(result[STORAGE_KEYS.API_KEY]);
            }
            if (result[STORAGE_KEYS.MODEL]) {
                setModelState(result[STORAGE_KEYS.MODEL]);
            }
            setIsLoading(false);
        });

        // Listen for changes
        const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'local') {
                if (changes[STORAGE_KEYS.API_KEY]) {
                    setApiKeyState(changes[STORAGE_KEYS.API_KEY].newValue || '');
                }
                if (changes[STORAGE_KEYS.MODEL]) {
                    setModelState(changes[STORAGE_KEYS.MODEL].newValue || 'gpt-4o-mini');
                }
            }
        };

        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);

    const setApiKey = async (key: string) => {
        setApiKeyState(key); // Optimistic update
        await chrome.storage.local.set({ [STORAGE_KEYS.API_KEY]: key });
    };

    const setModel = async (newModel: string) => {
        setModelState(newModel); // Optimistic update
        await chrome.storage.local.set({ [STORAGE_KEYS.MODEL]: newModel });
    };

    return {
        apiKey,
        setApiKey,
        model,
        setModel,
        isLoading
    };
}
