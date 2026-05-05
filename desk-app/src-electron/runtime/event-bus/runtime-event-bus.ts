import type { RuntimeEventMap } from '#electron/runtime/event-bus/runtime-event-protocol';

type RuntimeEventName = keyof RuntimeEventMap;
type RuntimeEventListener<K extends RuntimeEventName> = (payload: RuntimeEventMap[K]) => void;

export class RuntimeEventBus {
  private readonly listeners = new Map<RuntimeEventName, Set<(payload: unknown) => void>>();

  on<K extends RuntimeEventName>(eventName: K, listener: RuntimeEventListener<K>) {
    const typedListener = listener as (payload: unknown) => void;
    const eventListeners = this.listeners.get(eventName) ?? new Set<(payload: unknown) => void>();
    eventListeners.add(typedListener);
    this.listeners.set(eventName, eventListeners);

    return () => {
      eventListeners.delete(typedListener);
      if (eventListeners.size <= 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  emit<K extends RuntimeEventName>(eventName: K, payload: RuntimeEventMap[K]) {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners) return;

    for (const listener of eventListeners) {
      listener(payload);
    }
  }
}
