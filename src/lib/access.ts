import type { Server } from '@/lib/types';

export function canServer(server: Server | null | undefined, permission: string): boolean {
  if (!server) return false;
  if (server.is_owner) return true;
  if (!server.permissions) return true;
  return server.permissions.includes(permission);
}
