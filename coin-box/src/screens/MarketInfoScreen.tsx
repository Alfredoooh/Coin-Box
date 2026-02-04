// screens/MarketInfoScreen.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar as RNStatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MarketData {
  symbol: string;
  display_name: string;
  price: number;
  previous_price: number;
  change: number;
  change_percentage: number;
  logo: string;
  category: string;
  abbreviation: string;
}

interface MarketInfoScreenProps {
  route: any;
  navigation: any;
}

export default function MarketInfoScreen({ route, navigation }: MarketInfoScreenProps) {
  const { market, isDarkMode, accentColor } = route.params as { 
    market: MarketData; 
    isDarkMode: boolean;
    accentColor: string;
  };

  const colors = {
    background: isDarkMode ? '#0E0F10' : '#FFFFFF',
    surface: isDarkMode ? '#1C1D1F' : '#F5F5F5',
    text: isDarkMode ? '#E4E6EB' : '#050505',
    textSecondary: isDarkMode ? '#B0B3B8' : '#65676B',
    border: isDarkMode ? '#3E4042' : '#E5E7EB',
    positive: '#00C853',
    negative: '#FF5252',
    cardBg: isDarkMode ? '#1C1D1F' : '#FFFFFF',
  };

  const getCategoryName = () => {
    switch (market.category) {
      case 'synthetic': return 'Sintéticos';
      case 'boomcrash': return 'Boom & Crash';
      case 'crypto': return 'Criptomoedas';
      default: return market.category;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RNStatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={accentColor} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Informações
        </Text>

        <View style={styles.headerRight} />
      </View>

      {/* Body */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Market Header */}
        <View style={[styles.marketHeader, { backgroundColor: colors.cardBg }]}>
          {market.logo === 'candlestick' ? (
            <Image 
              source={require('../assets/candlestick.png')} 
              style={styles.marketLogo} 
              resizeMode="contain" 
            />
          ) : (
            <Image 
              source={{ uri: market.logo }} 
              style={styles.marketLogo} 
              resizeMode="contain" 
            />
          )}
          <View style={styles.marketHeaderText}>
            <Text style={[styles.marketName, { color: colors.text }]}>
              {market.display_name}
            </Text>
            <Text style={[styles.marketSymbol, { color: colors.textSecondary }]}>
              {market.symbol}
            </Text>
          </View>
          <View style={[styles.abbreviationBadge, { backgroundColor: accentColor + '20' }]}>
            <Text style={[styles.abbreviationText, { color: accentColor }]}>
              {market.abbreviation}
            </Text>
          </View>
        </View>

        {/* Price Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PREÇO
          </Text>
          
          <View style={[styles.infoCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Preço Atual
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {market.price.toFixed(market.symbol.includes('BTC') ? 2 : 4)}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Preço Anterior
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {market.previous_price > 0 
                ? market.previous_price.toFixed(market.symbol.includes('BTC') ? 2 : 4)
                : '---'}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Variação
            </Text>
            <Text style={[
              styles.infoValue, 
              { color: market.change > 0 ? colors.positive : colors.negative }
            ]}>
              {market.change > 0 ? '+' : ''}{market.change_percentage.toFixed(2)}%
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Mudança
            </Text>
            <Text style={[
              styles.infoValue, 
              { color: market.change > 0 ? colors.positive : market.change < 0 ? colors.negative : colors.text }
            ]}>
              {market.change > 0 ? '+' : ''}{market.change.toFixed(market.symbol.includes('BTC') ? 2 : 4)}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            DETALHES
          </Text>

          <View style={[styles.infoCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Categoria
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {getCategoryName()}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Símbolo
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {market.symbol}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Abreviação
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {market.abbreviation}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  marketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  marketLogo: {
    width: 48,
    height: 48,
  },
  marketHeaderText: {
    flex: 1,
  },
  marketName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  marketSymbol: {
    fontSize: 14,
  },
  abbreviationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  abbreviationText: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
