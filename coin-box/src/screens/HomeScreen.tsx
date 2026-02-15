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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import MarketScreen from './MarketScreen';
import { COLORS, getDynamicColors } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
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
  DepositIcon,
  WithdrawIcon,
  FilterIcon,
  EyeIcon,
} from '../components/Icons';
import ProbabilityIcon from '../components/ProbabilityIcon';
import derivService from '../services/derivService';

const { width, height } = Dimensions.get('window');

const APP_BLUE = '#0088CC'; // Telegram Blue
const TAB_ACTIVE_BG = 'rgba(0,136,204,0.12)';
const TAB_ACTIVE_BG_DARK = 'rgba(28,63,90,0.18)';

// NewsData.io API - NOTÍCIAS INTERNACIONAIS (sem filtro de país)
const NEWSDATA_API_KEY = 'pub_7d7d1ac2f86b4bc6b4662fd5d6dad47c';
const NEWSDATA_API_URL = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&category=business,top,world&language=en`;

// Tamanho original aproximado dos cards do mercado (voltado pequeno)

/* ---------- Small skeleton for the balance ---------- */
const SkeletonBalance = ({ isDarkMode }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] });
  const color = isDarkMode ? '#2F3336' : '#E5E7EB';
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <Animated.View style={{ height: 20, width: 160, borderRadius: 8, backgroundColor: color, opacity }} />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <Animated.View style={{ width: 120, height: 64, borderRadius: 12, backgroundColor: color, opacity }} />
        <Animated.View style={{ width: 120, height: 64, borderRadius: 12, backgroundColor: color, opacity }} />
      </View>
    </View>
  );
};

/* ---------- News Section Component ---------- */
const NewsSection = ({ isDarkMode, news = [], onNewsPress, selectedCategory, onFilterPress }) => {
  const colors = getDynamicColors(isDarkMode);
  
  if (news.length === 0) {
    return (
      <View style={[styles.newsSection, { backgroundColor: isDarkMode ? '#0E0F10' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}>
        <ActivityIndicator size="large" color="#0088CC" />
      </View>
    );
  }
  
  return (
    <View style={[styles.newsSection, { backgroundColor: isDarkMode ? '#0E0F10' : '#FFFFFF' }]}>
      <View style={styles.newsSectionHeader}>
        <Text style={[styles.newsSectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Atualidade</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onFilterPress}>
          <FilterIcon size={22} color={APP_BLUE} />
        </TouchableOpacity>
      </View>
      
      <View style={{ paddingHorizontal: 8 }}>
        {news
          .filter(item => !selectedCategory || (item.category && item.category.includes(selectedCategory)))
          .map((item, index) => {
          if (!item.title || !item.image_url) return null;
          
          return (
            <View key={item.article_id || index}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onNewsPress(item)}
                style={{ paddingVertical: 12 }}
              >
                <Image 
                  source={{ uri: item.image_url }} 
                  style={{ width: '100%', height: 200, borderRadius: 16, marginBottom: 12 }}
                  resizeMode="cover"
                />
                <View style={{ paddingHorizontal: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    {item.category && item.category[0] && (
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {item.category[0]}
                      </Text>
                    )}
                    {item.pubDate && (
                      <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                        {new Date(item.pubDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </Text>
                    )}
                  </View>
                  
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, lineHeight: 24, marginBottom: 8 }} numberOfLines={2}>
                    {item.title}
                  </Text>
                  
                  {item.description && (
                    <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 10 }} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  
                  {item.source_name && item.source_icon && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 20, height: 20, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.border }}>
                        <Image 
                          source={{ uri: item.source_icon }} 
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </View>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }} numberOfLines={1}>
                        {item.source_name}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              
              {index < news.length - 1 && (
                <LinearGradient
                  colors={[
                    isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', 
                    isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', 
                    isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', 
                    isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  locations={[0, 0.05, 0.95, 1]}
                  style={{ height: 0.8, marginHorizontal: 0 }}
                />
              )}
            </View>
          );
        })}
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
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [primaryColor] = useState('#FF444F');
  const [modalActive, setModalActive] = useState(false);
  const [topMarkets, setTopMarkets] = useState([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [balance, setBalance] = useState(null);
  const [currency, setCurrency] = useState('USD');

  // controla se o ScrollView pai está habilitado (desligamos durante o drag do carousel)
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Controle de scroll para animação do header
  const scrollY = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(0)).current;
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const filterModalOpacity = useRef(new Animated.Value(0)).current;
  const filterModalSlide = useRef(new Animated.Value(1)).current;

  const wsRef = useRef(null);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;
  const portfolioModalSlide = useRef(new Animated.Value(1)).current;
  const portfolioModalOpacity = useRef(new Animated.Value(0)).current;
  const assistantModalSlide = useRef(new Animated.Value(1)).current;
  const assistantModalOpacity = useRef(new Animated.Value(0)).current;
  const newsModalSlide = useRef(new Animated.Value(1)).current;
  const newsModalOpacity = useRef(new Animated.Value(0)).current;
  const portfolioPanResponder = useRef(null);
  const createMenuPanResponder = useRef(null);
  const assistantPanResponder = useRef(null);
  const newsPanResponder = useRef(null);
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

  // Animações de pílula para tabs
  const tabPillAnimations = useRef({
    inicio: new Animated.Value(0),
    mercado: new Animated.Value(0),
    portfolio: new Animated.Value(0),
    automacao: new Animated.Value(0),
  }).current;

  const colors = isDarkMode ? COLORS.dark : COLORS.light;
  const appColors = getDynamicColors(isDarkMode, primaryColor);

  // Anima pílulas dos tabs
  useEffect(() => {
    Object.keys(tabPillAnimations).forEach(tab => {
      Animated.timing(tabPillAnimations[tab], {
        toValue: activeTab === tab ? 1 : 0,
        duration: 400,
        useNativeDriver: false,
      }).start();
    });
  }, [activeTab]);

  // shimmer skeleton global
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmerAnimation, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnimation]);

  // derivService (subs de balance)
  useEffect(() => {
    const unsubAuth = derivService.subscribe && derivService.subscribe('authorize', () => {});
    const unsubBal = derivService.subscribe && derivService.subscribe('balance', (data) => {
      setBalance(data.balance);
      setCurrency(data.currency);
      setLoadingMarkets(false);
    });
    const unsubErr = derivService.subscribe && derivService.subscribe('authorize_error', (e) => {
      console.warn('deriv error', e);
      setLoadingMarkets(false);
    });

    return () => {
      typeof unsubAuth === 'function' && unsubAuth();
      typeof unsubBal === 'function' && unsubBal();
      typeof unsubErr === 'function' && unsubErr();
    };
  }, []);

  // Buscar notícias da NewsData.io API
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoadingNews(true);
        const response = await fetch(NEWSDATA_API_URL);
        const data = await response.json();
        
        if (data.status === 'success' && data.results) {
          // Pegar TODAS as notícias com imagem (sem limite)
          const newsWithImages = data.results.filter(article => article.image_url);
          
          console.log('TOTAL NOTÍCIAS:', newsWithImages.length);
          console.log('PRIMEIRA NOTÍCIA:', newsWithImages[0]);
          
          setNews(newsWithImages);
          
          // Extrair categorias únicas
          const allCategories = new Set<string>();
          newsWithImages.forEach((item: any) => {
            if (item.category && Array.isArray(item.category)) {
              item.category.forEach((cat: string) => allCategories.add(cat));
            }
          });
          setCategories(Array.from(allCategories).sort());
        }
      } catch (error) {
        console.error('Erro ao buscar notícias:', error);
      } finally {
        setLoadingNews(false);
      }
    };
    
    fetchNews();
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch(NEWSDATA_API_URL);
      const data = await response.json();
      
      if (data.status === 'success' && data.results) {
        const newsWithImages = data.results.filter(article => article.image_url);
        setNews(newsWithImages);
        
        // Atualizar categorias
        const allCategories = new Set<string>();
        newsWithImages.forEach((item: any) => {
          if (item.category && Array.isArray(item.category)) {
            item.category.forEach((cat: string) => allCategories.add(cat));
          }
        });
        setCategories(Array.from(allCategories).sort());
      }
    } catch (error) {
      console.error('Erro ao atualizar notícias:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Controlar navigation bar do Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setTranslucent(true);
      RNStatusBar.setBackgroundColor('transparent');
      RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    }
  }, [isDarkMode]);

  // websocket
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
      wsRef.current = ws;
      ws.onopen = () => {
        try { ws.send(JSON.stringify({ active_symbols: 'brief', product_type: 'basic' })); }
        catch (e) { console.warn(e); }
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.msg_type === 'active_symbols') processTopMarkets(data.active_symbols);
          else if (data.msg_type === 'tick') updateMarketPrice(data.tick);
        } catch (e) { console.warn(e); }
      };
      ws.onerror = (err) => { console.warn('ws err', err); setLoadingMarkets(false); };
    } catch (e) {
      console.warn(e);
      setLoadingMarkets(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'inicio') connectWebSocket();
    return () => {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
      }
    };
  }, [activeTab, connectWebSocket]);

  // market helpers
  const getAbbreviation = (symbol) => {
    if (!symbol) return '';
    if (symbol.includes('BOOM')) { const m = symbol.match(/\d+/); return m ? `B${m[0]}` : 'BOOM'; }
    if (symbol.includes('CRASH')) { const m = symbol.match(/\d+/); return m ? `C${m[0]}` : 'CRASH'; }
    if (symbol.startsWith('R_')) { const m = symbol.match(/\d+/); return m ? `V${m[0]}` : 'VOL'; }
    if (symbol.includes('BTC')) return 'BTC';
    if (symbol.includes('ETH')) return 'ETH';
    if (symbol.includes('LTC')) return 'LTC';
    if (symbol.includes('XRP')) return 'XRP';
    return symbol.substring(0, 3);
  };

  const getMarketLogo = (symbol) => {
    if (!symbol) return 'candlestick';
    if (symbol.includes('BTC')) return 'https://cryptologos.cc/logos/bitcoin-btc-logo.png';
    if (symbol.includes('ETH')) return 'https://cryptologos.cc/logos/ethereum-eth-logo.png';
    if (symbol.includes('LTC')) return 'https://cryptologos.cc/logos/litecoin-ltc-logo.png';
    if (symbol.includes('XRP')) return 'https://cryptologos.cc/logos/xrp-xrp-logo.png';
    return 'candlestick';
  };

  const processTopMarkets = (symbols) => {
    const filtered = (symbols || []).filter(s => !s.is_trading_suspended && s.exchange_is_open);
    const top12 = filtered.slice(0, 12).map(sym => ({
      symbol: sym.symbol,
      display_name: sym.display_name,
      price: 0,
      change_percentage: 0,
      logo: getMarketLogo(sym.symbol),
      abbreviation: getAbbreviation(sym.symbol),
    }));

    // adicionar um item "seeMore" no final para "Ver mais"
    const withSeeMore = [...top12, { seeMore: true, symbol: 'see-more', display_name: 'Ver mais mercados', price: 0, change_percentage: 0, logo: 'candlestick', abbreviation: 'Ver+' }];

    setTopMarkets(withSeeMore);
    setLoadingMarkets(false);

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        top12.forEach(t => wsRef.current.send(JSON.stringify({ ticks: t.symbol, subscribe: 1 })));
      }
    } catch (e) { /* ignore */ }
  };

  const updateMarketPrice = (tick) => {
    if (!tick || !tick.symbol) return;
    setTopMarkets(prev => prev.map(m => {
      if (m.symbol === tick.symbol) {
        const prevPrice = m.price || tick.quote;
        const now = tick.quote;
        const change = now - prevPrice;
        const changePct = prevPrice !== 0 ? ((change / prevPrice) * 100) : 0;
        return { ...m, price: now, change_percentage: changePct };
      }
      return m;
    }));
  };

  /* UI helpers */
  const toggleDrawer = useCallback(() => {
    if (isDrawerOpen) {
      Animated.parallel([
        Animated.timing(slideAnimation, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnimation, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(mainContentScale, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(mainContentTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setIsDrawerOpen(false));
    } else {
      setIsDrawerOpen(true);
      Animated.parallel([
        Animated.timing(slideAnimation, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnimation, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(mainContentScale, { toValue: 0.92, duration: 300, useNativeDriver: true }),
        Animated.timing(mainContentTranslateY, { toValue: 60, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isDrawerOpen]);

  const closePortfolioModal = useCallback(() => {
    setModalActive(false);
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    Animated.parallel([
      Animated.spring(portfolioModalSlide, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
      Animated.timing(portfolioModalOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.spring(modalScreenScale, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
      Animated.spring(modalScreenTranslateY, { toValue: 0, tension: 40, friction: 10, useNativeDriver: true }),
    ]).start(() => setShowPortfolioModal(false));
  }, [isDarkMode]);

  const closeAssistantModal = useCallback(() => {
    setModalActive(false);
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    Animated.parallel([
      Animated.spring(assistantModalSlide, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
      Animated.timing(assistantModalOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.spring(modalScreenScale, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
      Animated.spring(modalScreenTranslateY, { toValue: 0, tension: 40, friction: 10, useNativeDriver: true }),
    ]).start(() => setShowAssistantModal(false));
  }, [isDarkMode]);

  const openCreateMenu = () => {
    setModalActive(true);
    RNStatusBar.setBarStyle('light-content', true);
    setShowCreateMenu(true);
    menuAnimation.setValue(0);
    menuOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(menuAnimation, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
      Animated.timing(menuOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(modalScreenScale, { toValue: 0.92, tension: 40, friction: 10, useNativeDriver: true }),
      Animated.spring(modalScreenTranslateY, { toValue: 20, tension: 40, friction: 10, useNativeDriver: true }),
    ]).start();
  };

  const openPortfolio = () => {
    setModalActive(true);
    RNStatusBar.setBarStyle('light-content', true);
    setShowPortfolioModal(true);
    portfolioModalSlide.setValue(1);
    portfolioModalOpacity.setValue(0);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(portfolioModalSlide, { toValue: 0, tension: 40, friction: 10, useNativeDriver: true }),
        Animated.timing(portfolioModalOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(modalScreenScale, { toValue: 0.96, tension: 40, friction: 10, useNativeDriver: true }),
        Animated.spring(modalScreenTranslateY, { toValue: 20, tension: 40, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const openAssistant = () => {
    Animated.sequence([
      Animated.timing(pulseAnimations.assistant, { toValue: 1.15, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnimations.assistant, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    setModalActive(true);
    RNStatusBar.setBarStyle('light-content', true);
    setShowAssistantModal(true);
    assistantModalSlide.setValue(1);
    assistantModalOpacity.setValue(0);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(assistantModalSlide, { toValue: 0, tension: 40, friction: 10, useNativeDriver: true }),
        Animated.timing(assistantModalOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(modalScreenScale, { toValue: 0.96, tension: 40, friction: 10, useNativeDriver: true }),
        Animated.spring(modalScreenTranslateY, { toValue: 20, tension: 40, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const openNewsModal = (newsItem) => {
    setSelectedNews(newsItem);
    setModalActive(true);
    RNStatusBar.setBarStyle('light-content', true);
    setShowNewsModal(true);
    newsModalSlide.setValue(1);
    newsModalOpacity.setValue(0);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(newsModalSlide, { toValue: 0, tension: 40, friction: 10, useNativeDriver: true }),
        Animated.timing(newsModalOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(modalScreenScale, { toValue: 0.96, tension: 40, friction: 10, useNativeDriver: true }),
        Animated.spring(modalScreenTranslateY, { toValue: 20, tension: 40, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const closeNewsModal = useCallback(() => {
    setModalActive(false);
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    Animated.parallel([
      Animated.spring(newsModalSlide, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
      Animated.timing(newsModalOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.spring(modalScreenScale, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
      Animated.spring(modalScreenTranslateY, { toValue: 0, tension: 40, friction: 10, useNativeDriver: true }),
    ]).start(() => {
      setShowNewsModal(false);
      setSelectedNews(null);
    });
  }, [isDarkMode]);

  const openFilterModal = () => {
    setModalActive(true);
    RNStatusBar.setBarStyle('light-content', true);
    setShowFilterModal(true);
    filterModalSlide.setValue(1);
    filterModalOpacity.setValue(0);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(filterModalSlide, { toValue: 0, tension: 40, friction: 10, useNativeDriver: true }),
        Animated.timing(filterModalOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(modalScreenScale, { toValue: 0.96, tension: 40, friction: 10, useNativeDriver: true }),
        Animated.spring(modalScreenTranslateY, { toValue: 20, tension: 40, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const closeFilterModal = useCallback(() => {
    setModalActive(false);
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    Animated.parallel([
      Animated.spring(filterModalSlide, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
      Animated.timing(filterModalOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.spring(modalScreenScale, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
      Animated.spring(modalScreenTranslateY, { toValue: 0, tension: 40, friction: 10, useNativeDriver: true }),
    ]).start(() => setShowFilterModal(false));
  }, [isDarkMode]);

  const startPulse = (tab) => {
    const a = pulseAnimations[tab];
    Animated.sequence([
      Animated.timing(a, { toValue: 1.15, duration: 100, useNativeDriver: true }),
      Animated.timing(a, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    startPulse(tab);
  };

  // BACK HANDLER seguro (não fecha app na root)
  useEffect(() => {
    const onBackPress = () => {
      if (showNewsModal) { closeNewsModal(); return true; }
      if (showPortfolioModal) { closePortfolioModal(); return true; }
      if (showAssistantModal) { closeAssistantModal(); return true; }
      if (showCreateMenu) { setShowCreateMenu(false); return true; }
      if (isDrawerOpen) { toggleDrawer(); return true; }

      if (navigation && navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      // consumimos para não fechar app
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [showNewsModal, showPortfolioModal, showAssistantModal, showCreateMenu, isDrawerOpen, navigation]);

  const getTabTitle = () => {
    if (activeTab === 'inicio') return 'BoxCoin';
    if (activeTab === 'mercado') return getTranslation(language, 'mercado');
    if (activeTab === 'portfolio') return getTranslation(language, 'portfolio');
    if (activeTab === 'automacao') return getTranslation(language, 'automacao');
    return 'BoxCoin';
  };

  /* --------------------------- Render content --------------------------- */
  const renderContent = () => {
    return (
      <>
        {/* Tab Inicio */}
        <View style={{ display: activeTab === 'inicio' ? 'flex' : 'none', flex: 1 }}>
          {renderInicioTab()}
        </View>

        {/* Tab Mercado */}
        <View style={{ display: activeTab === 'mercado' ? 'flex' : 'none', flex: 1 }}>
          <MarketScreen isDarkMode={isDarkMode} navigation={navigation} />
        </View>

        {/* Tab Automação */}
        <View style={{ display: activeTab === 'automacao' ? 'flex' : 'none', flex: 1 }}>
          <View style={[globalStyles.content, { backgroundColor: colors.background }]}>
            <Text style={[globalStyles.appName, { color: colors.text }]}>Automação</Text>
          </View>
        </View>

        {/* Tab Carteira */}
        <View style={{ display: activeTab === 'carteira' ? 'flex' : 'none', flex: 1 }}>
          <View style={[globalStyles.content, { backgroundColor: colors.background }]}>
            <Text style={[globalStyles.appName, { color: colors.text }]}>Carteira</Text>
          </View>
        </View>
      </>
    );
  };

  const renderInicioTab = () => {
    return (
      <View style={{ flex: 1 }}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={APP_BLUE}
              colors={[APP_BLUE]}
              progressBackgroundColor={isDarkMode ? '#1A1B1E' : '#FFFFFF'}
            />
          }
        >
          {/* Blue header com gradiente */}
          <LinearGradient
            colors={[APP_BLUE, APP_BLUE, `${APP_BLUE}00`]}
            locations={[0, 0.7, 1]}
            style={[
              styles.blueHeader, 
              { 
                backgroundColor: 'transparent'
              }
            ]}
          >
            {balance === null ? (
              <SkeletonBalance isDarkMode={isDarkMode} />
            ) : (
              <View style={{ alignItems: 'center', width: '100%' }}>
                <View style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%'
                }}>
                  <View style={{
                    alignItems: 'center',
                  }}>
                    <Text style={styles.balanceLabelOnBlue}>Saldo disponível</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.balanceAmountOnBlue}>
                        {balanceVisible 
                          ? (balance !== null ? Number(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')
                          : '••••••'
                        }
                        <Text style={styles.balanceCurrencyOnBlue}> {currency}</Text>
                      </Text>
                      <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)} activeOpacity={0.7}>
                        <EyeIcon size={20} color="#FFFFFF" visible={balanceVisible} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    gap: 12,
                    marginTop: 18
                  }}>
                    <View style={{ width: (width - 56) / 2, height: 90 }}>
                      <TouchableOpacity 
                        style={[styles.actionCard, { width: '100%', height: '100%' }]} 
                        activeOpacity={0.86} 
                        onPress={() => { /* deposit handler */ }}
                      >
                        <View style={styles.actionCardInner}>
                          <DepositIcon size={22} color="#FFFFFF" />
                          <Text style={styles.actionCardLabel}>Adicionar</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    <View style={{ width: (width - 56) / 2, height: 90 }}>
                      <TouchableOpacity 
                        style={[styles.actionCard, { width: '100%', height: '100%' }]} 
                        activeOpacity={0.86} 
                        onPress={() => { /* withdraw handler */ }}
                      >
                        <View style={styles.actionCardInner}>
                          <WithdrawIcon size={22} color="#FFFFFF" />
                          <Text style={styles.actionCardLabel}>Retirar</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.threeCardsRow}>
                  <TouchableOpacity style={styles.smallActionCard} onPress={openAssistant} activeOpacity={0.86}>
                    <ProbabilityIcon size={18} color="#FFFFFF" />
                    <Text style={styles.smallActionLabel}>Sinais</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.smallActionCard} 
                    onPress={() => {
                      if (navigation && navigation.navigate) {
                        navigation.navigate('Calculadora');
                      }
                    }} 
                    activeOpacity={0.86}
                  >
                    <MaterialCommunityIcons name="calculator" size={18} color="#FFFFFF" />
                    <Text style={styles.smallActionLabel}>Calculadora</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.smallActionCard} 
                    onPress={() => {
                      if (navigation && navigation.navigate) {
                        navigation.navigate('Conversor');
                      }
                    }} 
                    activeOpacity={0.86}
                  >
                    <MaterialCommunityIcons name="swap-horizontal" size={18} color="#FFFFFF" />
                    <Text style={styles.smallActionLabel}>Conversor</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </LinearGradient>

          {/* White Zone - News Section */}
          <View style={{ 
            backgroundColor: isDarkMode ? '#0E0F10' : '#FFFFFF',
            paddingTop: 24,
            paddingBottom: 100
          }}>
            <NewsSection 
              isDarkMode={isDarkMode}
              news={news}
              onNewsPress={openNewsModal}
              selectedCategory={selectedCategory}
              onFilterPress={openFilterModal}
            />
          </View>

          </Animated.ScrollView>
        </View>
      );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <RNStatusBar 
        barStyle={
          modalActive ? 'light-content' : 
          (activeTab === 'inicio' && (scrollY as any)._value > 350) ? (isDarkMode ? 'light-content' : 'dark-content') :
          (isDarkMode ? 'light-content' : 'dark-content')
        } 
        backgroundColor="transparent" 
        translucent 
        animated 
      />

      {/* Filter Modal */}
      <View style={{ position: 'absolute', width: '100%', height: '100%', opacity: showFilterModal ? 1 : 0, zIndex: showFilterModal ? 1004 : -1, pointerEvents: showFilterModal ? 'auto' : 'none' }}>
        {showFilterModal && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={globalStyles.platformModalBackdrop} activeOpacity={1} onPress={closeFilterModal} />
            <Animated.View
              style={[
                globalStyles.platformModalContent,
                {
                  backgroundColor: colors.surface,
                  height: '50%',
                  maxHeight: 400,
                  opacity: filterModalOpacity,
                  transform: [
                    {
                      translateY: filterModalSlide.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 600],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={{ padding: 24, flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                  Filtrar Notícias
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>
                  Selecione uma categoria para filtrar
                </Text>
                
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCategory(null);
                    closeFilterModal();
                  }}
                  style={{
                    padding: 18,
                    borderRadius: 16,
                    backgroundColor: selectedCategory === null ? APP_BLUE : (isDarkMode ? '#2A2B2D' : '#F5F5F5'),
                    marginBottom: 14,
                    shadowColor: selectedCategory === null ? APP_BLUE : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: selectedCategory === null ? 0.3 : 0.05,
                    shadowRadius: 4,
                    elevation: selectedCategory === null ? 4 : 1,
                    borderWidth: selectedCategory === null ? 0 : 1,
                    borderColor: isDarkMode ? '#3A3B3D' : '#E5E5E5'
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: '600', 
                      color: selectedCategory === null ? '#FFFFFF' : colors.text 
                    }}>
                      🌐 Todas as Categorias
                    </Text>
                    {selectedCategory === null && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
                    )}
                  </View>
                </TouchableOpacity>
                
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  {categories.map((category) => {
                    const emoji = category === 'business' ? '💼' : 
                                  category === 'technology' ? '💻' :
                                  category === 'sports' ? '⚽' :
                                  category === 'entertainment' ? '🎬' :
                                  category === 'health' ? '🏥' :
                                  category === 'science' ? '🔬' :
                                  category === 'world' ? '🌍' :
                                  category === 'politics' ? '🏛️' :
                                  category === 'top' ? '⭐' : '📰';
                    
                    return (
                      <TouchableOpacity
                        key={category}
                        onPress={() => {
                          setSelectedCategory(category);
                          closeFilterModal();
                        }}
                        style={{
                          padding: 18,
                          borderRadius: 16,
                          backgroundColor: selectedCategory === category ? APP_BLUE : (isDarkMode ? '#2A2B2D' : '#F5F5F5'),
                          marginBottom: 14,
                          shadowColor: selectedCategory === category ? APP_BLUE : '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: selectedCategory === category ? 0.3 : 0.05,
                          shadowRadius: 4,
                          elevation: selectedCategory === category ? 4 : 1,
                          borderWidth: selectedCategory === category ? 0 : 1,
                          borderColor: isDarkMode ? '#3A3B3D' : '#E5E5E5'
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ 
                            fontSize: 16, 
                            fontWeight: '600', 
                            color: selectedCategory === category ? '#FFFFFF' : colors.text 
                          }}>
                            {emoji} {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Text>
                          {selectedCategory === category && (
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </Animated.View>
          </View>
        )}
      </View>

      {/* portfolio overlay */}
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
                </View>
                <Text style={[styles.portfolioSubtitle, { color: colors.textSecondary }]}>Seu portfólio personalizado em breve</Text>
              </View>
            </Animated.View>
          </View>
        )}
      </View>

      {isDrawerOpen && (
        <Animated.View style={[styles.fullScreenOverlay, { opacity: fadeAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }]} pointerEvents="box-none">
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={toggleDrawer} />
        </Animated.View>
      )}

      {/* Drawer */}
      <Animated.View
        style={[
          styles.fullDrawer,
          { backgroundColor: isDarkMode ? '#18191A' : '#FFFFFF' },
          { transform: [{ translateX: slideAnimation.interpolate({ inputRange: [0, 1], outputRange: [-400, 0] }) }], opacity: fadeAnimation },
        ]}
      >
        <View style={[styles.drawerHeader, { borderBottomColor: isDarkMode ? '#2F3336' : '#E5E7EB' }]}>
          <Text style={[styles.drawerTitle, { color: colors.text }]}>Menu</Text>
          <TouchableOpacity onPress={toggleDrawer} style={styles.closeButton}>
            <DoubleChevronRightIcon size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.drawerBody}>
          <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { toggleDrawer(); }} activeOpacity={0.7}>
            <View style={{ ...styles.drawerIconContainer, backgroundColor: isDarkMode ? '#2F3336' : '#F3F4F6' }}>
              <MaterialCommunityIcons name="account-circle" size={22} color={colors.text} />
            </View>
            <Text style={[styles.drawerMenuText, { color: colors.text }]}>{getTranslation(language, 'profile')}</Text>
          </TouchableOpacity>

          <View style={{ ...styles.drawerDivider, backgroundColor: isDarkMode ? '#2F3336' : '#E5E7EB' }} />

          <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { toggleDrawer(); navigation.navigate('Settings'); }} activeOpacity={0.7}>
            <View style={{ ...styles.drawerIconContainer, backgroundColor: isDarkMode ? '#2F3336' : '#F3F4F6' }}>
              <MaterialCommunityIcons name="cog" size={22} color={colors.text} />
            </View>
            <Text style={[styles.drawerMenuText, { color: colors.text }]}>{getTranslation(language, 'settings')}</Text>
          </TouchableOpacity>

          <View style={{ ...styles.drawerDivider, backgroundColor: isDarkMode ? '#2F3336' : '#E5E7EB' }} />

          <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { toggleDrawer(); }} activeOpacity={0.7}>
            <View style={{ ...styles.drawerIconContainer, backgroundColor: isDarkMode ? '#2F3336' : '#F3F4F6' }}>
              <MaterialCommunityIcons name="help-circle" size={22} color={colors.text} />
            </View>
            <Text style={[styles.drawerMenuText, { color: colors.text }]}>{getTranslation(language, 'help')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.drawerFooter}>
          <TouchableOpacity activeOpacity={1} onPress={() => { if (Platform.OS === 'android') BackHandler.exitApp(); }}>
            <Animated.View style={{ ...styles.logoutButton, borderRadius: logoutBorderRadius }}>
              <LogoutIcon size={22} color="#FFFFFF" />
              <Text style={styles.logoutText}>{getTranslation(language, 'logout')}</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main content */}
      <Animated.View
        style={[
          { flex: 1 },
          {
            backgroundColor: isDarkMode ? colors.background : '#FFFFFF',
            transform: [
              { scale: isDrawerOpen ? mainContentScale : (modalActive ? modalScreenScale : 1) },
              { translateY: isDrawerOpen ? mainContentTranslateY : (modalActive ? modalScreenTranslateY : 0) },
            ],
            borderTopLeftRadius: isDrawerOpen ? 16 : (modalActive ? 16 : 0),
            borderTopRightRadius: isDrawerOpen ? 16 : (modalActive ? 16 : 0),
            overflow: 'hidden',
          },
        ]}
      >
        {/* Appbar (muda de azul para branco/preto quando chega nas notícias) */}
        {activeTab !== 'automacao' && (
          <Animated.View style={[
            styles.appbarContainer, 
            { 
              backgroundColor: activeTab === 'inicio' ? scrollY.interpolate({
                inputRange: [300, 400],
                outputRange: [APP_BLUE, isDarkMode ? '#0E0F10' : '#FFFFFF'],
                extrapolate: 'clamp'
              }) : APP_BLUE
            }
          ]}>
            <View style={[globalStyles.appbar, { backgroundColor: 'transparent' }]}>
              {(activeTab === 'inicio' || activeTab === 'mercado') && (
                <TouchableOpacity onPress={toggleDrawer} style={globalStyles.iconButton}>
                  <View style={{ position: 'relative' }}>
                    <DrawerMenuIcon size={20} color="#FFFFFF" />
                    {activeTab === 'inicio' && (
                      <Animated.View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: scrollY.interpolate({
                          inputRange: [300, 400],
                          outputRange: [0, isDarkMode ? 0 : 1],
                          extrapolate: 'clamp'
                        })
                      }}>
                        <DrawerMenuIcon size={20} color="#000000" />
                      </Animated.View>
                    )}
                  </View>
                </TouchableOpacity>
              )}

              {/* Título "BoxCoin" desaparece quando header colapsa */}
              <Animated.Text 
                style={[
                  globalStyles.appbarTitle, 
                  activeTab === 'inicio' && globalStyles.appbarTitleBold, 
                  { 
                    color: activeTab === 'inicio' ? scrollY.interpolate({
                      inputRange: [300, 400],
                      outputRange: ['#FFFFFF', isDarkMode ? '#FFFFFF' : '#000000'],
                      extrapolate: 'clamp'
                    }) : '#FFFFFF',
                    opacity: activeTab === 'inicio' ? scrollY.interpolate({
                      inputRange: [0, 50],
                      outputRange: [1, 0],
                      extrapolate: 'clamp'
                    }) : 1
                  }
                ]}
              >
                {getTabTitle()}
              </Animated.Text>

              {/* Saldo aparece no AppBar quando header colapsa */}
              {activeTab === 'inicio' && balance !== null && (
                <Animated.View
                  style={{
                    position: 'absolute',
                    left: 60,
                    opacity: scrollY.interpolate({
                      inputRange: [0, 50, 100],
                      outputRange: [0, 0, 1],
                      extrapolate: 'clamp'
                    }),
                    transform: [{
                      translateY: scrollY.interpolate({
                        inputRange: [0, 50, 100],
                        outputRange: [10, 5, 0],
                        extrapolate: 'clamp'
                      })
                    }]
                  }}
                >
                  <Animated.Text style={{ 
                    color: scrollY.interpolate({
                      inputRange: [300, 400],
                      outputRange: ['#FFFFFF', isDarkMode ? '#FFFFFF' : '#000000'],
                      extrapolate: 'clamp'
                    }), 
                    fontSize: 16, 
                    fontWeight: '700' 
                  }}>
                    {balanceVisible 
                      ? `${Number(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
                      : `•••••• ${currency}`
                    }
                  </Animated.Text>
                </Animated.View>
              )}

              <View style={{ flex: 1 }} />

              {/* Botões circulares aparecem quando header colapsa */}
              {activeTab === 'inicio' && (
                <Animated.View
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    opacity: scrollY.interpolate({
                      inputRange: [0, 50, 100],
                      outputRange: [0, 0, 1],
                      extrapolate: 'clamp'
                    }),
                    transform: [{
                      scale: scrollY.interpolate({
                        inputRange: [0, 50, 100],
                        outputRange: [0.8, 0.9, 1],
                        extrapolate: 'clamp'
                      })
                    }]
                  }}
                >
                  <TouchableOpacity 
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ position: 'relative' }}>
                      <DepositIcon size={18} color="#FFFFFF" />
                      <Animated.View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: scrollY.interpolate({
                          inputRange: [300, 400],
                          outputRange: [0, isDarkMode ? 0 : 1],
                          extrapolate: 'clamp'
                        })
                      }}>
                        <DepositIcon size={18} color="#000000" />
                      </Animated.View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ position: 'relative' }}>
                      <WithdrawIcon size={18} color="#FFFFFF" />
                      <Animated.View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: scrollY.interpolate({
                          inputRange: [300, 400],
                          outputRange: [0, isDarkMode ? 0 : 1],
                          extrapolate: 'clamp'
                        })
                      }}>
                        <WithdrawIcon size={18} color="#000000" />
                      </Animated.View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                    activeOpacity={0.7}
                    onPress={openAssistant}
                  >
                    <View style={{ position: 'relative' }}>
                      <ProbabilityIcon size={18} color="#FFFFFF" />
                      <Animated.View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: scrollY.interpolate({
                          inputRange: [300, 400],
                          outputRange: [0, isDarkMode ? 0 : 1],
                          extrapolate: 'clamp'
                        })
                      }}>
                        <ProbabilityIcon size={18} color="#000000" />
                      </Animated.View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {activeTab !== 'automacao' && activeTab !== 'inicio' && (
                <TouchableOpacity style={globalStyles.iconButton} onPress={openCreateMenu}>
                  <View style={globalStyles.roundedIconContainer}>
                    <PlusIcon size={18} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* FAB de filtro - aparece embaixo crescendo de pontinho */}
        {activeTab === 'inicio' && (
          <Animated.View
            style={{
              position: 'absolute',
              right: 16,
              bottom: 90,
              zIndex: 1000,
              opacity: scrollY.interpolate({
                inputRange: [250, 350],
                outputRange: [0, 1],
                extrapolate: 'clamp'
              }),
              transform: [{
                scale: scrollY.interpolate({
                  inputRange: [250, 300, 350, 400],
                  outputRange: [0.2, 0.5, 0.9, 1],
                  extrapolate: 'clamp'
                })
              }]
            }}
          >
            <TouchableOpacity
              onPress={openFilterModal}
              activeOpacity={0.8}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: APP_BLUE,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8
              }}
            >
              <FilterIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {activeTab === 'automacao' && (
          <View style={[styles.appbarContainer, { backgroundColor: APP_BLUE }]}>
            <View style={[globalStyles.appbar, { backgroundColor: 'transparent' }]}>
              <Text style={[globalStyles.appbarTitle, { color: '#FFFFFF' }]}>Automação</Text>
            </View>
          </View>
        )}

        {renderContent()}

        {/* bottom tabs */}
        <LinearGradient
          colors={isDarkMode ? ['rgba(14,15,16,0)', 'rgba(14,15,16,0.92)', 'rgba(14,15,16,1)'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0.92)', 'rgba(255,255,255,1)']}
          style={styles.bottomBarGradient}
        >
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('inicio')} activeOpacity={0.7}>
              <Animated.View
                style={[
                  styles.tabCircle,
                  {
                    backgroundColor: tabPillAnimations.inicio.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['transparent', isDarkMode ? 'rgba(255,255,255,0.1)' : TAB_ACTIVE_BG],
                    }),
                    width: tabPillAnimations.inicio.interpolate({
                      inputRange: [0, 1],
                      outputRange: [44, 82],
                    }),
                    flexDirection: 'row',
                    paddingHorizontal: 12,
                  },
                ]}
              >
                {activeTab === 'inicio' ? <HomeFilledIcon size={20} color={isDarkMode ? '#FFFFFF' : APP_BLUE} /> : <HomeOutlineIcon size={20} color={colors.textSecondary} />}
                {activeTab === 'inicio' && (
                  <Animated.Text
                    style={{
                      color: isDarkMode ? '#FFFFFF' : APP_BLUE,
                      fontSize: 11,
                      fontWeight: '500',
                      marginLeft: 6,
                      opacity: tabPillAnimations.inicio,
                    }}
                  >
                    {getTranslation(language, 'inicio')}
                  </Animated.Text>
                )}
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('mercado')} activeOpacity={0.7}>
              <Animated.View
                style={[
                  styles.tabCircle,
                  {
                    backgroundColor: tabPillAnimations.mercado.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['transparent', isDarkMode ? 'rgba(255,255,255,0.1)' : TAB_ACTIVE_BG],
                    }),
                    width: tabPillAnimations.mercado.interpolate({
                      inputRange: [0, 1],
                      outputRange: [44, 92],
                    }),
                    flexDirection: 'row',
                    paddingHorizontal: 12,
                  },
                ]}
              >
                {activeTab === 'mercado' ? <MarketFilledIcon size={20} color={isDarkMode ? '#FFFFFF' : APP_BLUE} /> : <MarketOutlineIcon size={20} color={colors.textSecondary} />}
                {activeTab === 'mercado' && (
                  <Animated.Text
                    style={{
                      color: isDarkMode ? '#FFFFFF' : APP_BLUE,
                      fontSize: 11,
                      fontWeight: '500',
                      marginLeft: 6,
                      opacity: tabPillAnimations.mercado,
                    }}
                  >
                    {getTranslation(language, 'mercado')}
                  </Animated.Text>
                )}
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabButton} onPress={openPortfolio} activeOpacity={0.7}>
              <Animated.View
                style={[
                  styles.tabCircle,
                  {
                    backgroundColor: tabPillAnimations.portfolio.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['transparent', isDarkMode ? 'rgba(255,255,255,0.1)' : TAB_ACTIVE_BG],
                    }),
                    width: tabPillAnimations.portfolio.interpolate({
                      inputRange: [0, 1],
                      outputRange: [44, 92],
                    }),
                    flexDirection: 'row',
                    paddingHorizontal: 12,
                  },
                ]}
              >
                {activeTab === 'portfolio' ? <PortfolioFilledIcon size={20} color={isDarkMode ? '#FFFFFF' : APP_BLUE} /> : <PortfolioOutlineIcon size={20} color={colors.textSecondary} />}
                {activeTab === 'portfolio' && (
                  <Animated.Text
                    style={{
                      color: isDarkMode ? '#FFFFFF' : APP_BLUE,
                      fontSize: 11,
                      fontWeight: '500',
                      marginLeft: 6,
                      opacity: tabPillAnimations.portfolio,
                    }}
                  >
                    {getTranslation(language, 'portfolio')}
                  </Animated.Text>
                )}
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('automacao')} activeOpacity={0.7}>
              <Animated.View
                style={[
                  styles.tabCircle,
                  {
                    backgroundColor: tabPillAnimations.automacao.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['transparent', isDarkMode ? 'rgba(255,255,255,0.1)' : TAB_ACTIVE_BG],
                    }),
                    width: tabPillAnimations.automacao.interpolate({
                      inputRange: [0, 1],
                      outputRange: [44, 102],
                    }),
                    flexDirection: 'row',
                    paddingHorizontal: 12,
                  },
                ]}
              >
                {activeTab === 'automacao' ? <AutomationFilledIcon size={20} color={isDarkMode ? '#FFFFFF' : APP_BLUE} /> : <AutomationOutlineIcon size={20} color={colors.textSecondary} />}
                {activeTab === 'automacao' && (
                  <Animated.Text
                    style={{
                      color: isDarkMode ? '#FFFFFF' : APP_BLUE,
                      fontSize: 11,
                      fontWeight: '500',
                      marginLeft: 6,
                      opacity: tabPillAnimations.automacao,
                    }}
                  >
                    {getTranslation(language, 'automacao')}
                  </Animated.Text>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Create menu modal */}
      <Modal visible={showCreateMenu} transparent animationType="none" onRequestClose={() => setShowCreateMenu(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCreateMenu(false)}>
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
            <TouchableOpacity style={globalStyles.menuItem} onPress={() => setShowCreateMenu(false)} activeOpacity={0.6}>
              <NewPostIcon size={22} color={colors.text} />
              <Text style={[globalStyles.menuItemText, { color: colors.text }]}>{getTranslation(language, 'newPost')}</Text>
            </TouchableOpacity>
            <View style={[globalStyles.menuDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={globalStyles.menuItem} onPress={() => setShowCreateMenu(false)} activeOpacity={0.6}>
              <NewChannelIcon size={22} color={colors.text} />
              <Text style={[globalStyles.menuItemText, { color: colors.text }]}>{getTranslation(language, 'createChannel')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Assistant modal */}
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
                <Text style={[styles.portfolioSubtitle, { color: colors.textSecondary }]}>Seu probabilizador inteligente em breve</Text>
              </View>
            </Animated.View>
          </View>
        )}
      </View>

      {/* News modal */}
      <View style={{ position: 'absolute', width: '100%', height: '100%', opacity: showNewsModal ? 1 : 0, zIndex: showNewsModal ? 1003 : -1 }}>

        {showNewsModal && selectedNews && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={globalStyles.platformModalBackdrop} activeOpacity={1} onPress={closeNewsModal} />
            <Animated.View
              style={[
                globalStyles.platformModalContent,
                {
                  backgroundColor: colors.surface,
                  opacity: newsModalOpacity,
                  transform: [
                    {
                      translateY: newsModalSlide.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 600],
                      }),
                    },
                  ],
                },
              ]}
              {...(newsPanResponder.current?.panHandlers || {})}
            >
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {selectedNews.image_url && (
                  <Image 
                    source={{ uri: selectedNews.image_url }} 
                    style={{ width: '100%', height: 250 }}
                    resizeMode="cover"
                  />
                )}
                <View style={{ padding: 24 }}>
                  {selectedNews.category && selectedNews.category[0] && (
                    <Text style={[styles.categoryText, { color: colors.textSecondary, marginBottom: 8 }]}>
                      {selectedNews.category[0].toUpperCase()}
                    </Text>
                  )}
                  <Text style={[styles.newsTitle, { fontSize: 24, marginBottom: 12, color: colors.text }]}>
                    {selectedNews.title}
                  </Text>
                  {selectedNews.pubDate && (
                    <Text style={[styles.newsTime, { color: colors.textSecondary, marginBottom: 16 }]}>
                      {new Date(selectedNews.pubDate).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  )}
                  {selectedNews.source_name && selectedNews.source_icon && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <Image 
                        source={{ uri: selectedNews.source_icon }} 
                        style={{ width: 20, height: 20, borderRadius: 4 }}
                        resizeMode="cover"
                      />
                      <Text style={[styles.newsSource, { fontSize: 14, color: colors.text }]}>
                        {selectedNews.source_name}
                      </Text>
                    </View>
                  )}
                  {selectedNews.description && (
                    <Text style={[styles.newsSummary, { fontSize: 16, lineHeight: 26, marginBottom: 20, color: colors.text }]}>
                      {selectedNews.description}
                    </Text>
                  )}
                  {selectedNews.content && (
                    <Text style={[{ fontSize: 16, lineHeight: 26, color: colors.text }]}>
                      {selectedNews.content}
                    </Text>
                  )}
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
}

