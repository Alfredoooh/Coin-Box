// screens/HomeScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  BackHandler,
  Modal,
  PanResponder,
  Image,
  StatusBar as RNStatusBar,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import MarketScreen from './MarketScreen';
import { COLORS, getDynamicColors } from '../styles/theme';
import { globalStyles, DRAWER_WIDTH } from '../styles/globalStyles';
import { getTranslation } from '../utils/translations';
import {
  HomeOutlineIcon,
  HomeFilledIcon,
  MarketOutlineIcon,
  MarketFilledIcon,
  PortfolioOutlineIcon,
  PortfolioFilledIcon,
  AutomationOutlineIcon,
  AutomationFilledIcon,
  DrawerMenuIcon,
  PlusIcon,
  NewPostIcon,
  NewChannelIcon,
  LogoutIcon,
  DoubleChevronRightIcon,
  SendIcon,
  ReceiveIcon,
  DepositIcon,
  WithdrawIcon,
} from '../components/Icons';
import ProbabilityIcon from '../components/ProbabilityIcon';
import derivService from '../services/derivService';

const { width, height } = Dimensions.get('window');

interface MarketData {
  symbol: string;
  display_name: string;
  price: number;
  change_percentage: number;
  logo: string;
  abbreviation: string;
}

const SkeletonBalance = ({ isDarkMode }: { isDarkMode: boolean }) => {
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

  return (
    <View style={styles.balanceRow}>
      <View style={{ gap: 6 }}>
        <Animated.View style={[{ height: 14, width: 110, borderRadius: 7, backgroundColor: skeletonColor, opacity }]} />
        <Animated.View style={[{ height: 36, width: 180, borderRadius: 10, backgroundColor: skeletonColor, opacity }]} />
      </View>
      <View style={styles.balanceButtons}>
        <Animated.View style={[styles.balanceButtonSkeleton, { backgroundColor: skeletonColor, opacity }]} />
        <Animated.View style={[styles.balanceButtonSkeleton, { backgroundColor: skeletonColor, opacity }]} />
      </View>
    </View>
  );
};

