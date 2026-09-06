import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  CalendarCheck,
  TrendingUp,
  Activity,
  Server,
  Database,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { healthService } from '../services/healthService';

export const Dashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState(null);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const res = await healthService.getDetailedDiagnostics();
      setHealthData(res.data);
    } catch (err) {
      setHealthError(err.message || 'Unable to connect to backend server');
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const stats = [
    { label: 'Total Workforce', value: '148', change: '+12% from last month', icon: Users, trend: 'up' },
    { label: 'Active Today', value: '136', change: '91.8% presence rate', icon: CalendarCheck, trend: 'neutral' },
    { label: 'Departments', value: '8', change: 'Cross-functional teams', icon: Building2, trend: 'neutral' },
    { label: 'Retention Rate', value: '96.4%', change: '+1.8% this quarter', icon: TrendingUp, trend: 'up' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive HR Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time workforce intelligence, system health, and core operational metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={fetchHealth} loading={loadingHealth} icon={Activity}>
            Run Diagnostics
          </Button>
          <Button variant="primary" size="md" icon={Plus}>
            Add Employee
          </Button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-emerald-600 font-medium">{stat.change}</span>
              </p>
            </Card>
          );
        })}
      </div>

      {/* Phase 1 System Health & Architecture Status Card */}
      <Card
        title="Phase 1 Architectural Foundation Status"
        subtitle="Live telemetry and infrastructure connectivity monitoring"
        headerAction={
          <Badge
            variant={healthData ? 'success' : healthError ? 'danger' : 'warning'}
            dot
          >
            {healthData ? 'Operational' : healthError ? 'Attention Needed' : 'Checking'}
          </Badge>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Node/Express Backend */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-800">Node/Express Server</span>
              </div>
              <Badge variant={healthData ? 'success' : 'danger'}>
                {healthData ? 'HTTP 200 OK' : 'Disconnected'}
              </Badge>
            </div>
            <div className="text-xs text-slate-600 space-y-1 mt-2">
              <div><span className="text-slate-400">Environment:</span> <span className="font-medium text-slate-700">{healthData?.environment || 'development'}</span></div>
              <div><span className="text-slate-400">Uptime:</span> <span className="font-medium text-slate-700">{healthData?.uptime?.formatted || 'N/A'}</span></div>
              <div><span className="text-slate-400">Endpoint:</span> <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-[11px]">GET /api/health</code></div>
            </div>
          </div>

          {/* Database Layer */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-800">MongoDB Database</span>
              </div>
              <Badge variant={healthData?.database?.isConnected ? 'success' : 'warning'}>
                {healthData?.database?.state || 'Configured'}
              </Badge>
            </div>
            <div className="text-xs text-slate-600 space-y-1 mt-2">
              <div><span className="text-slate-400">Driver:</span> <span className="font-medium text-slate-700">Mongoose ODM</span></div>
              <div><span className="text-slate-400">Target DB:</span> <span className="font-medium text-slate-700">{healthData?.database?.name || 'ems_db'}</span></div>
              <div><span className="text-slate-400">State:</span> <span className="font-medium capitalize text-slate-700">{healthData?.database?.state || 'Initializing'}</span></div>
            </div>
          </div>

          {/* Client & AI Layer */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-slate-800">Client & AI Architecture</span>
              </div>
              <Badge variant="info">Ready</Badge>
            </div>
            <div className="text-xs text-slate-600 space-y-1 mt-2">
              <div><span className="text-slate-400">Frontend:</span> <span className="font-medium text-slate-700">React 18 + Vite + Tailwind</span></div>
              <div><span className="text-slate-400">API Client:</span> <span className="font-medium text-slate-700">Axios with Interceptors</span></div>
              <div><span className="text-slate-400">AI Service Layer:</span> <span className="font-medium text-slate-700">Isolated Module</span></div>
            </div>
          </div>
        </div>

        {healthError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{healthError}</span>
          </div>
        )}
      </Card>

      {/* Quick Architecture Roadmap Notice */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="bg-slate-800 text-slate-300 border-slate-700">Phase 1 Complete</Badge>
            <span className="text-xs text-slate-400">Next: Phase 2 Authentication & Core EMS Models</span>
          </div>
          <h3 className="text-base font-semibold text-white">Full-Stack Enterprise Architecture Initialized</h3>
          <p className="text-xs text-slate-400 max-w-2xl">
            Clean separation of concerns is established across frontend services, Express controllers/routes, Mongoose models, and isolated background & AI service modules.
          </p>
        </div>
        <a
          href="/system-health"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white transition-colors"
        >
          Inspect API Health <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
