declare module 'react' {
  export type PointerEvent<T = Element> = globalThis.PointerEvent & { currentTarget: T };
  export type ReactNode = unknown;
  export const StrictMode: (props: { children?: ReactNode }) => unknown;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: unknown[]): T;
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useRef<T>(initialValue: T): { current: T };
  export function useState<T>(initialValue: T | (() => T)): [T, (value: T | ((current: T) => T)) => void];
  const React: { StrictMode: typeof StrictMode };
  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: (...args: unknown[]) => unknown;
  export const jsxs: (...args: unknown[]) => unknown;
  export const Fragment: unknown;
}

declare module 'react-dom/client' {
  export function createRoot(element: Element | DocumentFragment): { render(children: unknown): void };
}

declare namespace React {
  type PointerEvent<T = Element> = globalThis.PointerEvent & { currentTarget: T };
}

declare namespace JSX {
  interface IntrinsicElements { [elementName: string]: any; }
}
