declare module "@opennextjs/cloudflare" {
  export function defineCloudflareConfig<T>(config: T): T;
  export function initOpenNextCloudflareForDev(): void;
}
