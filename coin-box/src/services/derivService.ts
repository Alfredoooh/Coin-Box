// services/derivService.ts
const DERIV_APP_ID = '71954';
const DERIV_API_TOKEN = 'nUYzSZmUXrXmBmD';
const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`;

export interface AccountBalance {
  balance: number;
  currency: string;
  loginid: string;
}

export interface TickData {
  symbol: string;
  quote: number;
  ask?: number;
  bid?: number;
}

export interface MarketSymbol {
  symbol: string;
  display_name: string;
  market: string;
  submarket: string;
  is_trading_suspended: boolean;
  exchange_is_open: boolean;
}

class DerivService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private _isAuthorized = false;
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  // fila de mensagens para quando o WS ainda não está open
  private pendingMessages: any[] = [];

  constructor() {
    this.connect();
  }

  // ─── conexão ──────────────────────────────────────────────────────────────
  private connect() {
    try {
      this.ws = new WebSocket(DERIV_WS_URL);

      this.ws.onopen = () => {
        console.log('✅ Deriv WebSocket conectado');
        this.reconnectAttempts = 0;
        this.authorize();
        this.startPing();
        this.flushPendingMessages();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Erro ao processar mensagem:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 Deriv WebSocket desconectado');
        this._isAuthorized = false;
        this.stopPing();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error);
      this.attemptReconnect();
    }
  }

  // ─── fila ─────────────────────────────────────────────────────────────────
  private flushPendingMessages() {
    while (this.pendingMessages.length > 0) {
      const msg = this.pendingMessages.shift();
      this.rawSend(msg);
    }
  }

  // ─── ping ─────────────────────────────────────────────────────────────────
  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.rawSend({ ping: 1 });
      }
    }, 30000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // ─── reconexão ────────────────────────────────────────────────────────────
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Tentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error('❌ Máximo de tentativas de reconexão atingido');
    }
  }

  // ─── autorização ──────────────────────────────────────────────────────────
  private authorize() {
    this.rawSend({ authorize: DERIV_API_TOKEN });
  }

  // ─── roteador de mensagens ───────────────────────────────────────────────
  private handleMessage(data: any) {
    if (data.msg_type === 'authorize') {
      if (data.error) {
        console.error('❌ Erro na autorização:', data.error.message);
        this._isAuthorized = false;
        this.notifySubscribers('authorize_error', data.error);
      } else {
        console.log('✅ Autorizado com sucesso:', data.authorize.loginid);
        this._isAuthorized = true;
        this.notifySubscribers('authorize', data.authorize);
        this.getBalance();
      }
      return;
    }

    if (data.msg_type === 'balance') {
      const balanceData: AccountBalance = {
        balance: parseFloat(data.balance.balance),
        currency: data.balance.currency,
        loginid: data.balance.loginid,
      };
      this.notifySubscribers('balance', balanceData);
      return;
    }

    if (data.msg_type === 'tick') {
      const tickData: TickData = {
        symbol: data.tick.symbol,
        quote: data.tick.quote,
        ask: data.tick.ask,
        bid: data.tick.bid,
      };
      this.notifySubscribers('tick', tickData);
      this.notifySubscribers(`tick:${data.tick.symbol}`, tickData);
      return;
    }

    if (data.msg_type === 'active_symbols') {
      this.notifySubscribers('active_symbols', data.active_symbols);
      return;
    }

    if (data.msg_type === 'proposal') {
      if (data.error) {
        console.error('❌ Erro na proposta:', data.error.message || data.error);
      } else {
        console.log('✅ Proposta recebida:', data.proposal?.proposal_id);
      }
      this.notifySubscribers('proposal', data);
      return;
    }

    if (data.msg_type === 'buy') {
      if (data.error) {
        console.error('❌ Erro na compra:', data.error.message || data.error);
      } else {
        console.log('✅ Compra executada — contract_id:', data.buy?.contract_id);
      }
      this.notifySubscribers('buy', data);
      return;
    }

    if (data.msg_type === 'sell') {
      if (data.error) {
        console.error('❌ Erro na venda:', data.error.message || data.error);
      } else {
        console.log('✅ Venda executada — sold_for:', data.sell?.sold_for);
      }
      this.notifySubscribers('sell', data);
      return;
    }

    if (data.msg_type === 'proposal_open_contract') {
      if (data.error) {
        console.error('❌ Erro no contrato aberto:', data.error.message || data.error);
      }
      this.notifySubscribers('proposal_open_contract', data);
      return;
    }

    if (data.msg_type === 'ping') {
      this.rawSend({ ping: 1 });
      return;
    }

    if (data.msg_type === 'history') {
      this.notifySubscribers('history', data);
      return;
    }
    if (data.msg_type === 'ohlc') {
      this.notifySubscribers('ohlc', data);
      return;
    }

    if (data.error) {
      console.error('❌ Erro da API:', data.error);
      this.notifySubscribers('error', data.error);
    }
  }

  // ─── notifica ─────────────────────────────────────────────────────────────
  private notifySubscribers(event: string, data: any) {
    const subscribers = this.subscriptions.get(event);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  }

  // ─── envio público ───────────────────────────────────────────────────────
  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.rawSend(data);
    } else {
      console.warn('⚠️ WS não está open — mensagem filadada');
      this.pendingMessages.push(data);
    }
  }

  private rawSend(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // ─── API pública ──────────────────────────────────────────────────────────
  subscribe(event: string, callback: (data: any) => void) {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }
    this.subscriptions.get(event)!.add(callback);

    return () => {
      const subscribers = this.subscriptions.get(event);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscriptions.delete(event);
        }
      }
    };
  }

  getBalance(subscribe = true) {
    this.send({
      balance: 1,
      subscribe: subscribe ? 1 : 0,
    });
  }

  isAuthorized(): boolean {
    return this._isAuthorized;
  }

  getActiveSymbols() {
    this.send({ active_symbols: 'brief', product_type: 'basic' });
  }

  subscribeToTick(symbol: string) {
    this.send({ ticks: symbol, subscribe: 1 });
  }

  unsubscribeFromTick(_symbol: string) {
    this.send({ forget_all: 'ticks' });
  }

  getAccountStatus() {
    this.send({ get_account_status: 1 });
  }

  disconnect() {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.pendingMessages = [];
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN && this._isAuthorized;
  }
}

export const derivService = new DerivService();
export default derivService;