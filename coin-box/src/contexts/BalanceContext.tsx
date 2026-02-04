// contexts/BalanceContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import derivService from '../services/derivService';

interface BalanceContextType {
  balance: number | null;
  currency: string;
  loadingBalance: boolean;
  accountLoginId: string;
}

const BalanceContext = createContext<BalanceContextType>({
  balance: null,
  currency: 'USD',
  loadingBalance: true,
  accountLoginId: '',
});

export const useBalance = () => useContext(BalanceContext);

interface BalanceProviderProps {
  children: ReactNode;
}

export const BalanceProvider: React.FC<BalanceProviderProps> = ({ children }) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [accountLoginId, setAccountLoginId] = useState('');

  useEffect(() => {
    // Subscrever para autorização
    const unsubscribeAuth = derivService.subscribe('authorize', (data) => {
      console.log('✅ Conta autorizada:', data.loginid);
      setAccountLoginId(data.loginid);
    });

    // Subscrever para saldo em tempo real
    const unsubscribeBalance = derivService.subscribe('balance', (data) => {
      console.log('💰 Saldo atualizado:', data.balance, data.currency);
      setBalance(data.balance);
      setCurrency(data.currency);
      setLoadingBalance(false);
    });

    // Subscrever para erros
    const unsubscribeAuthError = derivService.subscribe('authorize_error', (error) => {
      console.error('❌ Erro na autorização:', error);
      setLoadingBalance(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBalance();
      unsubscribeAuthError();
    };
  }, []);

  return (
    <BalanceContext.Provider value={{ balance, currency, loadingBalance, accountLoginId }}>
      {children}
    </BalanceContext.Provider>
  );
};