export default function HomeScreen({ navigation, isDarkMode, language }) {
  const [activeTab, setActiveTab] = useState('inicio');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#FF444F');
  const [modalActive, setModalActive] = useState(false);
  const [topMarkets, setTopMarkets] = useState<MarketData[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [accountLoginId, setAccountLoginId] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;
  const portfolioModalSlide = useRef(new Animated.Value(1)).current;
  const portfolioModalOpacity = useRef(new Animated.Value(0)).current;
  const assistantModalSlide = useRef(new Animated.Value(1)).current;
  const assistantModalOpacity = useRef(new Animated.Value(0)).current;
  const portfolioPanResponder = useRef<any>(null);
  const createMenuPanResponder = useRef<any>(null);
  const assistantPanResponder = useRef<any>(null);
  const logoutBorderRadius = useRef(new Animated.Value(100)).current;
  const mainContentScale = useRef(new Animated.Value(1)).current;
  const mainContentTranslateY = useRef(new Animated.Value(0)).current;
  const modalScreenScale = useRef(new Animated.Value(1)).current;
  const modalScreenTranslateY = useRef(new Animated.Value(0)).current;
  const pulseAnimations = useRef({
    inicio: new Animated.Value(1),
    mercado: new Animated.Value(1),
    portfolio: new Animated.Value(1),
    automacao: new Animated.Value(1),
    assistant: new Animated.Value(1),
  }).current;

  const colors = isDarkMode ? COLORS.dark : COLORS.light;
  const appColors = getDynamicColors(isDarkMode, primaryColor);

  // Conectar ao serviço Deriv e receber atualizações de saldo em tempo real
  useEffect(() => {
    // Subscrever para autorização bem-sucedida
    const unsubscribeAuth = derivService.subscribe('authorize', (data) => {
      console.log('✅ Conta autorizada:', data.loginid);
      setAccountLoginId(data.loginid);
    });

    // Subscrever para atualizações de saldo em tempo real
    const unsubscribeBalance = derivService.subscribe('balance', (data) => {
      console.log('💰 Saldo atualizado:', data.balance, data.currency);
      setBalance(data.balance);
      setCurrency(data.currency);
      setLoadingBalance(false);
    });

    // Subscrever para erros de autorização
    const unsubscribeAuthError = derivService.subscribe('authorize_error', (error) => {
      console.error('❌ Erro na autorização:', error);
      setLoadingBalance(false);
    });

    // Limpar subscrições quando o componente desmontar
    return () => {
      unsubscribeAuth();
      unsubscribeBalance();
      unsubscribeAuthError();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'inicio') {
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
      }
    };
  }, [activeTab]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          active_symbols: 'brief',
          product_type: 'basic'
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.msg_type === 'active_symbols') {
            processTopMarkets(data.active_symbols);
          } else if (data.msg_type === 'tick') {
            updateMarketPrice(data.tick);
          }
        } catch (e) {}
      };

      ws.onerror = () => {
        setLoadingMarkets(false);
      };

      ws.onclose = () => {};
      
      // Timeout para garantir que o skeleton não fique muito tempo
      setTimeout(() => {
        if (loadingMarkets) {
          setLoadingMarkets(false);
        }
      }, 3000);
    } catch (e) {
      setLoadingMarkets(false);
    }
  };

  const getAbbreviation = (symbol: string): string => {
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
    if (symbol.includes('BTC')) return 'BTC';
    if (symbol.includes('ETH')) return 'ETH';
    if (symbol.includes('LTC')) return 'LTC';
    if (symbol.includes('XRP')) return 'XRP';
    return symbol.substring(0, 3);
  };

  const getMarketLogo = (symbol: string) => {
    if (symbol.includes('BTC')) return 'https://cryptologos.cc/logos/bitcoin-btc-logo.png';
    if (symbol.includes('ETH')) return 'https://cryptologos.cc/logos/ethereum-eth-logo.png';
    if (symbol.includes('LTC')) return 'https://cryptologos.cc/logos/litecoin-ltc-logo.png';
    if (symbol.includes('XRP')) return 'https://cryptologos.cc/logos/xrp-xrp-logo.png';
    return 'candlestick';
  };

  const processTopMarkets = (symbols: any[]) => {
    const markets: MarketData[] = [];
    const tickSymbols: string[] = [];

    const filtered = symbols.filter(s => !s.is_trading_suspended && s.exchange_is_open);
    const top12 = filtered.slice(0, 12);

    top12.forEach(symbol => {
      const marketData: MarketData = {
        symbol: symbol.symbol,
        display_name: symbol.display_name,
        price: 0,
        change_percentage: 0,
        logo: getMarketLogo(symbol.symbol),
        abbreviation: getAbbreviation(symbol.symbol),
      };
      markets.push(marketData);
      tickSymbols.push(symbol.symbol);
    });

    setTopMarkets(markets);
    setLoadingMarkets(false);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      tickSymbols.forEach(symbol => {
        try {
          wsRef.current?.send(JSON.stringify({
            ticks: symbol,
            subscribe: 1
          }));
        } catch (e) {}
      });
    }
  };

  const updateMarketPrice = (tick: any) => {
    if (!tick || !tick.symbol) return;
    setTopMarkets(prev => 
      prev.map(market => {
        if (market.symbol === tick.symbol) {
          const previousPrice = market.price || tick.quote;
          const currentPrice = tick.quote;
          const change = currentPrice - previousPrice;
          const changePercentage = previousPrice !== 0 ? ((change / previousPrice) * 100) : 0;
          
          return {
            ...market,
            price: currentPrice,
            change_percentage: changePercentage,
          };
        }
        return market;
      })
    );
  };

  const toggleDrawer = useCallback(() => {
    if (isDrawerOpen) {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(mainContentScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(mainContentTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setIsDrawerOpen(false));
    } else {
      setIsDrawerOpen(true);
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(mainContentScale, {
          toValue: 0.92,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(mainContentTranslateY, {
          toValue: 60,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDrawerOpen]);

  const navigateToSettings = useCallback(() => {
    toggleDrawer();
    setTimeout(() => navigation.navigate('Settings'), 250);
  }, [navigation, toggleDrawer]);

  const navigateToProfile = useCallback(() => {
    toggleDrawer();
  }, [toggleDrawer]);

  const navigateToHelp = useCallback(() => {
    toggleDrawer();
  }, [toggleDrawer]);

  const closePortfolioModal = useCallback(() => {
    setModalActive(false);
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    Animated.parallel([
      Animated.spring(portfolioModalSlide, {
        toValue: 1,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(portfolioModalOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(modalScreenScale, {
        toValue: 1,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(modalScreenTranslateY, {
        toValue: 0,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowPortfolioModal(false);
    });
  }, [isDarkMode]);

  const closeAssistantModal = useCallback(() => {
    setModalActive(false);
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    Animated.parallel([
      Animated.spring(assistantModalSlide, {
        toValue: 1,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(assistantModalOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(modalScreenScale, {
        toValue: 1,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(modalScreenTranslateY, {
        toValue: 0,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAssistantModal(false);
    });
  }, [isDarkMode]);

  const closeCreateMenu = useCallback(() => {
    setModalActive(false);
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    Animated.parallel([
      Animated.spring(menuAnimation, {
        toValue: 0,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(menuOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(modalScreenScale, {
        toValue: 1,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(modalScreenTranslateY, {
        toValue: 0,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCreateMenu(false);
    });
  }, [isDarkMode]);

  useEffect(() => {
    const backAction = () => {
      if (showPortfolioModal) {
        closePortfolioModal();
        return true;
      }
      if (showAssistantModal) {
        closeAssistantModal();
        return true;
      }
      if (showCreateMenu) {
        closeCreateMenu();
        return true;
      }
      if (isDrawerOpen) {
        toggleDrawer();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isDrawerOpen, showPortfolioModal, showCreateMenu, showAssistantModal]);

  useEffect(() => {
    portfolioPanResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          const progress = Math.min(gestureState.dy / 400, 1);
          portfolioModalSlide.setValue(progress);
          portfolioModalOpacity.setValue(1 - progress * 0.5);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 0.6) {
          closePortfolioModal();
        } else {
          Animated.parallel([
            Animated.spring(portfolioModalSlide, {
              toValue: 0,
              tension: 50,
              friction: 9,
              useNativeDriver: true,
            }),
            Animated.timing(portfolioModalOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    });

    assistantPanResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          const progress = Math.min(gestureState.dy / 400, 1);
          assistantModalSlide.setValue(progress);
          assistantModalOpacity.setValue(1 - progress * 0.5);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 0.6) {
          closeAssistantModal();
        } else {
          Animated.parallel([
            Animated.spring(assistantModalSlide, {
              toValue: 0,
              tension: 50,
              friction: 9,
              useNativeDriver: true,
            }),
            Animated.timing(assistantModalOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    });

    createMenuPanResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          const progress = Math.min(gestureState.dy / 300, 1);
          menuAnimation.setValue(1 - progress);
          menuOpacity.setValue(1 - progress * 0.5);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeCreateMenu();
        } else {
          Animated.parallel([
            Animated.spring(menuAnimation, {
              toValue: 1,
              tension: 50,
              friction: 9,
              useNativeDriver: true,
            }),
            Animated.timing(menuOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    });
  }, []);

  const openCreateMenu = () => {
    setModalActive(true);
    RNStatusBar.setBarStyle('light-content', true);
    setShowCreateMenu(true);
    menuAnimation.setValue(0);
    menuOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(menuAnimation, {
        toValue: 1,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(menuOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(modalScreenScale, {
        toValue: 0.92,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(modalScreenTranslateY, {
        toValue: 20,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const openPortfolioModal = () => {
    setModalActive(true);
    RNStatusBar.setBarStyle('light-content', true);
    setShowPortfolioModal(true);
    portfolioModalSlide.setValue(1);
    portfolioModalOpacity.setValue(0);

    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(portfolioModalSlide, {
          toValue: 0,
          tension: 40,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(portfolioModalOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(modalScreenScale, {
          toValue: 0.96,
          tension: 40,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(modalScreenTranslateY, {
          toValue: 20,
          tension: 40,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const openAssistantModal = () => {
    Animated.sequence([
      Animated.timing(pulseAnimations.assistant, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimations.assistant, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setModalActive(true);
    RNStatusBar.setBarStyle('light-content', true);
    setShowAssistantModal(true);
    assistantModalSlide.setValue(1);
    assistantModalOpacity.setValue(0);

    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(assistantModalSlide, {
          toValue: 0,
          tension: 40,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(assistantModalOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(modalScreenScale, {
          toValue: 0.96,
          tension: 40,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(modalScreenTranslateY, {
          toValue: 20,
          tension: 40,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const startPulseAnimation = (tab: string) => {
    const pulseAnim = pulseAnimations[tab as keyof typeof pulseAnimations];
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    startPulseAnimation(tab);
  };

  const handleLogoutPressIn = () => {
    Animated.timing(logoutBorderRadius, {
      toValue: 8,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleLogoutPressOut = () => {
    Animated.timing(logoutBorderRadius, {
      toValue: 100,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleLogout = () => {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    }
  };

  const drawerTranslateX = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 0],
  });

  const overlayOpacity = fadeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const getTabTitle = () => {
    if (activeTab === 'inicio') return 'Boxtube';
    if (activeTab === 'mercado') return getTranslation(language, 'mercado');
    if (activeTab === 'portfolio') return getTranslation(language, 'portfolio');
    if (activeTab === 'automacao') return getTranslation(language, 'automacao');
    return 'Boxtube';
  };

  const getActiveIconColor = () => {
    return isDarkMode ? '#FFFFFF' : primaryColor;
  };

  const renderMarketItem = (market: MarketData) => {
    const isPositive = market.change_percentage > 0;
    const isNegative = market.change_percentage < 0;
    const changeColor = isPositive ? '#00C853' : isNegative ? '#FF5252' : (isDarkMode ? '#7C7D80' : '#9E9E9E');
    const changePrefix = isPositive ? '+' : '';

    return (
      <TouchableOpacity
        key={market.symbol}
        style={[
          styles.marketCard,
          { backgroundColor: isDarkMode ? '#2A2B2D' : '#F0F2F5' }
        ]}
        activeOpacity={0.7}
        onPress={() => {
          navigation.navigate('MarketDetail', {
            market: {
              ...market,
              previous_price: market.price,
              change: market.price * (market.change_percentage / 100),
              category: 'synthetic',
            },
            isDarkMode
          });
        }}
      >
        {/* Ícono */}
        <View style={[styles.marketCardIcon, { backgroundColor: isDarkMode ? '#353739' : '#DDDFE3' }]}>
          {market.logo === 'candlestick' ? (
            <Image source={require('../../assets/candlestick.png')} style={styles.marketCardImage} resizeMode="contain" />
          ) : (
            <Image source={{ uri: market.logo }} style={styles.marketCardImage} resizeMode="contain" />
          )}
        </View>

        {/* Centro — nome */}
        <View style={styles.marketCardInfo}>
          <Text style={[styles.marketCardName, { color: isDarkMode ? '#E4E6EB' : '#050505' }]} numberOfLines={1}>
            {market.abbreviation}
          </Text>
          <Text style={[styles.marketCardDisplayName, { color: isDarkMode ? '#7C7D80' : '#9E9E9E' }]} numberOfLines={1}>
            {market.display_name}
          </Text>
        </View>

        {/* Direita — preço + variação */}
        <View style={styles.marketCardPrices}>
          <Text style={[styles.marketCardPrice, { color: isDarkMode ? '#E4E6EB' : '#050505' }]}>
            {market.price > 0 ? market.price.toFixed(market.price >= 1000 ? 2 : 5) : '---'}
          </Text>
          <View style={[styles.marketCardBadge, { backgroundColor: isPositive ? '#00C85320' : isNegative ? '#FF525220' : (isDarkMode ? '#3E4042' : '#E5E7EB') }]}>
            <Text style={[styles.marketCardChange, { color: changeColor }]}>
              {market.price > 0 && market.change_percentage !== 0
                ? `${changePrefix}${market.change_percentage.toFixed(2)}%`
                : '---'
              }
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSeeMoreItem = () => {
    return (
      <TouchableOpacity
        style={[
          styles.marketCard,
          styles.seeMoreCard,
          { backgroundColor: isDarkMode ? '#2A2B2D' : '#F0F2F5' }
        ]}
        activeOpacity={0.7}
        onPress={() => handleTabChange('mercado')}
      >
        <View style={[styles.seeMoreIconCircle, { backgroundColor: isDarkMode ? '#353739' : '#DDDFE3' }]}>
          <MaterialCommunityIcons name="arrow-right" size={22} color={isDarkMode ? '#E4E6EB' : '#050505'} />
        </View>
        <Text style={[styles.seeMoreText, { color: isDarkMode ? '#E4E6EB' : '#050505' }]}>
          Ver mais mercados
        </Text>
      </TouchableOpacity>
    );
  };

  const totalPages = topMarkets.length + 1; // +1 para "Ver mais"

  const renderCarouselPage = (pageIndex: number) => {
    if (pageIndex === topMarkets.length) {
      return (
        <View key={pageIndex} style={styles.carouselPage}>
          {renderSeeMoreItem()}
        </View>
      );
    }
    return (
      <View key={pageIndex} style={styles.carouselPage}>
        {renderMarketItem(topMarkets[pageIndex])}
      </View>
    );
  };

  const renderContent = () => {
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

    const shimmerOpacity = shimmerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    if (activeTab === 'inicio') {
      return (
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Saldo USDT */}
            <View style={styles.balanceWrapper}>
              {loadingBalance ? (
                <SkeletonBalance isDarkMode={isDarkMode} />
              ) : (
                <View style={styles.balanceRow}>
                  <View>
                    <Text style={[styles.balanceLabel, { color: isDarkMode ? '#7C7D80' : '#9E9E9E' }]}>
                      Saldo disponível
                    </Text>
                    <Text style={[styles.balanceAmount, { color: isDarkMode ? '#E4E6EB' : '#050505' }]}>
                      {balance !== null ? balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}{' '}
                      <Text style={[styles.balanceCurrency, { color: isDarkMode ? '#7C7D80' : '#9E9E9E' }]}>
                        {currency}
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.balanceButtons}>
                    <TouchableOpacity
                      style={styles.balanceButton}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.balanceButtonCircle, { backgroundColor: '#10B981' }]}>
                        <DepositIcon size={18} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.balanceButton}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.balanceButtonCircle, { backgroundColor: '#EF4444' }]}>
                        <WithdrawIcon size={18} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Carrossel — 1 card por página */}
            <View style={styles.carouselWrapper}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const pageIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                  setCurrentPage(pageIndex);
                }}
              >
                {loadingMarkets ? (
                  <View style={styles.carouselPage}>
                    <View style={[styles.marketCard, { backgroundColor: isDarkMode ? '#2A2B2D' : '#F0F2F5' }]}>
                      <View style={[styles.marketCardIcon, { backgroundColor: isDarkMode ? '#353739' : '#DDDFE3' }]} />
                      <View style={styles.marketCardInfo}>
                        <View style={{ height: 13, width: 60, backgroundColor: isDarkMode ? '#3E4042' : '#DDDFE3', borderRadius: 6 }} />
                        <View style={{ height: 11, width: 100, backgroundColor: isDarkMode ? '#3E4042' : '#DDDFE3', borderRadius: 5, marginTop: 5 }} />
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 5 }}>
                        <View style={{ height: 13, width: 70, backgroundColor: isDarkMode ? '#3E4042' : '#DDDFE3', borderRadius: 6 }} />
                        <View style={{ height: 20, width: 55, backgroundColor: isDarkMode ? '#3E4042' : '#DDDFE3', borderRadius: 10 }} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <>
                    {Array.from({ length: totalPages }, (_, i) => renderCarouselPage(i))}
                  </>
                )}
              </ScrollView>

              {/* Indicadores de página */}
              <View style={styles.pageIndicators}>
                {Array.from({ length: loadingMarkets ? 1 : totalPages }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.pageIndicator,
                      {
                        backgroundColor: currentPage === i
                          ? (isDarkMode ? '#E4E6EB' : '#050505')
                          : (isDarkMode ? '#3E4042' : '#E5E7EB'),
                      }
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Opções de ação */}
            <View style={styles.actionsWrapper}>
              {loadingMarkets ? (
                <>
                  {/* Skeleton Par 1 */}
                  <View style={styles.actionPairWrapper}>
                    <View style={[styles.actionPairContainer, { backgroundColor: isDarkMode ? '#2A2B2D' : '#F0F2F5' }]}>
                      <Animated.View style={[styles.actionIconCircle, { backgroundColor: isDarkMode ? '#353739' : '#DDDFE3', opacity: shimmerOpacity }]} />
                      <Animated.View style={[styles.actionIconCircle, { backgroundColor: isDarkMode ? '#353739' : '#DDDFE3', opacity: shimmerOpacity }]} />
                    </View>
                    <View style={styles.actionLabelsRow}>
                      <Animated.View style={[{ height: 12, width: 50, borderRadius: 6, backgroundColor: isDarkMode ? '#353739' : '#DDDFE3', opacity: shimmerOpacity }]} />
                      <Animated.View style={[{ height: 12, width: 50, borderRadius: 6, backgroundColor: isDarkMode ? '#353739' : '#DDDFE3', opacity: shimmerOpacity }]} />
                    </View>
                  </View>

                  {/* Skeleton Par 2 */}
                  <View style={styles.actionPairWrapper}>
                    <View style={[styles.actionPairContainer, { backgroundColor: isDarkMode ? '#2A2B2D' : '#F0F2F5' }]}>
                      <Animated.View style={[styles.actionIconCircle, { backgroundColor: isDarkMode ? '#353739' : '#DDDFE3', opacity: shimmerOpacity }]} />
                      <Animated.View style={[styles.actionIconCircle, { backgroundColor: isDarkMode ? '#353739' : '#DDDFE3', opacity: shimmerOpacity }]} />
                    </View>
                    <View style={styles.actionLabelsRow}>
                      <Animated.View style={[{ height: 12, width: 50, borderRadius: 6, backgroundColor: isDarkMode ? '#353739' : '#DDDFE3', opacity: shimmerOpacity }]} />
                      <Animated.View style={[{ height: 12, width: 50, borderRadius: 6, backgroundColor: isDarkMode ? '#353739' : '#DDDFE3', opacity: shimmerOpacity }]} />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Par 1: Enviar e Receber */}
                  <View style={styles.actionPairWrapper}>
                    <View style={[styles.actionPairContainer, { backgroundColor: isDarkMode ? '#2A2B2D' : '#F0F2F5' }]}>
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        activeOpacity={0.6}
                        onPress={() => {}}
                      >
                        <View style={[styles.actionIconCircle, { backgroundColor: '#3B82F6' }]}>
                          <SendIcon size={20} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionIconButton}
                        activeOpacity={0.6}
                        onPress={() => {}}
                      >
                        <View style={[styles.actionIconCircle, { backgroundColor: '#10B981' }]}>
                          <ReceiveIcon size={20} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.actionLabelsRow}>
                      <Text style={[styles.actionLabel, { color: isDarkMode ? '#7C7D80' : '#9E9E9E' }]}>
                        Enviar
                      </Text>
                      <Text style={[styles.actionLabel, { color: isDarkMode ? '#7C7D80' : '#9E9E9E' }]}>
                        Receber
                      </Text>
                    </View>
                  </View>

                  {/* Par 2: Colaborar e Sinais */}
                  <View style={styles.actionPairWrapper}>
                    <View style={[styles.actionPairContainer, { backgroundColor: isDarkMode ? '#2A2B2D' : '#F0F2F5' }]}>
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        activeOpacity={0.6}
                        onPress={() => {}}
                      >
                        <View style={[styles.actionIconCircle, { backgroundColor: '#8B5CF6' }]}>
                          <MaterialCommunityIcons name="handshake" size={20} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionIconButton}
                        activeOpacity={0.6}
                        onPress={openAssistantModal}
                      >
                        <View style={[styles.actionIconCircle, { backgroundColor: '#F59E0B' }]}>
                          <ProbabilityIcon size={20} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.actionLabelsRow}>
                      <Text style={[styles.actionLabel, { color: isDarkMode ? '#7C7D80' : '#9E9E9E' }]}>
                        Colaborar
                      </Text>
                      <Text style={[styles.actionLabel, { color: isDarkMode ? '#7C7D80' : '#9E9E9E' }]}>
                        Sinais
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      );
    }

    if (activeTab === 'mercado') {
      return <MarketScreen isDarkMode={isDarkMode} navigation={navigation} />;
    }

    if (activeTab === 'automacao') {
      return (
        <View style={[globalStyles.content, { backgroundColor: colors.background }]}>
          <Text style={[globalStyles.appName, { color: colors.text }]}>Automação</Text>
        </View>
      );
    }

    return (
      <View style={[globalStyles.content, { backgroundColor: colors.background }]}>
        <Text style={[globalStyles.appName, { color: colors.text }]}>Boxtube</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <RNStatusBar
        barStyle={modalActive ? 'light-content' : (isDarkMode ? 'light-content' : 'dark-content')}
        backgroundColor="transparent"
        translucent={true}
        animated={true}
      />

      <View style={{ position: 'absolute', width: '100%', height: '100%', opacity: showPortfolioModal ? 1 : 0, zIndex: showPortfolioModal ? 1001 : -1 }}>
        {showPortfolioModal && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={globalStyles.platformModalBackdrop} activeOpacity={1} onPress={closePortfolioModal} />
            <Animated.View
              style={[
                globalStyles.platformModalContent,
                {
                  backgroundColor: colors.surface,
                  opacity: portfolioModalOpacity,
                  transform: [
                    {
                      translateY: portfolioModalSlide.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 600],
                      }),
                    },
                  ],
                },
              ]}
              {...(portfolioPanResponder.current?.panHandlers || {})}
            >
              <View style={styles.portfolioContent}>
                <View style={styles.portfolioHeader}>
                  <Text style={[styles.portfolioTitle, { color: colors.text }]}>Portfólio</Text>
                  <PortfolioFilledIcon size={28} color={colors.text} />
                </View>
                <Text style={[styles.portfolioSubtitle, { color: colors.textSecondary }]}>
                  Seu portfólio personalizado em breve
                </Text>
              </View>
            </Animated.View>
          </View>
        )}
      </View>

      {isDrawerOpen && (
        <Animated.View style={[styles.fullScreenOverlay, { opacity: overlayOpacity }]} pointerEvents="box-none">
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={toggleDrawer} />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.fullDrawer,
          { backgroundColor: isDarkMode ? '#18191A' : '#FFFFFF' },
          { transform: [{ translateX: drawerTranslateX }], opacity: fadeAnimation },
        ]}
      >
        <View style={[styles.drawerHeader, { borderBottomColor: isDarkMode ? '#2F3336' : '#E5E7EB' }]}>
          <Text style={[styles.drawerTitle, { color: colors.text }]}>Menu</Text>
          <TouchableOpacity onPress={toggleDrawer} style={styles.closeButton}>
            <DoubleChevronRightIcon size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.drawerBody}>
          <TouchableOpacity
            style={styles.drawerMenuItem}
            onPress={navigateToProfile}
            activeOpacity={0.7}
          >
            <View style={[styles.drawerIconContainer, { backgroundColor: isDarkMode ? '#2F3336' : '#F3F4F6' }]}>
              <MaterialCommunityIcons name="account-circle" size={22} color={colors.text} />
            </View>
            <Text style={[styles.drawerMenuText, { color: colors.text }]}>
              {getTranslation(language, 'profile')}
            </Text>
          </TouchableOpacity>

          <View style={[styles.drawerDivider, { backgroundColor: isDarkMode ? '#2F3336' : '#E5E7EB' }]} />

          <TouchableOpacity
            style={styles.drawerMenuItem}
            onPress={navigateToSettings}
            activeOpacity={0.7}
          >
            <View style={[styles.drawerIconContainer, { backgroundColor: isDarkMode ? '#2F3336' : '#F3F4F6' }]}>
              <MaterialCommunityIcons name="cog" size={22} color={colors.text} />
            </View>
            <Text style={[styles.drawerMenuText, { color: colors.text }]}>
              {getTranslation(language, 'settings')}
            </Text>
          </TouchableOpacity>

          <View style={[styles.drawerDivider, { backgroundColor: isDarkMode ? '#2F3336' : '#E5E7EB' }]} />

          <TouchableOpacity
            style={styles.drawerMenuItem}
            onPress={navigateToHelp}
            activeOpacity={0.7}
          >
            <View style={[styles.drawerIconContainer, { backgroundColor: isDarkMode ? '#2F3336' : '#F3F4F6' }]}>
              <MaterialCommunityIcons name="help-circle" size={22} color={colors.text} />
            </View>
            <Text style={[styles.drawerMenuText, { color: colors.text }]}>
              {getTranslation(language, 'help')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.drawerFooter}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={handleLogoutPressIn}
            onPressOut={handleLogoutPressOut}
            onPress={handleLogout}
          >
            <Animated.View
              style={[
                styles.logoutButton,
                {
                  borderRadius: logoutBorderRadius,
                },
              ]}
            >
              <LogoutIcon size={22} color="#FFFFFF" />
              <Text style={styles.logoutText}>{getTranslation(language, 'logout')}</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          { flex: 1 },
          {
            backgroundColor: isDarkMode ? colors.background : '#FFFFFF',
            transform: [
              { scale: isDrawerOpen ? mainContentScale : (modalActive ? modalScreenScale : 1) },
              { translateY: isDrawerOpen ? mainContentTranslateY : (modalActive ? modalScreenTranslateY : 0) },
            ],
            borderTopLeftRadius: isDrawerOpen ? slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 16],
            }) : (modalActive ? 16 : 0),
            borderTopRightRadius: isDrawerOpen ? slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 16],
            }) : (modalActive ? 16 : 0),
            overflow: 'hidden',
          },
        ]}
      >
        {activeTab !== 'automacao' && (
          <View style={[styles.appbarContainer, { backgroundColor: isDarkMode ? colors.background : '#FFFFFF' }]}>
            <View style={[globalStyles.appbar, { backgroundColor: 'transparent' }]}>
              {(activeTab === 'inicio' || activeTab === 'mercado') && (
                <TouchableOpacity onPress={toggleDrawer} style={globalStyles.iconButton}>
                  <DrawerMenuIcon size={20} color={colors.text} />
                </TouchableOpacity>
              )}

              <Text
                style={[
                  globalStyles.appbarTitle,
                  activeTab === 'inicio' && globalStyles.appbarTitleBold,
                  { color: colors.text },
                ]}
              >
                {getTabTitle()}
              </Text>

              <View style={{ flex: 1 }} />

              {activeTab !== 'automacao' && (
                <TouchableOpacity style={globalStyles.iconButton} onPress={openCreateMenu}>
                  <View style={globalStyles.roundedIconContainer}>
                    <PlusIcon size={18} color={colors.text} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {activeTab === 'automacao' && (
          <View style={[styles.appbarContainer, { backgroundColor: isDarkMode ? colors.background : '#FFFFFF' }]}>
            <View style={[globalStyles.appbar, { backgroundColor: 'transparent' }]}>
              <Text
                style={[
                  globalStyles.appbarTitle,
                  { color: colors.text },
                ]}
              >
                {getTabTitle()}
              </Text>
            </View>
          </View>
        )}

        {renderContent()}

        <LinearGradient
          colors={
            isDarkMode
              ? ['rgba(14, 15, 16, 0)', 'rgba(14, 15, 16, 0.7)', 'rgba(14, 15, 16, 0.95)', 'rgba(14, 15, 16, 1)']
              : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 1)']
          }
          style={styles.bottomBarGradient}
        >
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('inicio')} activeOpacity={0.7}>
              <Animated.View
                style={[
                  styles.iconWrapper,
                  {
                    transform: [{ scale: pulseAnimations.inicio }],
                  },
                ]}
              >
                {activeTab === 'inicio' ? (
                  <HomeFilledIcon size={22} color={getActiveIconColor()} />
                ) : (
                  <HomeOutlineIcon size={22} color={colors.textSecondary} />
                )}
              </Animated.View>
              <Text style={[styles.label, { color: activeTab === 'inicio' ? getActiveIconColor() : colors.textSecondary }]}>
                {getTranslation(language, 'inicio')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('mercado')} activeOpacity={0.7}>
              <Animated.View
                style={[
                  styles.iconWrapper,
                  {
                    transform: [{ scale: pulseAnimations.mercado }],
                  },
                ]}
              >
                {activeTab === 'mercado' ? (
                  <MarketFilledIcon size={22} color={getActiveIconColor()} />
                ) : (
                  <MarketOutlineIcon size={22} color={colors.textSecondary} />
                )}
              </Animated.View>
              <Text style={[styles.label, { color: activeTab === 'mercado' ? getActiveIconColor() : colors.textSecondary }]}>
                {getTranslation(language, 'mercado')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabButton} onPress={openPortfolioModal} activeOpacity={0.7}>
              <Animated.View
                style={[
                  styles.iconWrapper,
                  {
                    transform: [{ scale: pulseAnimations.portfolio }],
                  },
                ]}
              >
                {activeTab === 'portfolio' ? (
                  <PortfolioFilledIcon size={22} color={getActiveIconColor()} />
                ) : (
                  <PortfolioOutlineIcon size={22} color={colors.textSecondary} />
                )}
              </Animated.View>
              <Text
                style={[styles.label, { color: activeTab === 'portfolio' ? getActiveIconColor() : colors.textSecondary }]}
              >
                {getTranslation(language, 'portfolio')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('automacao')} activeOpacity={0.7}>
              <Animated.View
                style={[
                  styles.iconWrapper,
                  {
                    transform: [{ scale: pulseAnimations.automacao }],
                  },
                ]}
              >
                {activeTab === 'automacao' ? (
                  <AutomationFilledIcon size={22} color={getActiveIconColor()} />
                ) : (
                  <AutomationOutlineIcon size={22} color={colors.textSecondary} />
                )}
              </Animated.View>
              <Text style={[styles.label, { color: activeTab === 'automacao' ? getActiveIconColor() : colors.textSecondary }]}>
                {getTranslation(language, 'automacao')}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

      </Animated.View>

      <Modal visible={showCreateMenu} transparent animationType="none" onRequestClose={closeCreateMenu}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeCreateMenu}>
          <Animated.View
            style={[
              globalStyles.createMenu,
              { backgroundColor: colors.surface },
              {
                opacity: menuOpacity,
                transform: [
                  {
                    translateY: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
              },
            ]}
            {...(createMenuPanResponder.current?.panHandlers || {})}
          >
            <TouchableOpacity style={globalStyles.menuItem} onPress={closeCreateMenu} activeOpacity={0.6}>
              <NewPostIcon size={22} color={colors.text} />
              <Text style={[globalStyles.menuItemText, { color: colors.text }]}>
                {getTranslation(language, 'newPost')}
              </Text>
            </TouchableOpacity>
            <View style={[globalStyles.menuDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={globalStyles.menuItem} onPress={closeCreateMenu} activeOpacity={0.6}>
              <NewChannelIcon size={22} color={colors.text} />
              <Text style={[globalStyles.menuItemText, { color: colors.text }]}>
                {getTranslation(language, 'createChannel')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Modal do Probabilizador */}
      <View style={{ position: 'absolute', width: '100%', height: '100%', opacity: showAssistantModal ? 1 : 0, zIndex: showAssistantModal ? 1002 : -1 }}>
        {showAssistantModal && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={globalStyles.platformModalBackdrop} activeOpacity={1} onPress={closeAssistantModal} />
            <Animated.View
              style={[
                globalStyles.platformModalContent,
                {
                  backgroundColor: colors.surface,
                  opacity: assistantModalOpacity,
                  transform: [
                    {
                      translateY: assistantModalSlide.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 600],
                      }),
                    },
                  ],
                },
              ]}
              {...(assistantPanResponder.current?.panHandlers || {})}
            >
              <View style={styles.portfolioContent}>
                <View style={styles.portfolioHeader}>
                  <Text style={[styles.portfolioTitle, { color: colors.text }]}>Probabilizador</Text>
                  <ProbabilityIcon size={32} color={appColors.primary} />
                </View>
                <Text style={[styles.portfolioSubtitle, { color: colors.textSecondary }]}>
                  Seu probabilizador inteligente em breve
                </Text>
              </View>
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 999,
  },
  fullDrawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '100%',
    zIndex: 1000,
    paddingTop: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingTop: 32,
    borderBottomWidth: 0.5,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
    marginRight: -4,
  },
  drawerBody: {
    flex: 1,
    paddingTop: 8,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  drawerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  drawerMenuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  drawerDivider: {
    height: 0.5,
    marginHorizontal: 24,
    marginVertical: 4,
  },
  drawerFooter: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  carouselWrapper: {
    paddingHorizontal: 0,
    marginTop: 4,
  },
  carouselPage: {
    width: width,
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  /* Card de mercado — full width */
  marketCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  marketCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketCardImage: {
    width: 24,
    height: 24,
  },
  marketCardInfo: {
    flex: 1,
    minWidth: 0,
  },
  marketCardName: {
    fontSize: 15,
    fontWeight: '700',
  },
  marketCardDisplayName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  marketCardPrices: {
    alignItems: 'flex-end',
    gap: 4,
  },
  marketCardPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  marketCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  marketCardChange: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Ver mais */
  seeMoreCard: {
    justifyContent: 'center',
    gap: 14,
  },
  seeMoreIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },

  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  pageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* Opções de ação */
  actionsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  actionPairWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  actionPairContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 32,
  },
  actionIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabelsRow: {
    flexDirection: 'row',
    gap: 48,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    width: 56,
  },

  balanceWrapper: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  balanceCurrency: {
    fontSize: 20,
    fontWeight: '600',
  },
  balanceButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  balanceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceButtonSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  bottomBarGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    flexDirection: 'row',
    height: 58,
    paddingBottom: 4,
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  portfolioContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  portfolioTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  portfolioSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  appbarContainer: {
    paddingBottom: 0,
    zIndex: 10,
    // sombras removidas conforme solicitado
  },
});