export interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'fund' | 'cash';
  ownerId: string;
  createdAt: any;
}

export interface Transaction {
  id: string;
  investmentId: string;
  pricePerUnit: number;
  quantity: number;
  commission: number;
  date: any;
  ownerId: string;
}

export interface InvestmentSummary extends Investment {
  totalQuantity: number;
  totalInvested: number; // excluding commissions or including? usually invested = qty * price + comm
  totalCommission: number;
  avgPrice: number;
  currentPrice: number;
  currentValue: number;
  netProfit: number;
  profitPercent: number;
}
