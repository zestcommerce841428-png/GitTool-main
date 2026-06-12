import { EventEmitter } from 'events';
export const globalEvents = new EventEmitter();
globalEvents.setMaxListeners(0); // Allow unlimited concurrent SSE connections
