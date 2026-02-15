// screens/MarketDetailScreen.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar as RNStatusBar,
  Alert,
  Animated,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { BackArrowIcon } from '../components/Icons';
import derivService from '../services/derivService';
import { useBalance } from '../contexts/BalanceContext';
import { getDynamicColors } from '../styles/theme';

const { width } = Dimensions.get('window');
const APP_ID = 71954;

const TIMEFRAMES = [
  { label: '1t', granularity: 0 },
  { label: '1m', granularity: 60 },
  { label: '5m', granularity: 300 },
  { label: '15m', granularity: 900 },
  { label: '30m', granularity: 1800 },
  { label: '1h', granularity: 3600 },
];

interface MarketData {
  symbol: string;
  display_name: string;
  price: number;
  previous_price: number;
  change: number;
  change_percentage: number;
  logo: string;
  category: string;
  abbreviation: string;
}

interface MarketDetailScreenProps {
  route: any;
  navigation: any;
}

export default function MarketDetailScreen({ route, navigation }: MarketDetailScreenProps) {
  const { market, isDarkMode: routeDark } = route.params as { market: MarketData; isDarkMode: boolean };
  const isDarkMode = !!routeDark;

  // Usar saldo do contexto global (já carregado no HomeScreen)
  const { balance, currency } = useBalance();

  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(1);
  const [chartMode, setChartMode] = useState<'candles' | 'line' | 'ohlc' | 'area'>('candles');
  const [currentPrice, setCurrentPrice] = useState<number | null>(market.price ?? null);
  const [activeTradesCountdown, setActiveTradesCountdown] = useState<Record<string, { remaining: number; duration: number; unit: string; tradeType: string; entryPrice: number }>>({});
  const [activeTradesStake, setActiveTradesStake] = useState<Record<string, number>>({});

  // Trading modal - CALL/PUT
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [contractType, setContractType] = useState<'CALL' | 'PUT'>('CALL');
  const [stake, setStake] = useState('1.00');
  const [duration, setDuration] = useState('5');
  const [durationUnit, setDurationUnit] = useState<'t' | 's' | 'm'>('t');
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);

  const [showMenuPopup, setShowMenuPopup] = useState(false);

  // CONFIGURAÇÕES SALVAS
  const [savedStake, setSavedStake] = useState('1.00');
  const [savedDuration, setSavedDuration] = useState('5');
  const [savedDurationUnit, setSavedDurationUnit] = useState<'t' | 's' | 'm'>('t');

  const [modalActive, setModalActive] = useState(false);
  const tradeModalAnimation = useRef(new Animated.Value(0)).current;
  const screenPushAnimation = useRef(new Animated.Value(0)).current;
  const menuPopupScale = useRef(new Animated.Value(0)).current;
  const menuPopupOpacity = useRef(new Animated.Value(0)).current;

  const webviewRef = useRef<WebView | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // helpers
  const toNumber = (v: any) => {
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(/,/g, ''));
      return isFinite(n) ? n : NaN;
    }
    return NaN;
  };
  const formatPrice = (p: number | null) => {
    if (typeof p !== 'number' || isNaN(p)) return '0.00';
    return market.symbol.includes('BTC') ? p.toFixed(2) : p.toFixed(4);
  };

  // ─── Proposal CALL/PUT ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!showTradeModal) {
      setProposalId(null);
      setIsLoadingProposal(false);
      return;
    }

    setIsLoadingProposal(true);
    setProposalId(null);

    const stakeValue = parseFloat(stake) || 1.0;
    const durationValue = parseInt(duration) || 5;

    const unsubscribe = derivService.subscribe('proposal', (data) => {
      if (data.error) {
        console.error('Erro na proposta:', data.error);
        setIsLoadingProposal(false);
        return;
      }
      if (data.proposal?.id) {
        setProposalId(data.proposal.id);
        setIsLoadingProposal(false);
      }
    });

    derivService.send({
      proposal: 1,
      amount: stakeValue,
      basis: 'stake',
      contract_type: contractType,
      currency: 'USD',
      duration: durationValue,
      duration_unit: durationUnit,
      symbol: market.symbol,
    });

    return () => unsubscribe();
  }, [showTradeModal, contractType, stake, duration, durationUnit, market.symbol]);

  const colors = {
    background: isDarkMode ? '#18191A' : '#FFFFFF',
    surface: isDarkMode ? '#242526' : '#F5F5F5',
    text: isDarkMode ? '#E4E6EB' : '#050505',
    textSecondary: isDarkMode ? '#B0B3B8' : '#65676B',
  };
  const appColors = getDynamicColors(isDarkMode);

  const openTradeModal = (type: 'CALL' | 'PUT') => {
    setContractType(type);
    // USAR CONFIGURAÇÕES SALVAS
    setStake(savedStake);
    setDuration(savedDuration);
    setDurationUnit(savedDurationUnit);

    setModalActive(true);
    RNStatusBar.setBarStyle('light-content', true);
    setShowTradeModal(true);
    Animated.parallel([
      Animated.spring(tradeModalAnimation, { toValue: 1, tension: 50, friction: 9, useNativeDriver: true }),
      Animated.timing(screenPushAnimation, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const closeTradeModal = () => {
    setModalActive(false);
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    Animated.parallel([
      Animated.timing(tradeModalAnimation, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(screenPushAnimation, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setShowTradeModal(false));
  };

  // FUNÇÃO PARA APLICAR CONFIGURAÇÕES
  const handleApplySettings = () => {
    setSavedStake(stake);
    setSavedDuration(duration);
    setSavedDurationUnit(durationUnit);
    Alert.alert('Configurações Salvas', 'Use os botões Rise/Fall para executar trades');
  };

  // ─── MENU POPUP COM ANIMAÇÃO NATIVA ─────────────────────────────────────────
  const openMenuPopup = () => {
    setShowMenuPopup(true);
    menuPopupScale.setValue(0.85);
    menuPopupOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(menuPopupScale, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(menuPopupOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenuPopup = () => {
    Animated.parallel([
      Animated.timing(menuPopupScale, {
        toValue: 0.85,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(menuPopupOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => setShowMenuPopup(false));
  };

  const selectChartType = (type: 'candles' | 'line' | 'ohlc' | 'area') => {
    setChartMode(type);
    switchChartMode(type);
    closeMenuPopup();
  };

  // ─── Screen push interpolations ─────────────────────────────────────────────
  const screenScale = screenPushAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.92],
  });
  const screenTranslateY = screenPushAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });
  const screenBorderRadius = screenPushAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });

  // ─── WebView HTML ───────────────────────────────────────────────────────────
  const webviewHtml = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <style>html,body,#container{height:100%;margin:0;padding:0;background:${isDarkMode ? '#18191A' : '#ffffff'};}#chart{width:100%;height:100%;}</style>
    <script src="https://unpkg.com/lightweight-charts@4.2.1/dist/lightweight-charts.standalone.production.js"></script>
  </head>
  <body>
    <div id="container"><div id="chart"></div></div>
    <script>
      (function(){
        const chartDiv = document.getElementById('chart');
        const chart = LightweightCharts.createChart(chartDiv, {
          width: chartDiv.clientWidth,
          height: chartDiv.clientHeight,
          layout: { background: { color: '${isDarkMode ? '#18191A' : '#ffffff'}' }, textColor: '${isDarkMode ? '#c9ccd0' : '#444'}' },
          rightPriceScale: { visible: true, borderVisible: false },
          grid: { vertLines: { visible: false }, horzLines: { color: '${isDarkMode ? '#3A3B3C' : '#eee'}' } },
          timeScale: { rightOffset: 12, barSpacing: 12, visible: true, timeVisible: true, secondsVisible: false },
          handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
          handleScale: { axisPressedMouseMove: { time: true, price: true }, mouseWheel: true, pinch: true }
        });

        const candleSeries = chart.addCandlestickSeries({
          upColor:'#00D95F', downColor:'#FF5252',
          wickUpColor:'#00D95F', wickDownColor:'#FF5252',
          borderVisible: false
        });
        
        const areaSeries = chart.addAreaSeries({
          topColor: 'rgba(0, 217, 95, 0.4)',
          bottomColor: 'rgba(0, 217, 95, 0.0)',
          lineColor: '#00D95F',
          lineWidth: 2,
        });

        const ohlcSeries = chart.addCandlestickSeries({
          upColor:'transparent', 
          downColor:'transparent',
          wickUpColor:'#00D95F', 
          wickDownColor:'#FF5252',
          borderVisible: true,
          borderUpColor: '#00D95F',
          borderDownColor: '#FF5252',
        });

        let candles = [];
        let ticks   = [];
        let mode    = 'candles';
        let trades = {}; // Armazena informações dos trades ativos
        let allMarkers = []; // Array central de todos os markers

        function post(msg){ if(window.ReactNativeWebView && window.ReactNativeWebView.postMessage) window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }

        // Função para adicionar linha de trade
        window.addTradeLine = function(tradeData) {
          try {
            const { tradeId, entryPrice, type, duration, durationUnit, entryTime } = tradeData;
            const baseColor = type === 'CALL' ? '#00D95F' : '#FF5252';
            
            // Criar price line horizontal (mais fina, sem título)
            const priceLine = candleSeries.createPriceLine({
              price: entryPrice,
              color: baseColor,
              lineWidth: 1,
              lineStyle: 0, // solid
              axisLabelVisible: true,
              title: '',
            });
            
            // Calcular duração em segundos
            let durationSeconds = duration;
            if (durationUnit === 'm') durationSeconds = duration * 60;
            else if (durationUnit === 's') durationSeconds = duration;
            else if (durationUnit === 't') durationSeconds = duration * 2;
            
            const endTime = entryTime + durationSeconds;
            
            // Criar marker fixo com seta no ponto de entrada
            const newMarker = {
              time: entryTime,
              position: type === 'CALL' ? 'belowBar' : 'aboveBar',
              color: baseColor,
              shape: type === 'CALL' ? 'arrowUp' : 'arrowDown',
              text: '',
            };
            
            // Adicionar ao array central de markers
            allMarkers.push(newMarker);
            candleSeries.setMarkers(allMarkers);
            
            // Adicionar marker também na área series para line mode
            if (mode === 'line') {
              areaSeries.setMarkers(allMarkers);
            }
            
            trades[tradeId] = {
              priceLine,
              entryPrice,
              type,
              endTime,
              duration: durationSeconds,
              durationUnit,
              entryTime,
              currentColor: baseColor,
              marker: newMarker,
            };
            
            updateTradeColors();
          } catch(e) {
            console.error('Error adding trade line:', e);
          }
        };

        // Atualizar cores das linhas baseado no preço atual
        function updateTradeColors() {
          try {
            const currentPrice = (mode === 'candles' && candles.length)
              ? candles[candles.length-1].close
              : (ticks.length ? ticks[ticks.length-1].price : null);
            
            if (currentPrice === null) return;
            
            const currentTime = Math.floor(Date.now() / 1000);
            
            Object.keys(trades).forEach(tradeId => {
              const trade = trades[tradeId];
              const isWinning = (trade.type === 'CALL' && currentPrice > trade.entryPrice) ||
                               (trade.type === 'PUT' && currentPrice < trade.entryPrice);
              
              const newColor = isWinning ? '#00D95F' : '#FF5252';
              
              // Só atualizar se a cor mudou
              if (newColor !== trade.currentColor) {
                trade.currentColor = newColor;
                candleSeries.removePriceLine(trade.priceLine);
                
                const priceLine = candleSeries.createPriceLine({
                  price: trade.entryPrice,
                  color: newColor,
                  lineWidth: 1,
                  lineStyle: 0,
                  axisLabelVisible: true,
                  title: '',
                });
                trade.priceLine = priceLine;
              }
              
              // Enviar countdown para React Native
              const remaining = trade.endTime - currentTime;
              if (remaining > 0) {
                post({
                  type: 'tradeCountdown',
                  tradeId: tradeId,
                  remaining: remaining,
                  duration: trade.duration,
                  durationUnit: trade.durationUnit,
                  tradeType: trade.type,
                  entryPrice: trade.entryPrice
                });
              }
            });
          } catch(e) {
            console.error('Error updating trade colors:', e);
          }
        }

        // Função para remover linha de trade
        window.removeTradeLine = function(tradeId) {
          try {
            if (trades[tradeId]) {
              candleSeries.removePriceLine(trades[tradeId].priceLine);
              
              // Remover marker do array central
              const tradeMarker = trades[tradeId].marker;
              allMarkers = allMarkers.filter(m => !(m.time === tradeMarker.time && m.color === tradeMarker.color));
              candleSeries.setMarkers(allMarkers);
              if (mode === 'line') {
                areaSeries.setMarkers(allMarkers);
              }
              
              delete trades[tradeId];
            }
          } catch(e) {
            console.error('Error removing trade line:', e);
          }
        };

        // Atualizar cores a cada segundo
        setInterval(updateTradeColors, 1000);

        function applyMode(){
          if(mode === 'candles'){
            areaSeries.setData([]);
            ohlcSeries.setData([]);
            if(candles.length) candleSeries.setData(candles);
            candleSeries.setMarkers(allMarkers);
          } else if(mode === 'line'){
            candleSeries.setData([]);
            ohlcSeries.setData([]);
            if(candles.length){
              areaSeries.setData(candles.map(c=>({ time: c.time, value: c.close })));
            } else if(ticks.length){
              areaSeries.setData(ticks.map(t=>({ time: Math.round(t.time/1000), value: t.price })));
            }
            areaSeries.setMarkers(allMarkers);
          } else if(mode === 'ohlc'){
            candleSeries.setData([]);
            areaSeries.setData([]);
            if(candles.length) ohlcSeries.setData(candles);
            ohlcSeries.setMarkers(allMarkers);
          } else if(mode === 'area'){
            candleSeries.setData([]);
            ohlcSeries.setData([]);
            if(candles.length){
              areaSeries.setData(candles.map(c=>({ time: c.time, value: c.close })));
            } else if(ticks.length){
              areaSeries.setData(ticks.map(t=>({ time: Math.round(t.time/1000), value: t.price })));
            }
            areaSeries.setMarkers(allMarkers);
          }
          updateTradeColors();
        }

        function sendLatestPrice(){
          try{
            const price = (mode === 'candles' && candles.length)
              ? candles[candles.length-1].close
              : (ticks.length ? ticks[ticks.length-1].price : null);
            if(price != null) post({ type:'latestPrice', payload:{ price } });
          }catch(e){}
        }

        function handleMsg(raw){
          try{
            const msg = JSON.parse(raw);

            if(msg.type === 'setChartMode'){
              mode = msg.payload.mode || 'candles';
              applyMode();
              return;
            }

            if(msg.type === 'history'){
              if(msg.payload.candles && msg.payload.candles.length){
                candles = msg.payload.candles.map(c=>({
                  time: Math.round(c.time),
                  open: c.open, high: c.high, low: c.low, close: c.close
                }));
                applyMode();
                sendLatestPrice();
                return;
              }
              if(msg.payload.ticks && msg.payload.ticks.length){
                ticks = msg.payload.ticks;
                applyMode();
                sendLatestPrice();
                return;
              }
            }

            if(msg.type === 'tick'){
              const t = msg.payload;
              ticks.push(t);
              if(ticks.length > 3000) ticks.shift();

              if(mode === 'line'){
                areaSeries.update({ time: Math.round(t.time/1000), value: t.price });
              }
              sendLatestPrice();
              updateTradeColors();
              return;
            }

            if(msg.type === 'ohlc'){
              const o = msg.payload;
              const obj = { time: Math.round(o.time), open: o.open, high: o.high, low: o.low, close: o.close };
              const last = candles[candles.length-1];
              if(!last || obj.time > last.time) candles.push(obj);
              else candles[candles.length-1] = obj;
              if(candles.length > 5000) candles.shift();

              if(mode === 'candles'){
                candleSeries.update(obj);
              }
              sendLatestPrice();
              updateTradeColors();
              return;
            }

          }catch(e){}
        }

        document.addEventListener('message', e => handleMsg(e.data));
        window.addEventListener('message', e => handleMsg(e.data));

        setTimeout(()=>{ if(window.ReactNativeWebView && window.ReactNativeWebView.postMessage) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'webview-ready' })); }, 200);
      })();
    </script>
  </body>
  </html>
  `;

  // ─── WebSocket ──────────────────────────────────────────────────────────────
  const connectWsAndForward = useCallback(() => {
    if (wsRef.current) { try { wsRef.current.close(); } catch (e) {} wsRef.current = null; }

    const gran = TIMEFRAMES[selectedTimeframe].granularity;
    const isTickMode = gran === 0;
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ ticks: market.symbol, subscribe: 1 }));
      if (isTickMode) {
        ws.send(JSON.stringify({ ticks_history: market.symbol, count: 1000, end: 'latest', style: 'ticks', subscribe: 0 }));
      } else {
        ws.send(JSON.stringify({ ticks_history: market.symbol, count: 1000, end: 'latest', style: 'candles', granularity: gran, subscribe: 1 }));
        ws.send(JSON.stringify({ ticks_history: market.symbol, count: 500, end: 'latest', style: 'ticks', subscribe: 0 }));
      }
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.error) { console.error('WS error', msg.error); return; }

        if (msg.msg_type === 'history') {
          if (msg.history && msg.history.prices) {
            const prices = msg.history.prices;
            const times = msg.history.times;
            const ticks = prices.map((p: any, i: number) => ({ time: Number(times[i]) * 1000, price: toNumber(p) })).filter((t:any)=>!isNaN(t.price));
            webviewRef.current?.postMessage(JSON.stringify({ type: 'history', payload: { ticks } }));
            return;
          }
          if (msg.candles && Array.isArray(msg.candles)) {
            const candles = msg.candles.map((c: any) => {
              const epoch = Number(c.epoch ?? c.open_time ?? c.time) || 0;
              return { time: Math.round(epoch), open: toNumber(c.open), high: toNumber(c.high), low: toNumber(c.low), close: toNumber(c.close) };
            }).filter((c:any)=>!isNaN(c.close));
            webviewRef.current?.postMessage(JSON.stringify({ type: 'history', payload: { candles } }));
            return;
          }
        }

        if (msg.msg_type === 'tick' || msg.tick) {
          const t = msg.tick || msg;
          const price = toNumber(t.quote ?? t.price ?? t.quote);
          const epoch = Number(t.epoch ?? t.time ?? Date.now()/1000);
          if (isNaN(price)) return;
          webviewRef.current?.postMessage(JSON.stringify({ type: 'tick', payload: { time: Math.round(epoch*1000), price } }));
          return;
        }

        if (msg.msg_type === 'ohlc' || msg.ohlc) {
          const o = msg.ohlc || msg;
          const epoch = Number(o.open_time ?? o.epoch ?? o.time) || 0;
          const open = toNumber(o.open), high = toNumber(o.high), low = toNumber(o.low), close = toNumber(o.close);
          if (isNaN(close)) return;
          webviewRef.current?.postMessage(JSON.stringify({ type: 'ohlc', payload: { time: Math.round(epoch), open, high, low, close } }));
          return;
        }

        if (msg.candles && Array.isArray(msg.candles)) {
          const candles = msg.candles.map((c: any) => {
            const epoch = Number(c.epoch ?? c.open_time ?? c.time) || 0;
            return { time: Math.round(epoch), open: toNumber(c.open), high: toNumber(c.high), low: toNumber(c.low), close: toNumber(c.close) };
          }).filter((c:any)=>!isNaN(c.close));
          webviewRef.current?.postMessage(JSON.stringify({ type: 'history', payload: { candles } }));
        }

      } catch (e) { console.error('WS parse error', e); }
    };

    ws.onerror = (e) => { console.error('WS error', e); };
    ws.onclose = () => {};
  }, [market.symbol, selectedTimeframe]);

  useEffect(() => {
    connectWsAndForward();
    return () => { if (wsRef.current) { try { wsRef.current.close(); } catch (e) {} } };
  }, [connectWsAndForward]);

  const onWebViewMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'webview-ready') {
        webviewRef.current?.postMessage(JSON.stringify({ type: 'setChartMode', payload: { mode: chartMode } }));
        return;
      }
      if (msg.type === 'latestPrice') {
        setCurrentPrice(msg.payload.price);
        return;
      }
      if (msg.type === 'tradeCountdown') {
        setActiveTradesCountdown(prev => ({
          ...prev,
          [msg.tradeId]: {
            remaining: msg.remaining,
            duration: msg.duration,
            unit: msg.durationUnit,
            tradeType: msg.tradeType,
            entryPrice: msg.entryPrice
          }
        }));
        return;
      }
    } catch (e) {}
  };

  const switchTimeframe = (idx: number) => {
    setSelectedTimeframe(idx);
    if (wsRef.current) { try { wsRef.current.close(); } catch (e) {} }
    setTimeout(() => connectWsAndForward(), 250);
  };

  const switchChartMode = (mode: 'candles'|'line'|'ohlc'|'area') => {
    setChartMode(mode);
    webviewRef.current?.postMessage(JSON.stringify({ type: 'setChartMode', payload: { mode } }));
  };

  // ─── Buy Contract ───────────────────────────────────────────────────────────
  const handleBuyContract = useCallback(async () => {
    if (!proposalId) {
      Alert.alert('❌ Erro', 'Proposta não disponível');
      return;
    }

    const stakeValue = parseFloat(stake) || 1.0;

    try {
      let buyResponse: any = null;
      const unsubscribe = derivService.subscribe('buy', (data) => {
        unsubscribe();
        buyResponse = data;
      });

      derivService.send({
        buy: proposalId,
        price: stakeValue,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (buyResponse && !buyResponse.error) {
        const contractId = buyResponse.buy.contract_id;
        const entryPrice = currentPrice ?? market.price;
        const entryTime = Math.floor(Date.now() / 1000);

        // Adicionar linha de trade no gráfico com dados completos
        webviewRef.current?.injectJavaScript(`
          window.addTradeLine({
            tradeId: '${contractId}',
            entryPrice: ${entryPrice},
            type: '${contractType}',
            duration: ${parseInt(duration)},
            durationUnit: '${durationUnit}',
            entryTime: ${entryTime}
          });
          true;
        `);

        Alert.alert('✅ Trade Executado', `Contrato ${contractId} aberto! Você pode abrir outra posição.`);

        // Armazenar stake do trade
        setActiveTradesStake(prev => ({ ...prev, [contractId]: stakeValue }));

        // NÃO fechar o modal - permitir múltiplas posições
        // closeTradeModal();

        // Monitorar o contrato e remover a linha quando concluir
        const contractSub = derivService.subscribe('proposal_open_contract', (data) => {
          if (data.proposal_open_contract?.contract_id === contractId) {
            if (data.proposal_open_contract.is_sold || data.proposal_open_contract.status === 'sold') {
              webviewRef.current?.injectJavaScript(`
                window.removeTradeLine('${contractId}');
                true;
              `);
              setActiveTradesCountdown(prev => {
                const newState = { ...prev };
                delete newState[contractId];
                return newState;
              });
              setActiveTradesStake(prev => {
                const newState = { ...prev };
                delete newState[contractId];
                return newState;
              });
              contractSub();
            }
          }
        });

        derivService.send({
          proposal_open_contract: 1,
          contract_id: contractId,
          subscribe: 1,
        });
      } else {
        Alert.alert('❌ Erro', buyResponse?.error?.message || 'Falha');
      }
    } catch (error) {
      Alert.alert('❌ Erro', 'Ocorreu um erro');
      console.error('Erro:', error);
    }
  }, [proposalId, stake, currentPrice, market.price, contractType, duration, durationUnit]);

  // ─── Quick Trade (sem modal) ────────────────────────────────────────────────
  const handleQuickTrade = useCallback(async (type: 'CALL' | 'PUT') => {
    const stakeValue = parseFloat(stake) || 1.0;
    const durationValue = parseInt(duration) || 5;

    try {
      // Fazer proposta
      let proposalResponse: any = null;
      const propUnsubscribe = derivService.subscribe('proposal', (data) => {
        propUnsubscribe();
        proposalResponse = data;
      });

      derivService.send({
        proposal: 1,
        amount: stakeValue,
        basis: 'stake',
        contract_type: type,
        currency: 'USD',
        duration: durationValue,
        duration_unit: durationUnit,
        symbol: market.symbol,
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (!proposalResponse || proposalResponse.error || !proposalResponse.proposal?.id) {
        Alert.alert('❌ Erro', 'Não foi possível criar proposta');
        return;
      }

      const quickProposalId = proposalResponse.proposal.id;

      // Comprar contrato
      let buyResponse: any = null;
      const buyUnsubscribe = derivService.subscribe('buy', (data) => {
        buyUnsubscribe();
        buyResponse = data;
      });

      derivService.send({
        buy: quickProposalId,
        price: stakeValue,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (buyResponse && !buyResponse.error) {
        const contractId = buyResponse.buy.contract_id;
        const entryPrice = currentPrice ?? market.price;
        const entryTime = Math.floor(Date.now() / 1000);

        webviewRef.current?.injectJavaScript(`
          window.addTradeLine({
            tradeId: '${contractId}',
            entryPrice: ${entryPrice},
            type: '${type}',
            duration: ${durationValue},
            durationUnit: '${durationUnit}',
            entryTime: ${entryTime}
          });
          true;
        `);

        setActiveTradesStake(prev => ({ ...prev, [contractId]: stakeValue }));

        const contractSub = derivService.subscribe('proposal_open_contract', (data) => {
          if (data.proposal_open_contract?.contract_id === contractId) {
            if (data.proposal_open_contract.is_sold || data.proposal_open_contract.status === 'sold') {
              webviewRef.current?.injectJavaScript(`
                window.removeTradeLine('${contractId}');
                true;
              `);
              setActiveTradesCountdown(prev => {
                const newState = { ...prev };
                delete newState[contractId];
                return newState;
              });
              setActiveTradesStake(prev => {
                const newState = { ...prev };
                delete newState[contractId];
                return newState;
              });
              contractSub();
            }
          }
        });

        derivService.send({
          proposal_open_contract: 1,
          contract_id: contractId,
          subscribe: 1,
        });
      } else {
        Alert.alert('❌ Erro', buyResponse?.error?.message || 'Falha ao executar');
      }
    } catch (error) {
      Alert.alert('❌ Erro', 'Ocorreu um erro');
      console.error('Erro:', error);
    }
  }, [stake, duration, durationUnit, currentPrice, market.price, market.symbol]);

  return (
    <View style={styles.wrapper}>
      <RNStatusBar
        barStyle={modalActive ? 'light-content' : (isDarkMode ? 'light-content' : 'dark-content')}
        backgroundColor={modalActive ? '#000' : 'transparent'}
        translucent
        animated
      />

      <Animated.View
        style={[
          styles.screenContainer,
          { backgroundColor: colors.background },
          {
            transform: [{ scale: screenScale }, { translateY: screenTranslateY }],
            borderTopLeftRadius: screenBorderRadius,
            borderTopRightRadius: screenBorderRadius,
            overflow: 'hidden',
          },
        ]}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header COM SALDO */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BackArrowIcon size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              {market.logo ? (
                <View style={styles.headerLogo}>
                  <View style={[styles.headerLogoPlaceholder, { backgroundColor: colors.surface }]} />
                  <Image source={{ uri: market.logo }} style={styles.headerLogoImage} />
                </View>
              ) : null}
              <View style={styles.headerTextContainer}>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{market.display_name}</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{market.abbreviation}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>Saldo</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 2 }}>
                  {balance !== null ? `${balance.toFixed(2)} ${currency}` : '...'}
                </Text>
              </View>
              <TouchableOpacity 
                style={{ padding: 8 }} 
                onPress={openMenuPopup}
              >
                <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Timeframes */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingVertical: 12 }}>
              {TIMEFRAMES.map((tf, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => switchTimeframe(idx)}
                  style={{ 
                    paddingHorizontal: 14, 
                    paddingVertical: 7, 
                    borderRadius: 8, 
                    backgroundColor: selectedTimeframe === idx ? (isDarkMode ? '#3A3B3C' : '#E5E7EB') : 'transparent' 
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{tf.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Chart */}
            <View style={{ height: width * 1.3, marginHorizontal: 0, marginTop: 8, borderRadius: 0, overflow: 'hidden', backgroundColor: colors.background }}>
              <WebView
                ref={webviewRef}
                originWhitelist={['*']}
                source={{ html: webviewHtml }}
                onMessage={onWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                style={{ flex: 1, backgroundColor: colors.background }}
              />
            </View>
          </ScrollView>

          {/* Bottom bar */}
          <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
            {/* Countdown de trades ativos - ScrollView horizontal */}
            {Object.keys(activeTradesCountdown).length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={{ position: 'absolute', top: -60, left: 0, right: 0 }}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {Object.entries(activeTradesCountdown).map(([tradeId, data]) => {
                  const minutes = Math.floor(data.remaining / 60);
                  const seconds = data.remaining % 60;
                  const displayTime = data.unit === 't' 
                    ? `${Math.ceil(data.remaining / 2)}t`
                    : `${minutes}:${seconds.toString().padStart(2, '0')}`;

                  const tradeColor = data.tradeType === 'CALL' ? '#00D95F' : '#FF5252';
                  const stakeAmount = activeTradesStake[tradeId] || 0;

                  return (
                    <View 
                      key={tradeId}
                      style={{
                        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 0,
                        borderLeftWidth: 3,
                        borderLeftColor: tradeColor,
                        minWidth: 120,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: tradeColor }}>
                          {data.tradeType === 'CALL' ? '↑ Rise' : '↓ Fall'}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                          ${stakeAmount.toFixed(2)}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                        {displayTime}
                      </Text>
                      <Text style={{ fontSize: 9, color: colors.textSecondary, marginTop: 2 }}>
                        Entry: {data.entryPrice.toFixed(market.symbol.includes('BTC') ? 2 : 4)}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.buyButton} onPress={() => handleQuickTrade('CALL')}>
              <Text style={styles.buyButtonText}>Rise</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sellButton} onPress={() => handleQuickTrade('PUT')}>
              <Text style={styles.sellButtonText}>Fall</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Modal */}
      <Modal visible={showTradeModal} transparent animationType="none" onRequestClose={closeTradeModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeTradeModal}>
          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface },
              {
                transform: [{
                  translateY: tradeModalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                }],
                opacity: tradeModalAnimation,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Settings
              </Text>
              <TouchableOpacity onPress={closeTradeModal}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalOptions} showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: colors.textSecondary }}>Tipo de Trade</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setContractType('CALL')}
                    style={{
                      flex: 1,
                      backgroundColor: contractType === 'CALL' ? '#00D95F' : colors.surface,
                      padding: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: contractType === 'CALL' ? '#fff' : colors.text }}>
                      Rise
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setContractType('PUT')}
                    style={{
                      flex: 1,
                      backgroundColor: contractType === 'PUT' ? '#FF5252' : colors.surface,
                      padding: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: contractType === 'PUT' ? '#fff' : colors.text }}>
                      Fall
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: colors.textSecondary }}>Valor</Text>
                <TextInput
                  value={stake}
                  onChangeText={setStake}
                  keyboardType="numeric"
                  placeholder="1.00"
                  placeholderTextColor={colors.textSecondary}
                  style={{ backgroundColor: colors.surface, padding: 12, borderRadius: 12, color: colors.text }}
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: colors.textSecondary }}>Duração</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor={colors.textSecondary}
                    style={{ flex: 1, backgroundColor: colors.surface, padding: 12, borderRadius: 12, color: colors.text }}
                  />
                  <View style={{ backgroundColor: colors.surface, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['t', 's', 'm'] as const).map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          onPress={() => setDurationUnit(unit)}
                          style={{
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 8,
                            backgroundColor: durationUnit === unit ? (contractType === 'CALL' ? '#00D95F' : '#FF5252') : 'transparent',
                          }}
                        >
                          <Text style={{ color: durationUnit === unit ? '#fff' : colors.text, fontWeight: '600', fontSize: 12 }}>
                            {unit === 't' ? 'Ticks' : unit === 's' ? 'Seg' : 'Min'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* Botão Aplicar Configurações */}
              <View style={{ paddingBottom: 12, marginTop: 8 }}>
                <TouchableOpacity
                  style={{ backgroundColor: colors.surface, padding: 14, borderRadius: 10, alignItems: 'center' }}
                  onPress={handleApplySettings}
                >
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>Aplicar Configurações</Text>
                </TouchableOpacity>
              </View>

              <View style={{ paddingBottom: 12 }}>
                {!isLoadingProposal && proposalId ? (
                  <TouchableOpacity
                    style={{ backgroundColor: contractType === 'CALL' ? '#00D95F' : '#FF5252', padding: 14, borderRadius: 10, alignItems: 'center' }}
                    onPress={handleBuyContract}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Executar Trade</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ backgroundColor: colors.surface, padding: 14, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 15 }}>Carregando...</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Popup Menu com Tipos de Gráfico */}
      <Modal visible={showMenuPopup} transparent animationType="none" onRequestClose={closeMenuPopup}>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} 
          activeOpacity={1} 
          onPress={closeMenuPopup}
        >
          <Animated.View 
            style={{ 
              position: 'absolute', 
              top: 60, 
              right: 16, 
              backgroundColor: colors.surface, 
              borderRadius: 12, 
              minWidth: 200,
              shadowColor: '#1C1B1F', 
              shadowOffset: { width: 0, height: 4 }, 
              shadowOpacity: 0.3, 
              shadowRadius: 8, 
              elevation: 8,
              transform: [{ scale: menuPopupScale }],
              opacity: menuPopupOpacity,
            }}
          >
            {/* Tipos de Gráfico */}
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, paddingHorizontal: 16, paddingVertical: 8 }}>
                TIPO DE GRÁFICO
              </Text>
              <TouchableOpacity
                onPress={() => selectChartType('candles')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: chartMode === 'candles' ? colors.surface : 'transparent',
                }}
              >
                <Feather 
                  name="bar-chart-2" 
                  size={20} 
                  color={chartMode === 'candles' ? colors.text : colors.textSecondary} 
                  style={{ marginRight: 12 }}
                />
                <Text style={{ 
                  fontSize: 15, 
                  color: chartMode === 'candles' ? colors.text : colors.textSecondary,
                  fontWeight: chartMode === 'candles' ? '600' : '400',
                }}>
                  Candles
                </Text>
                {chartMode === 'candles' && (
                  <Feather 
                    name="check" 
                    size={20} 
                    color={appColors.primary} 
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectChartType('line')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: chartMode === 'line' ? colors.surface : 'transparent',
                }}
              >
                <Feather 
                  name="trending-up" 
                  size={20} 
                  color={chartMode === 'line' ? colors.text : colors.textSecondary} 
                  style={{ marginRight: 12 }}
                />
                <Text style={{ 
                  fontSize: 15, 
                  color: chartMode === 'line' ? colors.text : colors.textSecondary,
                  fontWeight: chartMode === 'line' ? '600' : '400',
                }}>
                  Line
                </Text>
                {chartMode === 'line' && (
                  <Feather 
                    name="check" 
                    size={20} 
                    color={appColors.primary} 
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectChartType('ohlc')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: chartMode === 'ohlc' ? colors.surface : 'transparent',
                }}
              >
                <Feather 
                  name="bar-chart" 
                  size={20} 
                  color={chartMode === 'ohlc' ? colors.text : colors.textSecondary} 
                  style={{ marginRight: 12 }}
                />
                <Text style={{ 
                  fontSize: 15, 
                  color: chartMode === 'ohlc' ? colors.text : colors.textSecondary,
                  fontWeight: chartMode === 'ohlc' ? '600' : '400',
                }}>
                  OHLC
                </Text>
                {chartMode === 'ohlc' && (
                  <Feather 
                    name="check" 
                    size={20} 
                    color={appColors.primary} 
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectChartType('area')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: chartMode === 'area' ? colors.surface : 'transparent',
                }}
              >
                <Feather 
                  name="activity" 
                  size={20} 
                  color={chartMode === 'area' ? colors.text : colors.textSecondary} 
                  style={{ marginRight: 12 }}
                />
                <Text style={{ 
                  fontSize: 15, 
                  color: chartMode === 'area' ? colors.text : colors.textSecondary,
                  fontWeight: chartMode === 'area' ? '600' : '400',
                }}>
                  Area
                </Text>
                {chartMode === 'area' && (
                  <Feather 
                    name="check" 
                    size={20} 
                    color={appColors.primary} 
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Separador */}
            <View style={{ height: 1, backgroundColor: colors.surface, marginVertical: 8 }} />

            {/* Configurações */}
            <TouchableOpacity
              onPress={() => {
                closeMenuPopup();
                setTimeout(() => openTradeModal(contractType), 200);
              }}
              style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}
            >
              <Feather name="settings" size={20} color={colors.text} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 15, color: colors.text }}>Configurações</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#000' },
  screenContainer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, height: 56 },
  backButton: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 },
  headerLogo: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden' },
  headerLogoPlaceholder: { position: 'absolute', width: 28, height: 28, borderRadius: 14 },
  headerLogoImage: { width: 28, height: 28, borderRadius: 14 },
  headerTextContainer: { flex: 1, maxWidth: 140 },
  headerTitle: { fontSize: 14, fontWeight: '700' },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  segmentedControl: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 4, padding: 2, borderRadius: 9 },
  segmentButton: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  buyButton: { flex: 1, backgroundColor: '#00D95F', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buyButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  sellButton: { flex: 1, backgroundColor: '#FF5252', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  sellButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 10, borderTopRightRadius: 10, paddingBottom: 24, maxHeight: '70%' },
  modalHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '600' },
  modalOptions: { paddingHorizontal: 12 },
});