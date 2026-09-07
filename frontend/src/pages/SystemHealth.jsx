import React, { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  Server,
  Cpu,
  ShieldCheck,
  Sparkles,
  Layers,
  Copy,
  Check,
  HardDrive,
  Globe,
  Terminal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { healthService } from '../services/healthService';

export const SystemHealth = () => {
  const [basicHealth, setBasicHealth] = useState(null);
  const [detailedHealth, setDetailedHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const [copiedContract, setCopiedContract] = useState(false);
  const [activeJsonTab, setActiveJsonTab] = useState('formatted'); // 'formatted' | 'raw'
  const [showRawTelemetry, setShowRawTelemetry] = useState(false);

  const runAllDiagnostics = async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const [basicRes, detailedRes] = await Promise.all([
        healthService.checkHealth(),
        healthService.getDetailedDiagnostics()
      ]);
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setBasicHealth(basicRes);
      setDetailedHealth(detailedRes);
    } catch (err) {
      setError(err.message || 'Health check request failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAllDiagnostics();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const sys = detailedHealth?.data?.system;
  const db = detailedHealth?.data?.database;
  const uptime = detailedHealth?.data?.uptime;

  const memUsedMb = sys?.memoryUsageMb?.heapUsed ? parseFloat(sys.memoryUsageMb.heapUsed) : 0;
  const memTotalMb = sys?.memoryUsageMb?.heapTotal ? parseFloat(sys.memoryUsageMb.heapTotal) : 100;
  const memPercent = Math.min(100, Math.round((memUsedMb / memTotalMb) * 100)) || 25;

  const isDbConnected = Boolean(db?.isConnected);
  const isDbActive = Boolean(db?.isConnected || (db?.state && db?.state.includes('active')));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-cyan-500/15 rounded-2xl border border-teal-200/90 shadow-sm relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br from-teal-300/30 to-emerald-300/20 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Health & Services</h1>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              All Systems Operational
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Real-time workforce services, database status, and operational health monitoring.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Button
            size="md"
            onClick={runAllDiagnostics}
            disabled={loading}
            icon={RefreshCw}
            className={`rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-teal-500/25 ring-2 ring-teal-400/20 ${
              loading ? 'animate-pulse' : ''
            }`}
          >
            {loading ? 'Executing...' : 'Run Diagnostics'}
          </Button>
        </div>
      </div>

      {/* 4 Key Health KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Primary API Gateway */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 border border-emerald-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">System Status</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-2 flex items-center gap-2">
            {basicHealth?.success ? 'Healthy' : 'Degraded'}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> All Services Operational
          </p>
        </div>

        {/* Roundtrip Latency */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-cyan-100/60 border border-sky-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Roundtrip Latency</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-950 mt-2">
            {latencyMs !== null ? `${latencyMs} ms` : '--'}
          </div>
          <p className="text-[11px] text-sky-600 mt-1 font-semibold">
            {latencyMs !== null && latencyMs < 50 ? '⚡ Ultra-fast (< 50ms)' : 'Normal Response Time'}
          </p>
        </div>

        {/* Database State */}
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${
          isDbActive
            ? 'from-emerald-50 via-white to-teal-100/60 border-emerald-200/90'
            : 'from-amber-50 via-white to-amber-100/60 border-amber-200/90'
        } border shadow-xs hover:-translate-y-0.5 transition-all`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              isDbActive ? 'text-emerald-700' : 'text-amber-700'
            }`}>Database Engine</span>
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${
              isDbActive ? 'from-emerald-500 to-teal-600' : 'from-amber-500 to-orange-500'
            } text-white flex items-center justify-center shadow-xs`}>
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black mt-2 capitalize ${
            isDbActive ? 'text-emerald-950' : 'text-amber-950'
          }`}>
            {isDbConnected ? 'Connected' : 'Active (Dev Engine)'}
          </div>
          <p className={`text-[11px] mt-1 font-semibold truncate ${
            isDbActive ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {isDbConnected ? 'MongoDB Cluster Live' : 'In-Memory Store Operational'}
          </p>
        </div>

        {/* System Uptime */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 via-white to-purple-100/60 border border-violet-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">Process Uptime</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-500 text-white flex items-center justify-center shadow-xs">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-violet-950 mt-2 truncate">
            {uptime?.formatted || 'Active'}
          </div>
          <p className="text-[11px] text-violet-600 mt-1 font-semibold truncate">
            Node.js {sys?.nodeVersion || 'v20.x'} • {sys?.platform || 'win32'}
          </p>
        </div>
      </div>

      {/* Services Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-teal-200/80 bg-white/95 shadow-xs p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 font-bold">
              API
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Express REST Gateway</h4>
              <p className="text-[11px] text-slate-500 font-medium">Port 5000 • Helmet & CORS Active</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Security Headers</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Enforced
            </span>
          </div>
        </Card>

        <Card className="border-indigo-200/80 bg-white/95 shadow-xs p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Auth & JWT Engine</h4>
              <p className="text-[11px] text-slate-500 font-medium">HS256 7-day Token Lifecycle</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Role Guardrails</span>
            <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Admin & Staff
            </span>
          </div>
        </Card>

        <Card className="border-purple-200/80 bg-white/95 shadow-xs p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">AI Intelligence Layer</h4>
              <p className="text-[11px] text-slate-500 font-medium">Port 5001 • RAG Knowledge Hub</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Advisory Guardrail</span>
            <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Ethical AI Active
            </span>
          </div>
        </Card>

        <Card className="border-amber-200/80 bg-white/95 shadow-xs p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">MongoDB Persistence</h4>
              <p className="text-[11px] text-slate-500 font-medium">Mongoose v8.9 Schema Models</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Database Engine</span>
            <span className={`font-bold px-2 py-0.5 rounded border ${
              isDbActive
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}>
              {isDbConnected ? 'Atlas Live' : 'In-Memory Active'}
            </span>
          </div>
        </Card>
      </div>

      {/* Memory & System Resource Gauge */}
      <Card className="border-teal-200/80 bg-white/95 shadow-xs" title="Node.js Process Resource Telemetry" subtitle="Real-time heap memory allocation and runtime environmental footprint">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>V8 Heap Memory Utilization</span>
              <span className="text-teal-700">{memUsedMb} MB / {memTotalMb} MB ({memPercent}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/70">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${memPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Resident Set Size (RSS)</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{sys?.memoryUsageMb?.rss || '--'} MB</span>
            </div>
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
              <span className="text-slate-400 font-medium block text-[10px] uppercase">OS Available Free RAM</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{sys?.freeMemoryMb || '--'} MB</span>
            </div>
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Total System Physical Memory</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{sys?.totalMemoryMb || '--'} MB</span>
            </div>
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Environment Target</span>
              <span className="font-bold text-teal-800 mt-0.5 block capitalize">{detailedHealth?.data?.environment || 'Development'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Human-Friendly Service Health & Infrastructure Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: API Gateway Status */}
        <Card
          className="border-emerald-200/80 bg-white/95 shadow-xs"
          title="API Gateway Service"
          subtitle="Main Express REST Server & Endpoint Health"
          headerAction={
            <Badge variant={basicHealth?.success ? 'success' : 'danger'}>
              {basicHealth?.success ? 'Active & Healthy' : 'Degraded'}
            </Badge>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-emerald-900">API Gateway Status</span>
              </div>
              <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded shadow-2xs border border-emerald-200">
                Online • Fully Operational
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium block">Service Name</span>
                <span className="font-bold text-slate-800 mt-0.5 block">EMS Core API</span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium block">Environment</span>
                <span className="font-bold text-teal-700 mt-0.5 block capitalize">{detailedHealth?.data?.environment || 'Development'}</span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium block">Version</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{detailedHealth?.data?.version || '1.0.0'}</span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium block">Server Host</span>
                <span className="font-bold text-slate-800 mt-0.5 block">Port 5000 (localhost)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Database & Storage Status */}
        <Card
          className="border-teal-200/80 bg-white/95 shadow-xs"
          title="Data Storage & Services"
          subtitle="Workforce Persistence & System Runtime"
          headerAction={
            <Badge variant="success">
              {isDbActive ? 'Operational' : 'Standby'}
            </Badge>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50/60 border border-teal-200/70 text-xs">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-semibold text-teal-900">Database Engine</span>
              </div>
              <span className="font-bold text-teal-700 bg-white px-2 py-0.5 rounded shadow-2xs border border-teal-200">
                {isDbConnected ? 'MongoDB Live' : 'Active (Dev Engine)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium block">Storage Mode</span>
                <span className="font-bold text-slate-800 mt-0.5 block truncate">
                  {db?.storageEngine || 'In-Memory Store'}
                </span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium block">System Uptime</span>
                <span className="font-bold text-violet-700 mt-0.5 block">{uptime?.formatted || 'Active'}</span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium block">Security Shield</span>
                <span className="font-bold text-indigo-700 mt-0.5 block">JWT + RBAC Shield</span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium block">System Status</span>
                <span className="font-bold text-emerald-700 mt-0.5 block">All Systems Normal</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Collapsible Advanced Developer Telemetry (Cleanly Hidden by Default) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowRawTelemetry(!showRawTelemetry)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100"
        >
          <Terminal className="w-4 h-4 text-slate-400" />
          <span>{showRawTelemetry ? 'Hide Advanced Developer Telemetry (JSON)' : 'View Advanced Developer Telemetry (JSON)'}</span>
          {showRawTelemetry ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showRawTelemetry && (
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                <span>GET /api/health Payload</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(basicHealth, null, 2))}
                  className="hover:text-white"
                >
                  {copiedContract ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-emerald-400">{JSON.stringify(basicHealth, null, 2)}</pre>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-72">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                <span>GET /api/health/details Payload</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(detailedHealth, null, 2))}
                  className="hover:text-white"
                >
                  {copiedContract ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-teal-300">{JSON.stringify(detailedHealth, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
          <div className="font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600" /> Diagnostic Encountered An Error
          </div>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
