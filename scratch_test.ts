import { SyncService } from './src/app/SyncService.ts';

const local = [
  { id: '1', name: 'Old', updatedAt: 100 },
  { id: '2', name: 'DeletedInLocal', _deleted: true, updatedAt: 200 }
];

const cloud = [
  { id: '1', name: 'NewFromCloud', updatedAt: 150 },
  { id: '2', name: 'DeletedInLocal', updatedAt: 100 }
];

// Note: I can't easily run TS directly without changing files, let's just write a plain JS script.
