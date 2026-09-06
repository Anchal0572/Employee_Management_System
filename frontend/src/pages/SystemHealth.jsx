import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, CheckCircle2, XCircle, Clock, Database, Server, Cpu } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Health & API Diagnostics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Verification center for Phase 1 backend endpoints and service layer connectivity.
          </p>
        </div>
        <Button variant="primary" onClick={runAllDiagnostics} loading={loading} icon={RefreshCw}>
          Execute Diagnostics
        </Button>
      </div>

      {/* Latency & Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <div className="text-xs font-semibold text-slate-500 uppercase">Primary Health Status</div>
          <div className="mt-2 flex items-center gap-2">
            {basicHealth?.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-lg font-bold text-slate-900">
              {basicHealth?.message || (loading ? 'Probing...' : 'Offline')}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">Endpoint: GET /api/health</div>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <div className="text-xs font-semibold text-slate-500 uppercase">Roundtrip Latency</div>
          <div className="mt-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span className="text-lg font-bold text-slate-900">
              {latencyMs !== null ? `${latencyMs} ms` : '--'}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">Axios Client &rarr; Express Backend</div>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <div className="text-xs font-semibold text-slate-500 uppercase">Mongoose ODM State</div>
          <div className="mt-2 flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-600" />
            <span className="text-lg font-bold capitalize text-slate-900">
              {detailedHealth?.data?.database?.state || 'Configured'}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {detailedHealth?.data?.database?.isConnected ? 'Database connection alive' : 'Awaiting local MongoDB daemon'}
          </div>
        </Card>
      </div>

      {/* Contract Verification Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Health Output */}
        <Card
          title="GET /api/health"
          subtitle="Required Response Contract Verification"
          headerAction={
            <Badge variant={basicHealth?.success ? 'success' : 'danger'}>
              {basicHealth ? '200 OK' : 'Pending'}
            </Badge>
          }
        >
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
            <pre>{JSON.stringify(basicHealth || { message: 'Loading...' }, null, 2)}</pre>
          </div>
        </Card>

        {/* Detailed Health Output */}
        <Card
          title="GET /api/health/details"
          subtitle="Full Telemetry & Environment Inspector"
          headerAction={
            <Badge variant="info">Diagnostic Telemetry</Badge>
          }
        >
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-72">
            <pre>{JSON.stringify(detailedHealth || { message: 'Loading...' }, null, 2)}</pre>
          </div>
        </Card>
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
