export interface StorageAdapter<T> {
  delete(key: string): Promise<void>;
  get(key: string): Promise<T | undefined>;
  list(prefix?: string): Promise<Array<{ key: string; value: T }>>;
  set(key: string, value: T): Promise<void>;
}
