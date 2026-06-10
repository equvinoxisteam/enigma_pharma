import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI } from '../api/analyticsAPI';
import SimpleBarChart from '../components/SimpleBarChart';
import { FileText, TrendingUp, CheckCircle, Clock, DollarSign, Star, Package } from 'lucide-react';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const isBuyer = user?.userType === 'BUYER';
  const [kpis, setKpis] = useState({
    requestsReceived: 0,
    rfqsAccepted: 0,
    winRate: 0,
    revenueWon: 0,
    avgLeadTime: 0,
    avgRating: 0,
    activeRFQs: 0,
    inProduction: 0
  });
  const [byTechnology, setByTechnology] = useState([]);
  const [byRegion, setByRegion] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await analyticsAPI.get(dateRange);
      const data = response.data || {};
      setKpis(data.kpis || {});
      setByTechnology(data.byTechnology || []);
      setByRegion(data.byRegion || []);
      setTimeline(data.timeline || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">
            {isBuyer ? 'Track your RFQ publishing and sourcing performance' : 'Track your manufacturing pipeline performance'}
          </p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4" />
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isBuyer ? (
            <>
              <KpiCard icon={FileText} label="Active RFQs" value={kpis.activeRFQs ?? 0} />
              <KpiCard icon={Clock} label="Awaiting Supplier" value={kpis.requestsReceived ?? 0} />
              <KpiCard icon={Package} label="In Production" value={kpis.inProduction ?? 0} />
            </>
          ) : null}
          <KpiCard icon={FileText} label={isBuyer ? 'RFQs Published' : 'RFQ Requests Sent'} value={kpis.requestsReceived ?? 0} />
          <KpiCard icon={CheckCircle} label={isBuyer ? 'RFQs Completed' : 'RFQs Won'} value={kpis.rfqsAccepted ?? 0} />
          <KpiCard icon={TrendingUp} label="Success Rate" value={`${kpis.winRate ?? 0}%`} />
          {!isBuyer && (
            <>
              <KpiCard icon={Clock} label="Avg Lead Time (days)" value={kpis.avgLeadTime || 'N/A'} />
              <KpiCard icon={Star} label="Avg Buyer Rating" value={kpis.avgRating || 'N/A'} />
            </>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">RFQs by Technology</h3>
          <SimpleBarChart data={byTechnology} color="#4881F8" emptyText="No RFQ technology data in this period" />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">RFQs by Region</h3>
          <SimpleBarChart data={byRegion} color="#01364a" emptyText="No regional data in this period" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
        {timeline.length > 0 ? (
          <div className="space-y-4">
            <div className="flex gap-6 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#4881F8]" /> Total</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500" /> Won / Closed</span>
            </div>
            <SimpleBarChart
              data={timeline.map((t) => ({ label: t.label, value: t.requests }))}
              color="#4881F8"
              emptyText="No timeline data"
            />
            <SimpleBarChart
              data={timeline.map((t) => ({ label: t.label, value: t.won }))}
              color="#10b981"
              emptyText="No wins yet"
            />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            No activity in this period yet — start by {isBuyer ? 'creating an RFQ' : 'requesting from the RFQ pool'}.
          </div>
        )}
      </div>
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <Icon className="text-[#4881F8]" size={32} />
    </div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

export default AnalyticsPage;
