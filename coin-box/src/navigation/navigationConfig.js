// navigation/navigationConfig.js
import { Platform } from 'react-native';

// Configuração otimizada para navegação fluida
export const screenOptions = {
  headerShown: false,
  animation: 'default', // Usa animação nativa do iOS (mais fluida)
  presentation: 'card',
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  animationTypeForReplace: 'push',
  
  // Performance
  freezeOnBlur: true, // Congela tela quando não está em foco
  lazy: false, // Carrega telas imediatamente para transições mais suaves
  
  // Configurações de transição
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
  },
  
  // Gesto de voltar personalizado (iOS style)
  gestureResponseDistance: 50,
  cardOverlayEnabled: true,
  
  // Sombra durante transição
  cardShadowEnabled: true,
  cardStyle: {
    backgroundColor: 'transparent',
  },
};
