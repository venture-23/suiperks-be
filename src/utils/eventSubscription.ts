import { AppConfig } from '@/config';
import { getFullnodeUrl, SuiClient, SuiEvent, SuiEventFilter, SuiHTTPTransport } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import WebSocket from 'ws';

export const getExecStuff = () => {
  const keypair = Ed25519Keypair.deriveKeypair(AppConfig.mnemonic);
  const client = new SuiClient({
    url: getFullnodeUrl(AppConfig.env === 'development' ? 'devnet' : 'mainnet'),
  });
  const webSocketClient = new SuiClient({
    transport: new SuiHTTPTransport({
      url: 'https://fullnode.devnet.sui.io/',
      websocket: {
        WebSocketConstructor: WebSocket as never,
        reconnectTimeout: 1000,
        url: 'wss://fullnode.devnet.sui.io:443',
      },
      WebSocketConstructor: WebSocket as never,
    }),
  });
  return { keypair, client, webSocketClient };
};

export const subscribeEvent = async (eventType: string, handler: (e: any) => void) => {
  const { webSocketClient } = getExecStuff();
  const eventFilter: SuiEventFilter = {
    Package: AppConfig.package_id,
  };
  await webSocketClient.subscribeEvent({
    filter: eventFilter,
    onMessage: (event: SuiEvent) => {
      console.log('subscribeEvent 1', JSON.stringify(event, null, 2));
      handler(event);
    },
  });
};
