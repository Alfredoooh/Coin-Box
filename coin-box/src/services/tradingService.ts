// services/tradingService.ts
import derivService from './derivService';

export type TradeType = 'MULTUP' | 'MULTDOWN' | 'ACCU';

export interface OpenPosition {
  contract_id: number;
  trade_type: TradeType;
  symbol: string;
  buy_price: number;
  current_price: number;
  entry_spot: number;
  current_spot: number;
  profit: number;
  payout: number;
  multiplier?: number;
  growth_rate?: number;
  status: 'open' | 'won' | 'lost';
  purchase_time: number;
  display_name: string;
  currency: string;
}

export interface TradeProposal {
  proposal_id: string;
  payout: number;
  ask_price: number;
  spot: number;
  display_value: string;
}

class TradingService {
  private positions: Map<number, OpenPosition> = new Map();
  // guarda unsubscribe por chave única
  private proposalSubscriptions: Map<string, { unsubscribe: () => void; timeoutId: any }> = new Map();

  // utilitário para gerar id único por pedido
  private makeKey(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }

  // ─── Proposta Multiplier ──────────────────────────────────────────────────
  getMultiplierProposal(
    symbol: string,
    tradeType: 'MULTUP' | 'MULTDOWN',
    stake: number,
    multiplier: number,
    callback: (proposal: TradeProposal | null) => void
  ) {
    const key = this.makeKey(`${symbol}_${tradeType}_${multiplier}`);

    // cancelar subscrição anterior para o mesmo símbolo/tradeType caso exista
    // (verificamos todas as keys que começam com symbol_tradeType_mult)
    Array.from(this.proposalSubscriptions.keys()).forEach(k => {
      if (k.startsWith(`${symbol}_${tradeType}_`)) {
        const entry = this.proposalSubscriptions.get(k);
        if (entry) {
          clearTimeout(entry.timeoutId);
          entry.unsubscribe();
          this.proposalSubscriptions.delete(k);
        }
      }
    });

    console.log('📤 Pedindo proposta multiplier:', { symbol, tradeType, stake, multiplier, client_id: key });

    // timeout de 15s — se não receber resposta, retorna null
    const timeoutId = setTimeout(() => {
      console.error('⏱️ TIMEOUT: proposta não recebida em 15s');
      // limpar subscrição
      const entry = this.proposalSubscriptions.get(key);
      if (entry) {
        entry.unsubscribe();
        this.proposalSubscriptions.delete(key);
      }
      callback(null);
    }, 15000);

    const unsubscribe = derivService.subscribe('proposal', (data) => {
      try {
        // validar echo_req.client_id (Deriv geralmente devolve echo_req)
        const echo = data.echo_req ?? data.echoRequest ?? null;
        if (!echo || echo.client_id !== key) {
          // não é a resposta para este pedido
          return;
        }

        clearTimeout(timeoutId);

        if (data.error) {
          console.error('❌ Erro na proposta:', data.error);
          callback(null);
          // cleanup
          unsubscribe();
          this.proposalSubscriptions.delete(key);
          return;
        }

        if (!data.proposal || !data.proposal.proposal_id) {
          console.error('❌ Resposta sem proposal_id:', data);
          callback(null);
          unsubscribe();
          this.proposalSubscriptions.delete(key);
          return;
        }

        const proposal: TradeProposal = {
          proposal_id: data.proposal.proposal_id,
          payout:        data.proposal.payout,
          ask_price:     data.proposal.ask_price,
          spot:          data.proposal.spot,
          display_value: data.proposal.display_value,
        };

        console.log('✅ Proposta criada:', proposal);
        callback(proposal);

        // se subscribe === 1 a API pode mandar updates — fechar subscrição para esta chave
        unsubscribe();
        this.proposalSubscriptions.delete(key);
      } catch (e) {
        console.error('proposal callback error', e);
      }
    });

    this.proposalSubscriptions.set(key, { unsubscribe, timeoutId });

    // Multipliers não têm duration — são contratos abertos
    // incluímos echo_req.client_id para ligar resposta a este pedido
    derivService.send({
      proposal: 1,
      amount: stake,
      basis: 'stake',
      contract_type: tradeType,
      currency: 'USD',
      multiplier: multiplier,
      symbol: symbol,
      subscribe: 1,
      echo_req: { client_id: key },
    });
  }

