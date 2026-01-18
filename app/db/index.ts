// Re-export database types for convenience
export type { Database, Tables, TablesInsert, TablesUpdate } from './database.types';

// Client utilities should be imported directly:
// - Browser/Client Components: import { createClient } from '@/app/db/client'
// - Server Components/Actions: import { createClient } from '@/app/db/server'

