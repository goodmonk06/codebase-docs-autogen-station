/**
 * Domain Event System
 * Allows loosely coupled communication between components
 */

export type DomainEventType =
  | 'repo.created'
  | 'repo.updated'
  | 'repo.deleted'
  | 'analysis.started'
  | 'analysis.completed'
  | 'analysis.failed'
  | 'template.applied'
  | 'comparison.generated'
  | 'tag.added'
  | 'tag.removed'
  | 'schedule.triggered';

export interface DomainEvent<T = any> {
  type: DomainEventType;
  timestamp: Date;
  aggregateId: string; // ID of the entity this event relates to
  data: T;
  correlationId?: string; // for tracing across events
  causationId?: string; // ID of the event that caused this event
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

/**
 * Simple in-memory event bus
 */
export class EventBus {
  private handlers: Map<DomainEventType, EventHandler[]> = new Map();
  private globalHandlers: EventHandler[] = [];

  /**
   * Subscribe to specific event type
   */
  on<T = any>(eventType: DomainEventType, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler): void {
    this.globalHandlers.push(handler);
  }

  /**
   * Publish an event
   */
  async publish<T = any>(event: DomainEvent<T>): Promise<void> {
    // Get specific handlers
    const handlers = this.handlers.get(event.type) || [];

    // Combine with global handlers
    const allHandlers = [...handlers, ...this.globalHandlers];

    // Execute all handlers in parallel
    await Promise.all(
      allHandlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      })
    );
  }

  /**
   * Remove all handlers for an event type
   */
  off(eventType: DomainEventType): void {
    this.handlers.delete(eventType);
  }

  /**
   * Remove all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers = [];
  }
}

// Global singleton event bus
export const eventBus = new EventBus();
