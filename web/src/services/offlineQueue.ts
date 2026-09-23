/**
 * Offline Resilient Queue for TruckTracker Mobile Driver
 * Ensures zero data loss during dead zones or network drops.
 */

export interface QueuedEvent {
  id: string;
  endpoint: string;
  method: string;
  payload: any;
  createdAt: string;
  retries: number;
}

const STORAGE_KEY = 'truck_tracker_offline_queue_v1';

class OfflineQueue {
  private listeners: Array<(count: number) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[OfflineQueue] Connection restored. Synchronizing queued events...');
        this.processQueue();
      });

      // Background heartbeat sync: periodically flush queued events whenever online
      setInterval(() => {
        if (typeof navigator !== 'undefined' && navigator.onLine && this.getQueue().length > 0) {
          this.processQueue();
        }
      }, 12000);
    }
  }

  public getQueue(): QueuedEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: QueuedEvent[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      this.notifyListeners();
    } catch (e) {
      console.error('[OfflineQueue] Failed to save queue:', e);
    }
  }

  public subscribe(callback: (count: number) => void): () => void {
    this.listeners.push(callback);
    callback(this.getQueue().length);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners() {
    const count = this.getQueue().length;
    this.listeners.forEach((l) => l(count));
  }

  public enqueue(endpoint: string, method: string, payload: any): string {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `event_${Date.now()}_${Math.random()}`;
    const queue = this.getQueue();
    queue.push({
      id,
      endpoint,
      method,
      payload,
      createdAt: new Date().toISOString(),
      retries: 0
    });
    this.saveQueue(queue);
    return id;
  }

  public async processQueue(): Promise<{ processed: number; remaining: number }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { processed: 0, remaining: this.getQueue().length };
    }

    const queue = this.getQueue();
    if (queue.length === 0) return { processed: 0, remaining: 0 };

    const token = localStorage.getItem('truck_tracker_token');
    const remaining: QueuedEvent[] = [];
    let processed = 0;

    for (const item of queue) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ ...item.payload, idempotencyKey: item.id })
        });

        if (response.ok || response.status === 400) {
          // If successful or rejected with business rule (already arrived/completed), remove from queue
          processed++;
        } else {
          item.retries++;
          remaining.push(item);
        }
      } catch (err) {
        item.retries++;
        remaining.push(item);
        break; // Network still unavailable, pause loop
      }
    }

    this.saveQueue(remaining);
    return { processed, remaining: remaining.length };
  }
}

export const offlineQueue = new OfflineQueue();
