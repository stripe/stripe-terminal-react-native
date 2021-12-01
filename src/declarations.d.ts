declare module 'react-native/Libraries/vendor/emitter/EventEmitter' {
  declare class EventEmitter {
    constructor(subscriber?: EventSubscriptionVendor | null);

    addListener(
      eventType: string,
      listener: (...args: any[]) => any,
      context?: any
    ): EmitterSubscription;

    once(
      eventType: string,
      listener: (...args: any[]) => any,
      context: any
    ): EmitterSubscription;

    removeAllListeners(eventType?: string): void;

    removeCurrentListener(): void;

    removeSubscription(subscription: EmitterSubscription): void;

    listeners(eventType: string): EmitterSubscription[];

    emit(eventType: string, ...params: any[]): void;

    removeListener(eventType: string, listener: (...args: any[]) => any): void;
  }
  export = EventEmitter;
}
