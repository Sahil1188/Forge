import { describe, it, expect, vi } from 'vitest';
import { DomainEvent, EventBus } from './event-bus';

const ev = (type: string, id = '1'): DomainEvent => ({
  type,
  aggregateType: 'x',
  aggregateId: id,
  payload: {},
  occurredAt: new Date().toISOString(),
});

describe('EventBus', () => {
  it('delivers an event only to subscribers of its exact type', async () => {
    const bus = new EventBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.subscribe('a', a);
    bus.subscribe('b', b);
    await bus.publish(ev('a'));
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
  });

  it('delivers every event to wildcard subscribers', async () => {
    const bus = new EventBus();
    const all = vi.fn();
    bus.subscribe('*', all);
    await bus.publish(ev('a'));
    await bus.publish(ev('b'));
    expect(all).toHaveBeenCalledTimes(2);
  });

  it('typed subscribers run before wildcard subscribers', async () => {
    const bus = new EventBus();
    const order: string[] = [];
    bus.subscribe('*', () => void order.push('wild'));
    bus.subscribe('a', () => void order.push('typed'));
    await bus.publish(ev('a'));
    expect(order).toEqual(['typed', 'wild']);
  });

  it('unsubscribe stops delivery', async () => {
    const bus = new EventBus();
    const h = vi.fn();
    const off = bus.subscribe('a', h);
    await bus.publish(ev('a'));
    off();
    await bus.publish(ev('a'));
    expect(h).toHaveBeenCalledTimes(1);
  });

  it('a throwing handler does not stop other handlers or reject publish', async () => {
    const bus = new EventBus();
    const after = vi.fn();
    bus.subscribe('a', () => {
      throw new Error('boom');
    });
    bus.subscribe('a', async () => {
      throw new Error('async boom');
    });
    bus.subscribe('a', after);
    await expect(bus.publish(ev('a'))).resolves.toBeUndefined();
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('awaits async handlers sequentially, in subscription order', async () => {
    const bus = new EventBus();
    const order: string[] = [];
    bus.subscribe('a', async () => {
      await new Promise((r) => setTimeout(r, 20));
      order.push('slow-first');
    });
    bus.subscribe('a', () => void order.push('fast-second'));
    await bus.publish(ev('a'));
    expect(order).toEqual(['slow-first', 'fast-second']);
  });

  it('publishing with no subscribers is a no-op', async () => {
    await expect(new EventBus().publish(ev('nobody'))).resolves.toBeUndefined();
  });

  it('registering the same handler twice delivers once (Set semantics)', async () => {
    const bus = new EventBus();
    const h = vi.fn();
    bus.subscribe('a', h);
    bus.subscribe('a', h);
    await bus.publish(ev('a'));
    expect(h).toHaveBeenCalledTimes(1);
  });
});
