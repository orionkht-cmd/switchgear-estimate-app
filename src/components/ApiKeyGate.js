import React, { useState, useEffect } from 'react';
import {
  projectApi,
  getApiBaseUrl,
  getStoredApiKey,
} from '../services/apiClient';

const ApiKeyGate = ({ children }) => {
  const isDevBypassEnabled = process.env.NODE_ENV === 'development';

  // 서버 주소는 코드로 고정합니다. 화면에는 읽기 전용으로만 보여줍니다.
  const [baseUrlInput] = useState(() => getApiBaseUrl());
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isDevBypassEnabled) {
      setIsConfigured(true);
      setChecking(false);
      setError('');
      return undefined;
    }

    if (typeof window === 'undefined') return undefined;

    let cancelled = false;

    const restoreAndVerifyKey = async () => {
      const storedKey = getStoredApiKey();
      setApiKeyInput(storedKey);

      if (!storedKey) {
        return;
      }

      setChecking(true);

      try {
        await projectApi.verifyKey();
        if (!cancelled) {
          setIsConfigured(true);
          setError('');
        }
      } catch (e) {
        try {
          window.localStorage.removeItem('apiKey');
        } catch (storageError) {
          // ignore
        }

        if (!cancelled) {
          setIsConfigured(false);
          setApiKeyInput('');
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    restoreAndVerifyKey();

    return () => {
      cancelled = true;
    };
  }, [isDevBypassEnabled]);

  const handleSave = async () => {
    if (isDevBypassEnabled) {
      setIsConfigured(true);
      return;
    }

    if (!apiKeyInput) {
      setError('API 키를 입력해주세요.');
      return;
    }

    setError('');
    setChecking(true);

    try {
      if (typeof window !== 'undefined') {
        // 로컬 스토리지에는 단순 난독화 형태로 저장합니다.
        const encodedKey = window.btoa(apiKeyInput.trim());
        window.localStorage.setItem('apiKey', encodedKey);
      }

      await projectApi.verifyKey();
      setIsConfigured(true);
    } catch (e) {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem('apiKey');
        } catch (storageError) {
          // ignore
        }
      }

      setError('서버 연결 또는 API 키가 올바르지 않습니다.');
    } finally {
      setChecking(false);
    }
  };

  if (isConfigured) {
    return children;
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-slate-100">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-xl">
        <h1 className="text-lg font-bold mb-4">시스템 접속 설정</h1>
        <p className="text-xs text-slate-300 mb-4">
          Tailscale Funnel 등으로 노출된 백엔드 주소와 API 키를 입력해주세요.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              서버 주소
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-600 text-sm"
              value={baseUrlInput}
              readOnly
            />
            <p className="mt-1 text-[11px] text-slate-500">
              이 값은 코드에 고정되어 있으며, 모든 PC에서 동일하게 사용됩니다.
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              API 키
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-600 text-sm"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-900/30 border border-red-700 px-3 py-2 rounded">
              {error}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={checking}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg"
          >
            {checking ? '확인 중...' : '연결 테스트 및 저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyGate;
