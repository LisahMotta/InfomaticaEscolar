declare module 'web-push' {
  export interface PushSubscriptionKeys {
    p256dh: string;
    auth: string;
  }

  export interface PushSubscriptionJSON {
    endpoint: string;
    keys: PushSubscriptionKeys;
  }

  export interface VapidDetails {
    subject: string;
    publicKey: string;
    privateKey: string;
  }

  export interface RequestOptions {
    gcmAPIKey?: string;
    vapidDetails?: VapidDetails;
    TTL?: number;
    headers?: { [key: string]: string };
    contentEncoding?: string;
    proxy?: string;
    timeout?: number;
  }

  export function sendNotification(
    subscription: PushSubscriptionJSON,
    payload: string | Buffer,
    options?: RequestOptions
  ): Promise<any>;

  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  export function setGCMAPIKey(apiKey: string): void;

  export function generateVAPIDKeys(): { publicKey: string; privateKey: string };
}