'use client';

import { useState, useEffect } from 'react';
import { Index, Indicator, IndexDetail, IndicatorDetail, DailyDataPoint } from '@/lib/types';
import WebSocketStatus from '@/components/WebSocketStatus';

type Tab = 'indices' | 'indicators';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('indices');
  const [indices, setIndices] = useState<Index[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedItem, setSelectedItem] = useState<IndexDetail | IndicatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<any>(null);

  useEffect(() => {
    fetchData();
    fetchRateLimitInfo();
    const interval = setInterval(fetchRateLimitInfo, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'indices') {
      fetchIndices();
    } else {
      fetchIndicators();
    }
  }, [activeTab]);

  const fetchData = async () => {
    await Promise.all([fetchIndices(), fetchIndicators()]);
  };

  const fetchIndices = async () => {
    try {
      setLoading(true);
      console.log('[Frontend] Fetching indices from /api/indices');
      const response = await fetch('/api/indices');
      if (!response.ok) throw new Error('Failed to fetch indices');
      const result = await response.json();
      console.log('[Frontend] Received indices:', result.source || 'unknown source', result.data?.length || 0, 'items');
      setIndices(result.data);
      setError(null);
    } catch (err: any) {
      console.error('[Frontend] Error fetching indices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      console.log('[Frontend] Fetching indicators from /api/indicators');
      const response = await fetch('/api/indicators');
      if (!response.ok) throw new Error('Failed to fetch indicators');
      const result = await response.json();
      console.log('[Frontend] Received indicators:', result.source || 'unknown source', result.data?.length || 0, 'items');
      setIndicators(result.data);
      setError(null);
    } catch (err: any) {
      console.error('[Frontend] Error fetching indicators:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRateLimitInfo = async () => {
    try {
      const response = await fetch('/api/rate-limit');
      if (response.ok) {
        const data = await response.json();
        setRateLimitInfo(data);
      }
    } catch (err) {
      // Silently fail for rate limit info
    }
  };

  const handleItemClick = async (id: string) => {
    try {
      const endpoint = activeTab === 'indices' ? '/api/indices' : '/api/indicators';
      const response = await fetch(`${endpoint}?id=${id}&details=true`);
      if (!response.ok) throw new Error('Failed to fetch details');
      const result = await response.json();
      setSelectedItem(result.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatValue = (value: number, type?: string): string => {
    if (type === 'market-cap') {
      if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
      if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const renderChart = (data: DailyDataPoint[]) => {
    const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    return (
      <div className="chart-container">
        <div className="chart-title">30-Day Trend</div>
        <div className="chart">
          {data.map((point, index) => {
            const height = ((point.value - minValue) / range) * 100;
            const isPositive = point.changePercent >= 0;
            return (
              <div
                key={index}
                className={`chart-bar ${isPositive ? 'positive' : 'negative'}`}
                style={{ height: `${Math.max(height, 5)}%` }}
                title={`${point.date}: ${formatValue(point.value)} (${point.changePercent > 0 ? '+' : ''}${point.changePercent.toFixed(2)}%)`}
              />
            );
          })}
        </div>
        <div className="chart-labels">
          <span>{data[0]?.date}</span>
          <span>{data[Math.floor(data.length / 2)]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <h1>TokenMetrics Market App</h1>
        <p>Indices & Indicators with 30-Day Detail View</p>
      </div>

      {rateLimitInfo && (
        <div className="rate-limit-info">
          Rate Limit: <strong>{rateLimitInfo.requestsLastMinute}/{rateLimitInfo.maxPerMinute}</strong> requests/min | 
          Monthly: <strong>{rateLimitInfo.monthlyCalls}/{rateLimitInfo.maxMonthly}</strong> calls
          {rateLimitInfo.note && <span style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#999' }}>({rateLimitInfo.note})</span>}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'indices' ? 'active' : ''}`}
          onClick={() => setActiveTab('indices')}
        >
          Indices
        </button>
        <button
          className={`tab ${activeTab === 'indicators' ? 'active' : ''}`}
          onClick={() => setActiveTab('indicators')}
        >
          Indicators
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="grid">
          {activeTab === 'indices' &&
            indices.map((index) => (
              <div key={index.id} className="card" onClick={() => handleItemClick(index.id)}>
                <div className="card-header">
                  <div className="card-title">{index.name}</div>
                  <div className="card-symbol">{index.symbol}</div>
                </div>
                <div className="card-value">
                  {index.symbol === 'TOTAL' 
                    ? formatValue(index.value, 'market-cap')
                    : formatValue(index.value)}
                </div>
                <div className={`card-change ${index.changePercent24h >= 0 ? 'positive' : 'negative'}`}>
                  <span>{index.changePercent24h >= 0 ? '↑' : '↓'}</span>
                  <span>
                    {index.changePercent24h >= 0 ? '+' : ''}
                    {index.changePercent24h.toFixed(2)}%
                  </span>
                  <span>({index.change24h >= 0 ? '+' : ''}{formatValue(index.change24h)})</span>
                </div>
              </div>
            ))}

          {activeTab === 'indicators' &&
            indicators.map((indicator) => (
              <div key={indicator.id} className="card" onClick={() => handleItemClick(indicator.id)}>
                <div className="card-header">
                  <div className="card-title">{indicator.name}</div>
                  <span className={`signal-badge ${indicator.signal}`}>{indicator.signal}</span>
                </div>
                <div className="card-value">{formatValue(indicator.value)}</div>
                <div className="card-change neutral">
                  <span>Category: {indicator.category}</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {selectedItem.name}
                {'symbol' in selectedItem && selectedItem.symbol && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '1rem', color: '#666' }}>
                    ({selectedItem.symbol})
                  </span>
                )}
              </div>
              <button className="close-button" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {formatValue(selectedItem.value, 'symbol' in selectedItem && selectedItem.symbol === 'TOTAL' ? 'market-cap' : undefined)}
              </div>
              {'signal' in selectedItem && (
                <span className={`signal-badge ${selectedItem.signal}`}>
                  {selectedItem.signal}
                </span>
              )}
              {'changePercent24h' in selectedItem && (
                <div className={`card-change ${selectedItem.changePercent24h >= 0 ? 'positive' : 'negative'}`} style={{ marginTop: '0.5rem' }}>
                  <span>{selectedItem.changePercent24h >= 0 ? '↑' : '↓'}</span>
                  <span>
                    {selectedItem.changePercent24h >= 0 ? '+' : ''}
                    {selectedItem.changePercent24h.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            {selectedItem.dailyData && selectedItem.dailyData.length > 0 && (
              <>
                {renderChart(selectedItem.dailyData)}

                <div style={{ marginTop: '2rem' }}>
                  <div className="chart-title">30-Day Data Table</div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Value</th>
                        <th>Change</th>
                        <th>Change %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem.dailyData.map((point, index) => (
                        <tr key={index}>
                          <td>{new Date(point.date).toLocaleDateString()}</td>
                          <td>{formatValue(point.value)}</td>
                          <td className={point.change >= 0 ? 'positive' : 'negative'}>
                            {point.change >= 0 ? '+' : ''}{formatValue(point.change)}
                          </td>
                          <td className={point.changePercent >= 0 ? 'positive' : 'negative'}>
                            {point.changePercent >= 0 ? '+' : ''}{point.changePercent.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <WebSocketStatus />
    </div>
  );
}

