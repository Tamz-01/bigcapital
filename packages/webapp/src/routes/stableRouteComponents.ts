import type { ComponentType } from 'react';

/** Keep lazy page types stable while rebuilding translated route metadata. */
export function stableRouteComponents<
  T extends { path: string; component: ComponentType<any> },
>(factory: () => T[]): () => T[] {
  const components = new Map<string, ComponentType<any>>();
  return () =>
    factory().map((route) => {
      if (!components.has(route.path))
        components.set(route.path, route.component);
      return { ...route, component: components.get(route.path)! };
    });
}
