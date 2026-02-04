// App.tsx
import React, { useState, useEffect } from 'react';
import { StatusBar as RNStatusBar, StyleSheet, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import MarketScreen from './screens/MarketScreen';
import MarketDetailScreen from './screens/MarketDetailScreen';
import MarketInfoScreen from './screens/MarketInfoScreen';
import { COLORS } from './styles/theme';
import { screenOptions } from './navigation/navigationConfig';
import { BalanceProvider } from './contexts/BalanceContext';

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
