// src/screens/ConversorScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, StatusBar as RNStatusBar, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BackArrowIcon } from '../components/Icons';
import { useBalance } from '../contexts/BalanceContext';
import { getDynamicColors } from '../styles/theme';

type Props = { navigation: any; isDarkMode?: boolean; language?: string };

const PAIRS = [
  { label: 'USD → EUR', value: 'USD_EUR', rate: 0.92 },
  { label: 'EUR → USD', value: 'EUR_USD', rate: 1.09 },
  { label: 'USD → AOA', value: 'USD_AOA', rate: 825.0 },
  { label: 'AOA → USD', value: 'AOA_USD', rate: 0.00121 },
  { label: 'EUR → AOA', value: 'EUR_AOA', rate: 900 },
];

export default function ConversorScreen({ navigation, isDarkMode = false }: Props) {
  const [amount, setAmount] = useState<string>('1');
  const [pair, setPair] = useState(PAIRS[0]);
  const [result, setResult] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const { balance, currency } = useBalance();

  const colors = useMemo(() => ({
    ...getDynamicColors(!!isDarkMode),
    background: isDarkMode ? '#18191A' : '#FFFFFF',
    surface: isDarkMode ? '#242526' : '#F5F5F5',
    text: isDarkMode ? '#E4E6EB' : '#050505',
    textSecondary: isDarkMode ? '#B0B3B8' : '#65676B',
  }), [isDarkMode]);

  const convert = () => {
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num)) { setResult(null); return; }
    setResult(num * pair.rate);
  };

  const safeAreaStyle = {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <RNStatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={safeAreaStyle} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackArrowIcon size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Conversor</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Conversoes rapidas</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Saldo</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 2 }}>
                {balance !== null ? `${balance.toFixed(2)} ${currency}` : '...'}
              </Text>
            </View>
            <TouchableOpacity style={{ padding: 8 }}>
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
            style={[localStyles.input, { backgroundColor: isDarkMode ? '#121214' : '#F5F5F5', color: colors.text }]}
            placeholder="0"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          />

          <Text style={[localStyles.label, { marginTop: 12, color: colors.textSecondary }]}>Par</Text>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={[localStyles.pickerButton, { backgroundColor: isDarkMode ? '#121214' : '#F5F5F5' }]}
          >
            <Text style={{ color: colors.text, fontSize: 15 }}>{pair.label}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[localStyles.convertButton, { backgroundColor: colors.primary }]}
            onPress={convert}
          >
            <Text style={[localStyles.convertText, { color: '#fff' }]}>Converter</Text>
          </TouchableOpacity>

          <View style={[localStyles.resultBox, { backgroundColor: isDarkMode ? '#0F1112' : '#F3F4F6' }]}>
            <Text style={[localStyles.resultLabel, { color: colors.textSecondary }]}>Resultado</Text>
            <Text style={[localStyles.resultValue, { color: colors.text }]}>
              {result === null ? '---' : result.toLocaleString(undefined, { maximumFractionDigits: 6 })}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity style={localStyles.modalOverlay} activeOpacity={1} onPress={() => setShowPicker(false)} />
        <View style={[localStyles.modalSheet, { backgroundColor: colors.surface }]}>
          <Text style={[localStyles.modalTitle, { color: colors.text }]}>Selecionar par</Text>
          {PAIRS.map(p => (
            <TouchableOpacity
              key={p.value}
              style={[localStyles.pairOption, pair.value === p.value && { backgroundColor: isDarkMode ? '#2A2B2D' : '#E8F4FF' }]}
              onPress={() => { setPair(p); setShowPicker(false); }}
            >
              <Text style={{ color: colors.text, fontSize: 16 }}>{p.label}</Text>
              {pair.value === p.value && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
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
  input: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  pickerButton: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  convertButton: { marginTop: 16, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  convertText: { fontWeight: '700' },
  resultBox: { marginTop: 20, padding: 14, borderRadius: 10 },
  resultLabel: { fontSize: 13 },
  resultValue: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalSheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 16, paddingBottom: 32, paddingTop: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  pairOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4,
  },
});