/* ------------------------------ Styles ------------------------------ */
const styles = StyleSheet.create({
  fullScreenOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000', zIndex: 999 },
  fullDrawer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 1000, paddingTop: 20 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12, paddingTop: 32, borderBottomWidth: 0.5 },
  drawerTitle: { fontSize: 22, fontWeight: '700' },
  closeButton: { padding: 8, marginRight: -4 },
  drawerBody: { flex: 1, paddingTop: 8 },
  drawerMenuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  drawerIconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  drawerMenuText: { fontSize: 16, fontWeight: '500' },
  drawerDivider: { height: 0.5, marginHorizontal: 24, marginVertical: 4 },
  drawerFooter: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 16 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E74C3C', paddingVertical: 16, paddingHorizontal: 24, gap: 12 },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  blueHeader: { paddingTop: 28, paddingBottom: 12, paddingHorizontal: 16, alignItems: 'center' },
  balanceLabelOnBlue: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.95)', marginBottom: 6 },
  balanceAmountOnBlue: { fontSize: 36, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  balanceCurrencyOnBlue: { fontSize: 20, fontWeight: '600', color: 'rgba(255,255,255,0.95)' },

  twoCardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, gap: 12 },
  actionCard: { width: (width - 56) / 2, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  actionCardInner: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionCardLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 6 },


  threeCardsRow: { flexDirection: 'row', gap: 12, marginTop: 16, justifyContent: 'space-between', paddingHorizontal: 8 },
  smallActionCard: { width: (width - 64) / 3, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  smallActionLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginTop: 8 },
  
  circularButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  bottomBarGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 50, backgroundColor: 'transparent' },
  bottomBar: { flexDirection: 'row', height: 58, paddingBottom: 4, paddingTop: 4, backgroundColor: 'transparent' },

  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tabCircleActive: { backgroundColor: TAB_ACTIVE_BG },
  label: { fontSize: 11, fontWeight: '500', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'flex-end' },
  portfolioContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  portfolioHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  portfolioTitle: { fontSize: 28, fontWeight: '700' },
  portfolioSubtitle: { fontSize: 16, textAlign: 'center' },
  appbarContainer: { paddingBottom: 0, zIndex: 10 },
  
  newsSection: { paddingHorizontal: 16, marginBottom: 16 },
  newsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  newsSectionTitle: { fontSize: 22, fontWeight: '700' },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  newsContainer: { gap: 16 },
  newsCard: { 
    borderRadius: 16, 
    overflow: 'hidden',
    marginBottom: 4,
  },
  newsImage: { width: '100%', height: 220, backgroundColor: '#E5E7EB' },
  newsCardContent: { padding: 16 },
  newsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  newsTime: { fontSize: 12, fontWeight: '500' },
  newsTitle: { fontSize: 18, fontWeight: '700', lineHeight: 24, marginBottom: 8 },
  newsSummary: { fontSize: 14, lineHeight: 20 },
  newsSource: { fontSize: 12, fontWeight: '500' },
  
});