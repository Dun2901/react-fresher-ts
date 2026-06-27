import type { NavigateFunction } from 'react-router-dom';

export type BackNavigationState = {
  from?: string;
  fromLabel?: string;
  fallbackFrom?: string;
  fallbackFromLabel?: string;
} | null;

type RouterLocationLike = {
  pathname: string;
  search?: string;
  hash?: string;
};

const isSafeInternalPath = (path?: string) => {
  return Boolean(path && path.startsWith('/') && !path.startsWith('//'));
};

export const getCurrentPath = (location: RouterLocationLike) => {
  return `${location.pathname}${location.search || ''}${location.hash || ''}`;
};

export const getBackFromState = (state: unknown) => {
  const from = (state as BackNavigationState)?.from;

  if (!isSafeInternalPath(from)) {
    return undefined;
  }

  return from;
};

export const getBackLabelFromState = (state: unknown) => {
  const fromLabel = (state as BackNavigationState)?.fromLabel;

  if (!fromLabel || typeof fromLabel !== 'string') {
    return undefined;
  }

  return fromLabel;
};

export const getFallbackFromState = (state: unknown) => {
  const fallbackFrom = (state as BackNavigationState)?.fallbackFrom;

  if (!isSafeInternalPath(fallbackFrom)) {
    return undefined;
  }

  return fallbackFrom;
};

export const getFallbackLabelFromState = (state: unknown) => {
  const fallbackFromLabel = (state as BackNavigationState)?.fallbackFromLabel;

  if (!fallbackFromLabel || typeof fallbackFromLabel !== 'string') {
    return undefined;
  }

  return fallbackFromLabel;
};

export const isBookDetailPath = (path?: string) => {
  return Boolean(path && /^\/book\/[^/]+/.test(path));
};

export const getBackButtonText = (state: unknown, fallbackLabel: string) => {
  const fromLabel = getBackLabelFromState(state);

  return `Quay lại ${fromLabel || fallbackLabel}`;
};

export const buildBookDetailFallbackState = (state: unknown): BackNavigationState => {
  const fallbackFrom = getFallbackFromState(state) || '/book';
  const fallbackFromLabel = getFallbackLabelFromState(state) || 'danh sách sách';

  return {
    from: fallbackFrom,
    fromLabel: fallbackFromLabel,
  };
};

export const goBackOrFallback = (
  navigate: NavigateFunction,
  fallbackPath: string,
  state?: unknown,
) => {
  const fromPath = getBackFromState(state);

  if (fromPath) {
    navigate(fromPath);
    return;
  }

  const browserHistoryIndex = Number(window.history.state?.idx ?? 0);

  if (browserHistoryIndex > 0) {
    navigate(-1);
    return;
  }

  navigate(fallbackPath);
};
