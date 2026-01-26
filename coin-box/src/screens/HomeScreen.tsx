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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';

import { COLORS, getDynamicColors } from '../styles/theme';
import { globalStyles, DRAWER_WIDTH } from '../styles/globalStyles';
import { getTranslation } from '../utils/translations';
import {
  HomeOutlineIcon,
  HomeFilledIcon,
  TvOutlineIcon,
  TvFilledIcon,
  GlobeIcon,
  DrawerMenuIcon,
  PlusIcon,
  NewPostIcon,
  NewChannelIcon,
  LogoutIcon,
  DoubleChevronRightIcon,
} from '../components/Icons';

export default function HomeScreen({ navigation, isDarkMode, language }) {
  const [activeTab, setActiveTab] = useState('inicio');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#1877F2');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [cachedFavicon, setCachedFavicon] = useState('');
  const [modalActive, setModalActive] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const platformModalSlide = useRef(new Animated.Value(1)).current;
  const platformModalOpacity = useRef(new Animated.Value(0)).current;
  const platformPanResponder = useRef<any>(null);
  const logoutBorderRadius = useRef(new Animated.Value(100)).current;
  const mainContentScale = useRef(new Animated.Value(1)).current;
  const mainContentTranslateY = useRef(new Animated.Value(0)).current;
  const modalScreenScale = useRef(new Animated.Value(1)).current;
  const modalScreenTranslateY = useRef(new Animated.Value(0)).current;

  // Animações de pulse para cada tab
  const pulseAnimations = useRef({
    inicio: new Animated.Value(1),
    canais: new Animated.Value(1),
    plataforma: new Animated.Value(1),
    tv: new Animated.Value(1),
  }).current;

  const colors = isDarkMode ? COLORS.dark : COLORS.light;
  const appColors = getDynamicColors(isDarkMode, primaryColor);

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
  }, [navigation]);

  const closePlatformModal = useCallback(() => {
    setModalActive(false);
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    Animated.parallel([
      Animated.timing(platformModalSlide, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(platformModalOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalScreenScale, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalScreenTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowPlatformModal(false);
    });
  }, [isDarkMode]);

  const closeCreateMenu = useCallback(() => {
    setModalActive(false);
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    Animated.parallel([
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalScreenScale, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalScreenTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCreateMenu(false);
    });
  }, [isDarkMode]);

  useEffect(() => {
    const backAction = () => {
      if (showPlatformModal) {
        closePlatformModal();
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
  }, [isDrawerOpen, showPlatformModal, showCreateMenu]);

  useEffect(() => {
    platformPanResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          const progress = Math.min(gestureState.dy / 400, 1);
          platformModalSlide.setValue(progress);
          platformModalOpacity.setValue(1 - progress * 0.5);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 0.6) {
          closePlatformModal();
        } else {
          Animated.parallel([
            Animated.spring(platformModalSlide, {
              toValue: 0,
              tension: 50,
              friction: 9,
              useNativeDriver: true,
            }),
            Animated.timing(platformModalOpacity, {
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
    modalScreenScale.setValue(1);
    modalScreenTranslateY.setValue(0);

    Animated.parallel([
      Animated.spring(menuAnimation, {
        toValue: 1,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(modalScreenScale, {
        toValue: 0.92,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(modalScreenTranslateY, {
        toValue: 20,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const openPlatformModal = () => {
    setModalActive(true);
    RNStatusBar.setBarStyle('light-content', true);
    setShowPlatformModal(true);
    platformModalSlide.setValue(1);
    platformModalOpacity.setValue(0);
    modalScreenScale.setValue(1);
    modalScreenTranslateY.setValue(0);

    Animated.parallel([
      Animated.spring(platformModalSlide, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(platformModalOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalScreenScale, {
        toValue: 0.92,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(modalScreenTranslateY, {
        toValue: 20,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'themeColor' && data.color) {
        setPrimaryColor(data.color);
      }
      if (data.type === 'favicon' && data.url) {
        let url = data.url;
        if (url && url.startsWith('//')) url = 'https:' + url;
        setFaviconUrl(url);
      }
    } catch (e) {}
  };

  const injectedJavaScript = `
    (function() {
      try {
        const send = (obj) => window.ReactNativeWebView.postMessage(JSON.stringify(obj));
        setTimeout(() => {
          const metaThemeColor = document.querySelector('meta[name="theme-color"]');
          let color = '#1877F2';
          if (metaThemeColor) {
            color = metaThemeColor.getAttribute('content') || color;
          } else {
            const bodyBg = getComputedStyle(document.body).backgroundColor;
            if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)') {
              color = bodyBg;
            }
          }
          send({ type: 'themeColor', color: color });

          const favicon = document.querySelector('link[rel~="icon"]') ||
                         document.querySelector('link[rel~="shortcut icon"]') ||
                         document.querySelector('link[rel~="apple-touch-icon"]');
          if (favicon && favicon.href) {
            send({ type: 'favicon', url: favicon.href });
          }
        }, 800);
      } catch (e) {}
    })();
    true;
  `;

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
    if (activeTab === 'canais') return getTranslation(language, 'canais');
    if (activeTab === 'plataforma') return getTranslation(language, 'plataforma');
    if (activeTab === 'tv') return getTranslation(language, 'tv');
    return 'Boxtube';
  };

  const getActiveIconColor = () => {
    return isDarkMode ? '#FFFFFF' : primaryColor;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <RNStatusBar
        barStyle={modalActive ? 'light-content' : (isDarkMode ? 'light-content' : 'dark-content')}
        backgroundColor={modalActive ? '#000' : 'transparent'}
        translucent={true}
        animated={true}
      />

      {isDrawerOpen && (
        <Animated.View style={[styles.fullScreenOverlay, { opacity: overlayOpacity }]} pointerEvents="box-none">
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={toggleDrawer} />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.fullDrawer,
          { backgroundColor: colors.surface },
          { transform: [{ translateX: drawerTranslateX }], opacity: fadeAnimation },
        ]}
      >
        <View style={styles.drawerHeader}>
          <Text style={[styles.drawerTitle, { color: colors.text }]}>Menu</Text>
          <TouchableOpacity onPress={toggleDrawer} style={styles.closeButton}>
            <DoubleChevronRightIcon size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.drawerBody}>
          <TouchableOpacity style={styles.drawerMenuItem}>
            <View style={styles.drawerIconContainer}>
              <MaterialCommunityIcons name="account-circle" size={22} color={colors.text} />
            </View>
            <Text style={[styles.drawerMenuText, { color: colors.text }]}>
              {getTranslation(language, 'profile')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerMenuItem} onPress={navigateToSettings}>
            <View style={styles.drawerIconContainer}>
              <MaterialCommunityIcons name="cog" size={22} color={colors.text} />
            </View>
            <Text style={[styles.drawerMenuText, { color: colors.text }]}>
              {getTranslation(language, 'settings')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerMenuItem}>
            <View style={styles.drawerIconContainer}>
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
            backgroundColor: colors.background,
            transform: [
              { scale: isDrawerOpen ? mainContentScale : (modalActive ? modalScreenScale : mainContentScale) },
              { translateY: isDrawerOpen ? mainContentTranslateY : (modalActive ? modalScreenTranslateY : mainContentTranslateY) },
            ],
            borderTopLeftRadius: isDrawerOpen ? slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 16],
            }) : (modalActive ? modalScreenScale.interpolate({
              inputRange: [0.92, 1],
              outputRange: [16, 0],
            }) : 0),
            borderTopRightRadius: isDrawerOpen ? slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 16],
            }) : (modalActive ? modalScreenScale.interpolate({
              inputRange: [0.92, 1],
              outputRange: [16, 0],
            }) : 0),
            overflow: 'hidden',
          },
        ]}
      >
        <View style={[globalStyles.appbar, { backgroundColor: 'transparent' }]}>
          {activeTab === 'inicio' && (
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

          <TouchableOpacity style={globalStyles.iconButton} onPress={openCreateMenu}>
            <View style={globalStyles.roundedIconContainer}>
              <PlusIcon size={18} color={colors.text} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[globalStyles.content, { backgroundColor: colors.background }]}>
          <Text style={[globalStyles.appName, { color: colors.text }]}>Boxtube</Text>
        </View>

        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: isDarkMode ? '#1F2023' : '#FFFFFF',
              borderTopWidth: 0,
            },
          ]}
        >
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

          <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('canais')} activeOpacity={0.7}>
            <Animated.View
              style={[
                styles.iconWrapper,
                {
                  transform: [{ scale: pulseAnimations.canais }],
                },
              ]}
            >
              <MaterialCommunityIcons
                name="youtube-subscription"
                size={22}
                color={activeTab === 'canais' ? getActiveIconColor() : colors.textSecondary}
              />
            </Animated.View>
            <Text style={[styles.label, { color: activeTab === 'canais' ? getActiveIconColor() : colors.textSecondary }]}>
              {getTranslation(language, 'canais')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} onPress={openPlatformModal} activeOpacity={0.7}>
            <Animated.View
              style={[
                styles.iconWrapper,
                {
                  transform: [{ scale: pulseAnimations.plataforma }],
                },
              ]}
            >
              {faviconUrl ? (
                <Image
                  source={{ uri: faviconUrl }}
                  style={{ width: 22, height: 22, borderRadius: 4 }}
                  resizeMode="contain"
                  onError={() => {
                    setFaviconUrl('');
                    setCachedFavicon('');
                  }}
                />
              ) : (
                <GlobeIcon size={22} color={activeTab === 'plataforma' ? getActiveIconColor() : colors.textSecondary} />
              )}
            </Animated.View>
            <Text
              style={[styles.label, { color: activeTab === 'plataforma' ? getActiveIconColor() : colors.textSecondary }]}
            >
              {getTranslation(language, 'plataforma')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('tv')} activeOpacity={0.7}>
            <Animated.View
              style={[
                styles.iconWrapper,
                {
                  transform: [{ scale: pulseAnimations.tv }],
                },
              ]}
            >
              {activeTab === 'tv' ? (
                <TvFilledIcon size={22} color={getActiveIconColor()} />
              ) : (
                <TvOutlineIcon size={22} color={colors.textSecondary} />
              )}
            </Animated.View>
            <Text style={[styles.label, { color: activeTab === 'tv' ? getActiveIconColor() : colors.textSecondary }]}>
              {getTranslation(language, 'tv')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Modal visible={showCreateMenu} transparent animationType="none" onRequestClose={closeCreateMenu}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeCreateMenu}>
          <Animated.View
            style={[
              globalStyles.createMenu,
              { backgroundColor: colors.surface },
              {
                transform: [
                  {
                    translateY: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
                opacity: menuAnimation,
              },
            ]}
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

      <Modal
        visible={showPlatformModal}
        transparent={true}
        animationType="none"
        onRequestClose={closePlatformModal}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={globalStyles.platformModalBackdrop} activeOpacity={1} onPress={closePlatformModal} />
          <Animated.View
            style={[
              globalStyles.platformModalContent,
              {
                backgroundColor: colors.surface,
                opacity: platformModalOpacity,
                transform: [
                  {
                    translateY: platformModalSlide.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 600],
                    }),
                  },
                ],
              },
            ]}
            {...(platformPanResponder.current?.panHandlers || {})}
          >
            <WebView
              ref={webViewRef}
              source={{ uri: 'https://elephantbetzone.com/' }}
              style={[globalStyles.webView, { backgroundColor: isDarkMode ? '#18191A' : '#FFFFFF' }]}
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={['*']}
              mixedContentMode="always"
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              cacheEnabled={true}
              incognito={false}
              injectedJavaScript={injectedJavaScript}
              onMessage={handleWebViewMessage}
              androidLayerType="hardware"
            />
          </Animated.View>
        </View>
      </Modal>
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
    paddingVertical: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
    paddingTop: 16,
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
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  drawerMenuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  drawerFooter: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  bottomBar: {
    flexDirection: 'row',
    height: 58,
    paddingBottom: 4,
    paddingTop: 4,
    elevation: 0,
    shadowOpacity: 0,
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
});
