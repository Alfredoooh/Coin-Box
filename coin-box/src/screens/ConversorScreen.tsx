// src/screens/ConversorScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BackArrowIcon } from '../components/Icons';
import { useBalance } from '../contexts/BalanceContext';
import { getDynamicColors } from '../styles/theme';

type Props = { navigation: any; isDarkMode?: boolean; language?: string };

export default function ConversorScreen({ navigation, isDarkMode = false }: Props) {
  const [amount, setAmount] = useState<string>('1');
  const [pair, setPair] = useState<string>('USD_EUR');
  const [result, setResult] = useState<number | null>(null);

  const { balance, currency } = useBalance();

  const colors = useMemo(() => {
    return {
      ...getDynamicColors(!!isDarkMode),
      background: isDarkMode ? '#18191A' : '#FFFFFF',
      surface: isDarkMode ? '#242526' : '#F5F5F5',
      text: isDarkMode ? '#E4E6EB' : '#050505',
      textSecondary: isDarkMode ? '#B0B3B8' : '#65676B',
    };
  }, [isDarkMode]);

  const RATES: Record<string, number> = {
    'USD_EUR': 0.92,
    'EUR_USD': 1.09,
    'USD_AOA': 825.0,
    'AOA_USD': 0.00121,
    'EUR_AOA': 900,
  };

  const convert = () => {
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num)) {
      setResult(null);
      return;
    }
    const rate = RATES[pair] ?? 1;
    setResult(num * rate);
  };

  // garante que o conteúdo fica abaixo da StatusBar em Android quando é translucent
  const safeAreaStyle = {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <RNStatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={safeAreaStyle} edges={['top']}>
        {/* Header idêntico ao MarketDetail */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackArrowIcon size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Conversor</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Conversões rápidas</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Saldo</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 2 }}>
                {balance !== null ? `${balance.toFixed(2)} ${currency}` : '...'}
              </Text>
            </View>
            <TouchableOpacity style={{ padding: 8 }} onPress={() => { /* menu placeholder */ }}>
              <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={[localStyles.label, { color: colors.textSecondary }]}>Valor</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
            style={[localStyles.input, { backgroundColor: isDarkMode ? '#121214' : '#FFFFFF', color: colors.text }]}
            placeholder="0"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          />

          <Text style={[localStyles.label, { marginTop: 12, color: colors.textSecondary }]}>Par</Text>
          <View style={[localStyles.pickerWrap, { backgroundColor: isDarkMode ? '#121214' : '#FFFFFF' }]}>
            <Picker
              selectedValue={pair}
              onValueChange={(v) => setPair(String(v))}
              style={{ color: colors.text }}
            >
              <Picker.Item label="USD → EUR" value="USD_EUR" />
              <Picker.Item label="EUR → USD" value="EUR_USD" />
              <Picker.Item label="USD → AOA" value="USD_AOA" />
              <Picker.Item label="AOA → USD" value="AOA_USD" />
              <Picker.Item label="EUR → AOA" value="EUR_AOA" />
            </Picker>
          </View>

          <TouchableOpacity
            style={[localStyles.convertButton, { backgroundColor: colors.primary }]}
            onPress={convert}
          >
            <Text style={[localStyles.convertText, { color: colors.onPrimary || '#fff' }]}>Converter</Text>
          </TouchableOpacity>

          <View style={[localStyles.resultBox, { backgroundColor: isDarkMode ? '#0F1112' : '#F3F4F6' }]}>
            <Text style={[localStyles.resultLabel, { color: colors.textSecondary }]}>Resultado</Text>
            <Text style={[localStyles.resultValue, { color: colors.text }]}>
              {result === null ? '—' : result.toLocaleString(undefined, { maximumFractionDigits: 6 })}
            </Text>
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
});

const localStyles = StyleSheet.create({
  label: { marginBottom: 6, fontSize: 13 },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  pickerWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  convertButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convertText: { fontWeight: '700' },
  resultBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
  },
  resultLabel: { fontSize: 13 },
  resultValue: { fontSize: 20, fontWeight: '700', marginTop: 8 },
});