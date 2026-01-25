// App.tsx
import React, { useState } from 'react';
import { StatusBar as RNStatusBar, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { COLORS } from './src/styles/theme';
import { screenOptions } from './src/navigation/navigationConfig';

// Habilita otimizações nativas de tela
enableScreens();

const Stack = createNativeStackNavigator();

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('pt');

  const colors = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <RNStatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.statusbar}
        animated={true}
      />
      
      <NavigationContainer>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen 
            name="Home"
            options={{
              animationTypeForReplace: 'pop',
            }}
          >
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});