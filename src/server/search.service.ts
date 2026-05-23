// Lógica de búsqueda de símbolos financieros

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*, application/json',
  'Origin': 'https://finance.yahoo.com',
  'Referer': 'https://finance.yahoo.com/',
};

const KNOWN_CRYPTOS = [
  { symbol: 'BTC-EUR',  shortname: 'Bitcoin EUR',       quoteType: 'CRYPTOCURRENCY', exchange: 'CCC' },
  { symbol: 'ETH-EUR',  shortname: 'Ethereum EUR',      quoteType: 'CRYPTOCURRENCY', exchange: 'CCC' },
  { symbol: 'SOL-EUR',  shortname: 'Solana EUR',        quoteType: 'CRYPTOCURRENCY', exchange: 'CCC' },
  { symbol: 'KAS-EUR',  shortname: 'Kaspa EUR',         quoteType: 'CRYPTOCURRENCY', exchange: 'CCC' },
  { symbol: 'NEAR-EUR', shortname: 'NEAR Protocol EUR', quoteType: 'CRYPTOCURRENCY', exchange: 'CCC' },
  { symbol: 'KAS-USD',  shortname: 'Kaspa USD',         quoteType: 'CRYPTOCURRENCY', exchange: 'CCC' },
  { symbol: 'NEAR-USD', shortname: 'NEAR Protocol USD', quoteType: 'CRYPTOCURRENCY', exchange: 'CCC' },
];

function getBaseResults(q: string): any[] {
  const upper = q.toUpperCase();
  // Coincidencia exacta primero
  const exact = KNOWN_CRYPTOS.find(c => upper === c.symbol);
  if (exact) return [exact];
  // Coincidencia parcial
  const partial: any[] = [];
  if (upper.includes('BTC') || upper.includes('BITCOIN')) partial.push(KNOWN_CRYPTOS[0]);
  if (upper.includes('ETH') || upper.includes('ETHEREUM')) partial.push(KNOWN_CRYPTOS[1]);
  if (upper.includes('SOL') || upper.includes('SOLANA'))   partial.push(KNOWN_CRYPTOS[2]);
  if (upper.includes('KAS') || upper.includes('KASPA'))    partial.push(KNOWN_CRYPTOS[3], KNOWN_CRYPTOS[5]);
  if (upper.includes('NEAR'))                              partial.push(KNOWN_CRYPTOS[4], KNOWN_CRYPTOS[6]);
  return partial;
}

function mergeUnique(base: any[], extra: any[]): any[] {
  const result = [...base];
  for (const item of extra) {
    if (!result.some(r => r.symbol === item.symbol)) result.push(item);
  }
  return result;
}

export async function resolveIsin(isin: string, yf: any): Promise<string | null> {
  try {
    const search = await yf.search(isin);
    if (search.quotes?.length > 0) return search.quotes[0].symbol;
  } catch {
    try {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(isin)}&quotesCount=1&newsCount=0`;
      const res = await fetch(url, { headers: YAHOO_HEADERS });
      if (res.ok) {
        const data = await res.json();
        if (data?.quotes?.[0]?.symbol) return data.quotes[0].symbol;
      }
    } catch {}
  }
  return null;
}

export async function searchSymbols(q: string, yf: any): Promise<any[]> {
  const baseResults = getBaseResults(q);

  try {
    const result: any = await yf.search(q, { quotesCount: 25, newsCount: 0 });
    const filtered = (result.quotes || []).filter((item: any) => item.symbol);
    return mergeUnique(baseResults, filtered);
  } catch {}

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
    const res = await fetch(url, { headers: YAHOO_HEADERS });
    if (res.ok) {
      const data = await res.json();
      const quotes = (data.quotes || []).filter((item: any) => item.symbol);
      if (quotes.length > 0) return mergeUnique(baseResults, quotes);
    }
  } catch {}

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.coins?.length > 0) {
        const cgResults = data.coins.slice(0, 10).map((coin: any) => ({
          symbol: `${coin.symbol.toUpperCase()}-USD`,
          shortname: coin.name,
          quoteType: 'CRYPTOCURRENCY',
          exchange: 'CoinGecko',
        }));
        return mergeUnique(baseResults, cgResults);
      }
    }
  } catch {}

  if (baseResults.length > 0) return baseResults;
  return [{ symbol: q.toUpperCase(), shortname: `Entrada manual (búsqueda fallida)`, quoteType: 'UNKNOWN', exchange: 'Manual' }];
}