  // ─── Proposta Accumulator ─────────────────────────────────────────────────
  getAccumulatorProposal(
    symbol: string,
    stake: number,
    growthRate: number,
    callback: (proposal: TradeProposal | null) => void
  ) {
    const key = this.makeKey(`${symbol}_ACCU_${growthRate}`);

    // cancelar subscrição anterior para o mesmo símbolo/growthRate
    Array.from(this.proposalSubscriptions.keys()).forEach(k => {
      if (k.startsWith(`${symbol}_ACCU_`)) {
        const entry = this.proposalSubscriptions.get(k);
        if (entry) {
          clearTimeout(entry.timeoutId);
          entry.unsubscribe();
          this.proposalSubscriptions.delete(k);
        }
      }
    });

    console.log('📤 Pedindo proposta accumulator:', { symbol, stake, growthRate, client_id: key });

    const timeoutId = setTimeout(() => {
      console.error('⏱️ TIMEOUT: proposta accumulator não recebida em 15s');
      const entry = this.proposalSubscriptions.get(key);
      if (entry) {
        entry.unsubscribe();
        this.proposalSubscriptions.delete(key);
      }
      callback(null);
    }, 15000);

    const unsubscribe = derivService.subscribe('proposal', (data) => {
      try {
        const echo = data.echo_req ?? data.echoRequest ?? null;
        if (!echo || echo.client_id !== key) return;

        clearTimeout(timeoutId);

        if (data.error) {
          console.error('❌ Erro na proposta accumulator:', data.error);
          callback(null);
          unsubscribe();
          this.proposalSubscriptions.delete(key);
          return;
        }

        if (!data.proposal || !data.proposal.proposal_id) {
          console.error('❌ Resposta sem proposal_id (ACCU):', data);
          callback(null);
          unsubscribe();
          this.proposalSubscriptions.delete(key);
          return;
        }

        const proposal: TradeProposal = {
          proposal_id: data.proposal.proposal_id,
          payout:        data.proposal.payout,
          ask_price:     data.proposal.ask_price,
          spot:          data.proposal.spot,
          display_value: data.proposal.display_value,
        };

        console.log('✅ Proposta accumulator criada:', proposal);
        callback(proposal);
        unsubscribe();
        this.proposalSubscriptions.delete(key);
      } catch (e) {
        console.error('proposal accumulator callback error', e);
      }
    });

    this.proposalSubscriptions.set(key, { unsubscribe, timeoutId });

    derivService.send({
      proposal: 1,
      amount: stake,
      basis: 'stake',
      contract_type: 'ACCU',
      currency: 'USD',
      growth_rate: growthRate / 100,
      symbol: symbol,
      subscribe: 1,
      echo_req: { client_id: key },
    });
  }

  // ─── Comprar contrato ─────────────────────────────────────────────────────
  async buyContract(
    proposalId: string,
    price: number,
    tradeType: TradeType,
    symbol: string,
    displayName: string,
    multiplier?: number,
    growthRate?: number
  ): Promise<OpenPosition | null> {
    return new Promise((resolve) => {
      const unsubscribe = derivService.subscribe('buy', (data) => {
        unsubscribe();

        if (data.error) {
          console.error('Erro ao comprar contrato:', data.error);
          resolve(null);
          return;
        }

        const contract = data.buy;
        const position: OpenPosition = {
          contract_id:    contract.contract_id,
          trade_type:     tradeType,
          symbol:         symbol,
          buy_price:      contract.buy_price,
          current_price:  contract.buy_price,
          entry_spot:     contract.start_spot || price,
          current_spot:   contract.start_spot || price,
          profit:         0,
          payout:         contract.payout,
          multiplier:     multiplier,
          growth_rate:    growthRate,
          status:         'open',
          purchase_time:  Date.now(),
          display_name:   displayName,
          currency:       'USD',
        };

        this.positions.set(contract.contract_id, position);
        this.subscribeToContractUpdates(contract.contract_id);

        resolve(position);
      });

      // { buy: "<proposal_id>", price: <number> }  ← formato exigido pela API
      derivService.send({
        buy:   proposalId,
        price: price,
      });
    });
  }

  // ─── Acompanhar contrato aberto ───────────────────────────────────────────
  private subscribeToContractUpdates(contractId: number) {
    const unsubscribe = derivService.subscribe('proposal_open_contract', (data) => {
      if (data.error) {
        console.error('Erro ao atualizar contrato:', data.error);
        return;
      }

      const contract = data.proposal_open_contract;
      if (!contract || contract.contract_id !== contractId) return;

      const position = this.positions.get(contractId);
      if (!position) return;

      position.current_price = contract.bid_price   || position.current_price;
      position.current_spot  = contract.current_spot || position.current_spot;
      position.profit        = contract.profit       || 0;

      if (contract.status === 'sold' || contract.status === 'won' || contract.status === 'lost') {
        position.status = (contract.is_sold && contract.profit > 0) ? 'won' : 'lost';
        // não unsubscribe aqui — a callback faz isso quando relevante
      }

      this.positions.set(contractId, position);
    });

    derivService.send({
      proposal_open_contract: 1,
      contract_id: contractId,
      subscribe: 1,
    });
  }

  // ─── Vender / fechar posição ──────────────────────────────────────────────
  async sellPosition(contractId: number): Promise<boolean> {
    return new Promise((resolve) => {
      const unsubscribe = derivService.subscribe('sell', (data) => {
        unsubscribe();

        if (data.error) {
          console.error('Erro ao vender contrato:', data.error);
          resolve(false);
          return;
        }

        const position = this.positions.get(contractId);
        if (position) {
          position.status        = data.sell.sold_for > position.buy_price ? 'won' : 'lost';
          position.current_price = data.sell.sold_for;
          this.positions.set(contractId, position);
        }

        resolve(true);
      });

      derivService.send({
        sell:  contractId,
        price: 0,
      });
    });
  }

  // ─── Posições abertas ─────────────────────────────────────────────────────
  getOpenPositions(): OpenPosition[] {
    return Array.from(this.positions.values()).filter(p => p.status === 'open');
  }

  getPosition(contractId: number): OpenPosition | undefined {
    return this.positions.get(contractId);
  }

  subscribeToPositions(callback: (positions: OpenPosition[]) => void) {
    const interval = setInterval(() => {
      callback(this.getOpenPositions());
    }, 1000);

    return () => clearInterval(interval);
  }

  // ─── Limpar propostas activas ─────────────────────────────────────────────
  clearProposals() {
    this.proposalSubscriptions.forEach(({ unsubscribe, timeoutId }) => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    });
    this.proposalSubscriptions.clear();
  }
}

export const tradingService = new TradingService();
export default tradingService;