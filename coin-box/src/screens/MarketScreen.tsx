// screens/MarketScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

interface MarketScreenProps {
  isDarkMode: boolean;
  navigation: any;
}

const MarketSkeleton = ({ isDarkMode, index, total }: { isDarkMode: boolean; index: number; total: number }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonColor = isDarkMode ? '#2F3336' : '#E5E7EB';
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <View 
      style={[
        styles.marketItem, 
        { backgroundColor: isDarkMode ? '#1C1D1F' : '#FFFFFF' },
        isFirst && styles.firstCard,
        isLast && styles.lastCard,
        !isFirst && !isLast && styles.middleCard,
      ]}
    >
      <View style={styles.marketItemLeft}>
        <Animated.View
          style={[
            styles.skeletonLogo,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />
        <View style={styles.marketInfo}>
          <Animated.View
            style={[
              styles.skeletonText,
              { backgroundColor: skeletonColor, opacity, width: 120, height: 16 },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonText,
              { backgroundColor: skeletonColor, opacity, width: 80, height: 12, marginTop: 6 },
            ]}
          />
        </View>
      </View>
      <View style={styles.marketItemRight}>
        <Animated.View
          style={[
            styles.skeletonText,
            { backgroundColor: skeletonColor, opacity, width: 70, height: 16 },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonText,
            { backgroundColor: skeletonColor, opacity, width: 60, height: 14, marginTop: 8 },
          ]}
        />
      </View>
    </View>
  );
};

export default function MarketScreen({ isDarkMode, navigation }: MarketScreenProps) {
  const [allMarkets, setAllMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const priceHistoryRef = useRef<Map<string, number>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  const colors = {
    background: isDarkMode ? '#0E0F10' : '#FFFFFF',
    surface: isDarkMode ? '#1C1D1F' : '#F5F5F5',
    text: isDarkMode ? '#E4E6EB' : '#050505',
    textSecondary: isDarkMode ? '#B0B3B8' : '#65676B',
    border: isDarkMode ? '#3E4042' : '#E5E7EB',
    positive: '#00C853',
    negative: '#FF5252',
    neutral: isDarkMode ? '#7C7D80' : '#9E9E9E',
    cardBg: isDarkMode ? '#1C1D1F' : '#FFFFFF',
    categoryActiveBg: isDarkMode ? '#E4E6EB' : '#050505',
    categoryActiveText: isDarkMode ? '#050505' : '#FFFFFF',
    categoryInactiveBg: isDarkMode ? '#2A2B2D' : '#F0F2F5',
    categoryInactiveText: isDarkMode ? '#E4E6EB' : '#050505',
    searchBg: isDarkMode ? '#2A2B2D' : '#F0F2F5',
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  const connectWebSocket = () => {
    if (isConnectingRef.current) return;
    
    isConnectingRef.current = true;
    setError(false);

    try {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
        wsRef.current = null;
      }

      const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket conectado');
        isConnectingRef.current = false;
        setError(false);
        requestActiveSymbols();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (e) {
          console.error('Erro ao processar mensagem:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('Erro WebSocket:', error);
        isConnectingRef.current = false;
        setError(true);
      };

      ws.onclose = () => {
        console.log('WebSocket fechado');
        isConnectingRef.current = false;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Tentando reconectar...');
          connectWebSocket();
        }, 3000);
      };
    } catch (e) {
      console.error('Erro ao criar WebSocket:', e);
      isConnectingRef.current = false;
      setError(true);
      setLoading(false);
    }
  };

  const requestActiveSymbols = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          active_symbols: 'brief',
          product_type: 'basic'
        }));
      } catch (e) {
        console.error('Erro ao enviar requisição:', e);
        setError(true);
      }
    }
  };

  const subscribeToTicks = (symbols: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      symbols.forEach(symbol => {
        try {
          wsRef.current?.send(JSON.stringify({
            ticks: symbol,
            subscribe: 1
          }));
        } catch (e) {
          console.error('Erro ao subscrever tick:', e);
        }
      });
    }
  };

  const handleWebSocketMessage = (data: any) => {
    if (data.msg_type === 'active_symbols') {
      processActiveSymbols(data.active_symbols);
    } else if (data.msg_type === 'tick') {
      updateTickData(data.tick);
    }
  };

  const getAbbreviation = (symbol: string, displayName: string): string => {
    if (symbol.includes('BOOM')) {
      const match = symbol.match(/\d+/);
      return match ? `B${match[0]}` : 'BOOM';
    }
    if (symbol.includes('CRASH')) {
      const match = symbol.match(/\d+/);
      return match ? `C${match[0]}` : 'CRASH';
    }
    if (symbol.startsWith('R_')) {
      const match = symbol.match(/\d+/);
      return match ? `V${match[0]}` : 'VOL';
    }
    if (symbol.includes('HZ')) {
      return '1HZ';
    }
    if (symbol.includes('JD')) {
      const match = symbol.match(/\d+/);
      return match ? `JD${match[0]}` : 'JUMP';
    }
    if (symbol.includes('WLD')) {
      return 'BASKET';
    }
    if (symbol.includes('BTC')) return 'BTC';
    if (symbol.includes('ETH')) return 'ETH';
    if (symbol.includes('LTC')) return 'LTC';
    if (symbol.includes('XRP')) return 'XRP';
    
    return symbol.substring(0, 3);
  };

  const getMarketCategory = (symbol: string, market: string, submarket: string) => {
    if (market === 'synthetic_index') {
      if (submarket === 'random_index') return 'synthetic';
      if (submarket === 'crash_index' || submarket === 'boom_index') return 'boomcrash';
      if (submarket === 'jump_index') return 'jump';
      if (submarket === 'basket_index') return 'basket';
    }
    if (market === 'cryptocurrency') return 'crypto';
    return null;
  };

  const processActiveSymbols = (symbols: any[]) => {
    if (!symbols || !Array.isArray(symbols)) {
      setError(true);
      setLoading(false);
      return;
    }

    const markets: MarketData[] = [];
    const tickSymbols: string[] = [];

    symbols.forEach(symbol => {
      if (!symbol.is_trading_suspended && symbol.exchange_is_open) {
        const category = getMarketCategory(symbol.symbol, symbol.market, symbol.submarket);
        
        if (category) {
          const marketData: MarketData = {
            symbol: symbol.symbol,
            display_name: symbol.display_name,
            price: 0,
            previous_price: 0,
            change: 0,
            change_percentage: 0,
            logo: getMarketLogo(symbol.symbol),
            category: category,
            abbreviation: getAbbreviation(symbol.symbol, symbol.display_name),
          };

          markets.push(marketData);
          tickSymbols.push(symbol.symbol);
        }
      }
    });

    setAllMarkets(markets);
    setLoading(false);
    setError(false);
    
    if (tickSymbols.length > 0) {
      subscribeToTicks(tickSymbols.slice(0, 100));
    }
  };

  const updateTickData = (tick: any) => {
    if (!tick || !tick.symbol || typeof tick.quote === 'undefined') return;

    setAllMarkets(prevMarkets => {
      return prevMarkets.map(market => {
        if (market.symbol === tick.symbol) {
          const previousPrice = priceHistoryRef.current.get(tick.symbol) || tick.quote;
          const currentPrice = tick.quote;
          const change = currentPrice - previousPrice;
          const changePercentage = previousPrice !== 0 
            ? ((change / previousPrice) * 100) 
            : 0;

          priceHistoryRef.current.set(tick.symbol, currentPrice);

          return {
            ...market,
            price: currentPrice,
            previous_price: previousPrice,
            change: change,
            change_percentage: changePercentage,
          };
        }
        return market;
      });
    });
  };

  const getMarketLogo = (symbol: string) => {
    if (symbol.includes('BTC')) return 'https://cryptologos.cc/logos/bitcoin-btc-logo.png';
    if (symbol.includes('ETH')) return 'https://cryptologos.cc/logos/ethereum-eth-logo.png';
    if (symbol.includes('LTC')) return 'https://cryptologos.cc/logos/litecoin-ltc-logo.png';
    if (symbol.includes('XRP')) return 'https://cryptologos.cc/logos/xrp-xrp-logo.png';
    
    return 'candlestick';
  };

  const openMarketDetail = (market: MarketData) => {
    navigation.navigate('MarketDetail', { market, isDarkMode });
  };

  const renderMarketItem = (item: MarketData, index: number, arrayLength: number) => {
    const isPositive = item.change > 0;
    const isNegative = item.change < 0;
    
    const changeColor = isPositive ? colors.positive : isNegative ? colors.negative : colors.neutral;
    const hasPrice = item.price > 0;

    const isFirst = index === 0;
    const isLast = index === arrayLength - 1;

    return (
      <TouchableOpacity
        key={item.symbol}
        style={[
          styles.marketItem,
          { backgroundColor: colors.cardBg },
          isFirst && styles.firstCard,
          isLast && styles.lastCard,
          !isFirst && !isLast && styles.middleCard,
        ]}
        activeOpacity={0.7}
        onPress={() => openMarketDetail(item)}
      >
        <View style={styles.marketItemLeft}>
          <View style={[styles.logoContainer, { backgroundColor: colors.surface }]}>
            {item.logo === 'candlestick' ? (
              <Image
                source={require('../../assets/candlestick.png')}
                style={styles.candlestickIcon}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={{ uri: item.logo }}
                style={styles.logo}
                resizeMode="contain"
              />
            )}
            <View style={[styles.abbreviationBadge, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[styles.abbreviationText, { color: colors.text }]}>
                {item.abbreviation}
              </Text>
            </View>
          </View>
          <View style={styles.marketInfo}>
            <Text style={[styles.marketName, { color: colors.text }]} numberOfLines={1}>
              {item.display_name}
            </Text>
            <Text style={[styles.marketSymbol, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.symbol}
            </Text>
          </View>
        </View>

        <View style={styles.marketItemRight}>
          <Text style={[styles.marketPrice, { color: colors.text }]}>
            {hasPrice ? item.price.toFixed(item.symbol.includes('BTC') ? 2 : 4) : '---'}
          </Text>
          <Text style={[styles.changePercentage, { color: changeColor }]}>
            {hasPrice && item.change_percentage !== 0 
              ? `${isPositive ? '+' : ''}${item.change_percentage.toFixed(2)}%`
              : hasPrice
              ? '0.00%'
              : '---'
            }
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getFilteredMarkets = () => {
    let filtered = allMarkets;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(market => market.category === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(market => 
        market.display_name.toLowerCase().includes(query) ||
        market.symbol.toLowerCase().includes(query) ||
        market.abbreviation.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const CategoryButton = ({ value, label }: { value: string; label: string }) => {
    const isSelected = selectedCategory === value;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity
        onPress={() => setSelectedCategory(value)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.categoryButton,
            { 
              backgroundColor: isSelected ? colors.categoryActiveBg : colors.categoryInactiveBg,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              { color: isSelected ? colors.categoryActiveText : colors.categoryInactiveText }
            ]}
          >
            {label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  if (loading || error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.searchBg }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Pesquisar mercado..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              editable={false}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <CategoryButton value="all" label="Todos" />
          <CategoryButton value="synthetic" label="Sintéticos" />
          <CategoryButton value="boomcrash" label="Boom & Crash" />
          <CategoryButton value="jump" label="Jump" />
          <CategoryButton value="basket" label="Basket" />
          <CategoryButton value="crypto" label="Cripto" />
        </ScrollView>

        {error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={64} color={colors.textSecondary} />
            <Text style={[styles.errorText, { color: colors.text }]}>Erro ao carregar mercados</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.categoryActiveBg }]}
              onPress={connectWebSocket}
            >
              <Text style={[styles.retryButtonText, { color: colors.categoryActiveText }]}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.marketsList} contentContainerStyle={styles.marketsListContent}>
            <MarketSkeleton isDarkMode={isDarkMode} index={0} total={5} />
            <MarketSkeleton isDarkMode={isDarkMode} index={1} total={5} />
            <MarketSkeleton isDarkMode={isDarkMode} index={2} total={5} />
            <MarketSkeleton isDarkMode={isDarkMode} index={3} total={5} />
            <MarketSkeleton isDarkMode={isDarkMode} index={4} total={5} />
          </ScrollView>
        )}
      </View>
    );
  }

  const filteredMarkets = getFilteredMarkets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.searchBg }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Pesquisar mercado..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        <CategoryButton value="all" label="Todos" />
        <CategoryButton value="synthetic" label="Sintéticos" />
        <CategoryButton value="boomcrash" label="Boom & Crash" />
        <CategoryButton value="jump" label="Jump" />
        <CategoryButton value="basket" label="Basket" />
        <CategoryButton value="crypto" label="Cripto" />
      </ScrollView>

      <ScrollView
        style={styles.marketsList}
        contentContainerStyle={styles.marketsListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredMarkets.length > 0 ? (
          filteredMarkets.map((item, index) => renderMarketItem(item, index, filteredMarkets.length))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="chart-line"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'Nenhum mercado encontrado' : 'Nenhum mercado disponível'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  categoriesContainer: {
    maxHeight: 50,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB20',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  marketsList: {
    flex: 1,
  },
  marketsListContent: {
    padding: 16,
    paddingBottom: 140,
  },
  marketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  firstCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  lastCard: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  middleCard: {
    borderRadius: 8,
  },
  marketItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  logo: {
    width: 36,
    height: 36,
  },
  candlestickIcon: {
    width: 32,
    height: 32,
  },
  abbreviationBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  abbreviationText: {
    fontSize: 9,
    fontWeight: '700',
  },
  marketInfo: {
    flex: 1,
    marginRight: 8,
  },
  marketName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  marketSymbol: {
    fontSize: 12,
  },
  marketItemRight: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  marketPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  changePercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  skeletonLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  skeletonText: {
    borderRadius: 4,
  },
});
