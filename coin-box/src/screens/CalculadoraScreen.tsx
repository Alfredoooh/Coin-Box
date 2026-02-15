// src/screens/CalculadoraScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackArrowIcon } from '../components/Icons';
import { useBalance } from '../contexts/BalanceContext';
import { getDynamicColors } from '../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = { navigation: any; isDarkMode?: boolean; language?: string };

export default function CalculadoraScreen({ navigation, isDarkMode = false }: Props) {
  const [display, setDisplay] = useState<string>('0');
  const [operator, setOperator] = useState<string | null>(null);
  const [firstValue, setFirstValue] = useState<number | null>(null);
  const [waitingForSecond, setWaitingForSecond] = useState(false);

  const { balance, currency } = useBalance();
  const palette = useMemo(() => {
    return {
      ...getDynamicColors(!!isDarkMode),
      background: isDarkMode ? '#0B0B0B' : '#FFFFFF',
      text: isDarkMode ? '#E4E6EB' : '#050505',
      textSecondary: isDarkMode ? '#9CA3AF' : '#6B7280',
      primary: getDynamicColors(!!isDarkMode).primary,
    };
  }, [isDarkMode]);

  const safeAreaStyle = {
    flex: 1,
    backgroundColor: palette.background,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0,
  };

  const inputDigit = (digit: string) => {
    setDisplay(prev => {
      if (waitingForSecond) {
        setWaitingForSecond(false);
        return digit;
      }
      if (prev === '0') return digit;
      return prev + digit;
    });
  };

  const inputDot = () => {
    setDisplay(prev => (prev.includes('.') ? prev : prev + '.'));
  };

  const clearAll = () => {
    setDisplay('0');
    setOperator(null);
    setFirstValue(null);
    setWaitingForSecond(false);
  };

  const toggleSign = () => {
    setDisplay(prev => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  };

  const percent = () => {
    setDisplay(prev => String(parseFloat(prev || '0') / 100));
  };

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);
    if (firstValue === null) {
      setFirstValue(inputValue);
    } else if (operator) {
      const result = calculate(firstValue, inputValue, operator);
      setDisplay(String(result));
      setFirstValue(result);
    }
    setWaitingForSecond(true);
    setOperator(nextOperator);
  };

  const calculate = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? 0 : a / b;
      default: return b;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);
    if (operator && firstValue !== null) {
      const result = calculate(firstValue, inputValue, operator);
      setDisplay(String(result));
      setFirstValue(null);
      setOperator(null);
      setWaitingForSecond(false);
    }
  };

  const renderButton = (label: string, onPress: any, style?: any) => (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={[styles.buttonText, { color: palette.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <RNStatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={safeAreaStyle} edges={['top']}>
        <View style={[styles.header, { backgroundColor: palette.background }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackArrowIcon size={20} color={palette.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: palette.text }]}>Calculadora</Text>
              <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>Rápida e offline</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: palette.textSecondary }}>Saldo</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: palette.text, marginTop: 2 }}>
                {balance !== null ? `${balance.toFixed(2)} ${currency}` : '...'}
              </Text>
            </View>
            <TouchableOpacity style={{ padding: 8 }}>
              <MaterialCommunityIcons name="dots-vertical" size={22} color={palette.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 12 }}>
          <View style={styles.displayContainer}>
            <Text style={[styles.displayText, { color: palette.text }]} numberOfLines={1} adjustsFontSizeToFit>{display}</Text>
          </View>

          <View style={styles.pad}>
            <View style={styles.row}>
              {renderButton('C', clearAll, { backgroundColor: isDarkMode ? '#2A2B2D' : '#E6E7E9' })}
              {renderButton('+/-', toggleSign, { backgroundColor: isDarkMode ? '#2A2B2D' : '#E6E7E9' })}
              {renderButton('%', percent, { backgroundColor: isDarkMode ? '#2A2B2D' : '#E6E7E9' })}
              {renderButton('÷', () => handleOperator('÷'), { backgroundColor: palette.primary })}
            </View>
            <View style={styles.row}>
              {renderButton('7', () => inputDigit('7'))}
              {renderButton('8', () => inputDigit('8'))}
              {renderButton('9', () => inputDigit('9'))}
              {renderButton('×', () => handleOperator('×'), { backgroundColor: palette.primary })}
            </View>
            <View style={styles.row}>
              {renderButton('4', () => inputDigit('4'))}
              {renderButton('5', () => inputDigit('5'))}
              {renderButton('6', () => inputDigit('6'))}
              {renderButton('-', () => handleOperator('-'), { backgroundColor: palette.primary })}
            </View>
            <View style={styles.row}>
              {renderButton('1', () => inputDigit('1'))}
              {renderButton('2', () => inputDigit('2'))}
              {renderButton('3', () => inputDigit('3'))}
              {renderButton('+', () => handleOperator('+'), { backgroundColor: palette.primary })}
            </View>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.button, styles.zero, { backgroundColor: isDarkMode ? '#2A2B2D' : '#E6E7E9' }]}
                onPress={() => inputDigit('0')}
              >
                <Text style={[styles.buttonText, { color: palette.text }]}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: isDarkMode ? '#2A2B2D' : '#E6E7E9' }]} onPress={inputDot}>
                <Text style={[styles.buttonText, { color: palette.text }]}>.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: palette.primary }]} onPress={handleEquals}>
                <Text style={[styles.buttonText, { color: '#fff' }]}>=</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, height: 56 },
  backButton: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 },
  headerTextContainer: { flex: 1, maxWidth: 180 },
  headerTitle: { fontSize: 14, fontWeight: '700' },
  headerSubtitle: { fontSize: 11, marginTop: 1 },

  displayContainer: {
    paddingHorizontal: 20, paddingVertical: 24, alignItems: 'flex-end'
  },
  displayText: {
    fontSize: 48, fontWeight: '700'
  },
  pad: {
    padding: 12,
    paddingBottom: 40,
    justifyContent: 'flex-end',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zero: {
    width: 160,
    alignItems: 'flex-start',
    paddingLeft: 28,
    borderRadius: 36,
  },
  buttonText: { fontSize: 28, fontWeight: '600' },
});