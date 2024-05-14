import { AppConfig } from '@/config';
import { sleep } from '@/utils/util';
import { EventId, getFullnodeUrl, PaginatedEvents, SuiClient, SuiEvent, SuiEventFilter, SuiHTTPTransport } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import WebSocket from 'ws';

export class SuiClientService {
  private eventCursor: Map<string, EventId> | null;
  private rateLimitDelay: number;
  public keypair: Ed25519Keypair;
  public client: SuiClient;
  public webSocketClient: SuiClient;

  constructor(eventCursor: EventId | null = null) {
    this.eventCursor.set('default', eventCursor);
    this.keypair = Ed25519Keypair.deriveKeypair(AppConfig.mnemonic);
    this.rateLimitDelay = 333; // how long to sleep between RPC requests, in milliseconds
    this.client = new SuiClient({
      url: getFullnodeUrl(AppConfig.env === 'development' ? 'testnet' : 'mainnet'),
    });
    this.webSocketClient = new SuiClient({
      transport: new SuiHTTPTransport({
        url: AppConfig.env === 'development' ? 'https://fullnode.testnet.sui.io/' : 'https://fullnode.mainnet.sui.io/',
        websocket: {
          WebSocketConstructor: WebSocket as never,
          reconnectTimeout: 1000,
          url: AppConfig.env === 'development' ? 'wss://fullnode.testnet.sui.io:443' : 'wss://fullnode.mainnet.sui.io:443',
        },
        WebSocketConstructor: WebSocket as never,
      }),
    });
  }

  subscribeEvent = async (eventType: string, handler: (e: SuiEvent) => void) => {
    const eventFilter: SuiEventFilter = {
      Package: AppConfig.package_id,
    };
    await this.webSocketClient.subscribeEvent({
      filter: eventFilter,
      onMessage: (event: SuiEvent) => {
        if (event.type === `${AppConfig.package_id}::${eventType}`) handler(event);
      },
    });
    console.log('subscribed to :', eventType);
  };

  /**
   * Fetch the latest events. Every time the function is called it looks
   * for events that took place since the last call.
   */
  public fetchEvents = async (eventType: string, handler: (e: PaginatedEvents) => void) => {
    try {
      if (!this.eventCursor.get(eventType)) {
        // 1st run
        await this.fetchLastEventAndUpdateCursor(eventType, handler);
        return [];
      } else {
        return await this.fetchEventsFromCursor(eventType, handler);
      }
    } catch (error) {
      console.error(`[SuiEventFetcher/${eventType.split('::')[2]}]`, error);
      return [];
    }
  };

  private fetchLastEventAndUpdateCursor = async (eventType: string, handler: (e: PaginatedEvents) => void) => {
    // fetch last event
    const suiEvents = await this.client.queryEvents({
      query: { MoveEventType: eventType },
      limit: 1,
      order: 'descending',
    });
    handler(suiEvents);

    // update cursor
    if (!suiEvents.nextCursor) {
      console.error(`[SuiEventFetcher/${eventType.split('::')[2]}] unexpected missing cursor`);
    } else {
      this.eventCursor.set(eventType, suiEvents.nextCursor);
      this.fetchEventsFromCursor(eventType, handler);
    }
  };

  private fetchEventsFromCursor = async (eventType: string, handler: (e: PaginatedEvents) => void) => {
    // fetch events from cursor
    const suiEvents = await this.client.queryEvents({
      query: { MoveEventType: eventType },
      cursor: this.eventCursor.get(eventType),
      order: 'ascending',
      // limit: 10,
    });
    handler(suiEvents);

    // update cursor
    if (!suiEvents.nextCursor) {
      console.error(`[SuiEventFetcher/${eventType.split('::')[2]}] unexpected missing cursor`);
      return;
    }
    this.eventCursor.set(eventType, suiEvents.nextCursor);

    if (suiEvents.hasNextPage) {
      await sleep(this.rateLimitDelay);
      await this.fetchEventsFromCursor(eventType, handler);
    }

    return;
  };
}

export default SuiClientService;
