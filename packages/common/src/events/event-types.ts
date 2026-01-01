export type EventPayload = Record<string, unknown>

export interface DomainEvent<T extends string, P extends EventPayload> {
  type: T
  payload: P
  occurredAt: string
}

export interface EventMetaData {
  correlationId?: string
  causationId?: string
  version?: string
}

export interface OutBoundEvent<
  T extends string,
  P extends EventPayload
> extends DomainEvent<T, P> {
  metadata?: EventMetaData
}

export interface InBoundEvent<
  T extends string,
  P extends EventPayload
> extends DomainEvent<T, P> {
  metadata: EventMetaData
}
