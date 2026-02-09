/*App.tsx
import React, { useState, useEffect } from 'react';
import { StatusBar as RNStatusBar, StyleSheet, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MarketScreen from './src/screens/MarketScreen';
import MarketDetailScreen from './src/screens/MarketDetailScreen';
import MarketInfoScreen from './src/screens/MarketInfoScreen';
import { COLORS } from './src/styles/theme';
import { screenOptions } from './src/navigation/navigationConfig';
import { BalanceProvider } from './src/contexts/BalanceContext';

enableScreens();

const Stack = createNativeStackNavigator();

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('pt');

  const colors = isDarkMode ? COLORS.dark : COLORS.light;

  useEffect(() => {
    if (Platform.OS === 'android') {
      const setNavigationBarColor = async () => {
        try {
          const { setBackgroundColorAsync, setButtonStyleAsync } = require('expo-navigation-bar');
          await setBackgroundColorAsync(isDarkMode ? '#0E0F10' : '#FFFFFF');
          await setButtonStyleAsync(isDarkMode ? 'light' : 'dark');
        } catch (e) {
          console.log('Navigation bar API not available');
        }
      };
      setNavigationBarColor();
    }
  }, [isDarkMode]);

  return (
    <SafeAreaProvider>
      <BalanceProvider>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <RNStatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor="transparent"
            translucent={true}
            animated={true}
          />

          <NavigationContainer>
            <Stack.Navigator screenOptions={screenOptions}>
              <Stack.Screen name="Home">
                {(props) => (
                  <HomeScreen
                    {...props}
                    isDarkMode={isDarkMode}
                    language={language}
                  />
                )}
              </Stack.Screen>
              
              <Stack.Screen name="Settings">
                {(props) => (
                  <SettingsScreen
                    {...props}
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    language={language}
                    setLanguage={setLanguage}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="Market">
                {(props) => (
                  <MarketScreen
                    {...props}
                    isDarkMode={isDarkMode}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen 
                name="MarketDetail"
                component={MarketDetailScreen}
              />

              <Stack.Screen 
                name="MarketInfo"
                component={MarketInfoScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </BalanceProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
*/
import React, { useRef } from 'react';
import { StatusBar, StyleSheet, useColorScheme, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

const App = () => {
  const webViewRef = useRef(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleBackPress = () => {
    if (webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  };

  React.useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <WebView
          ref={webViewRef}
          source={{ uri: 'https://testing-ddy8.onrender.com/' }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={false}
          scrollEnabled={true}
          allowsBackForwardNavigationGestures={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          setSupportMultipleWindows={false}
          cacheEnabled={true}
          originWhitelist={['*']}
          mixedContentMode="always"
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default App;
