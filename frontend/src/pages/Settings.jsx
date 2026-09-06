import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Clock,
  Calendar,
  Shield,
  Activity,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const Settings = () => {
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure organization policies, work schedules, leave quotas, and environment rules.
          </p>
        </div>

        <Link to="/system-health">
          <Button variant="secondary" size="sm" icon={Activity}>
            Run System Diagnostics
          </Button>
        </Link>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Settings updated and persisted across the platform.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <Card title="Company Information" subtitle="Official registered organizational identity">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Legal Entity Name"
              defaultValue="WorkPulse Technologies Inc."
              required
            />
            <Input
              label="Corporate Tax ID / EIN"
              defaultValue="EIN-94-3829104"
              required
            />
            <Input
              label="Corporate Headquarters"
              defaultValue="100 Silicon Way, San Francisco, CA"
            />
            <Select
              label="Default Operational Timezone"
              options={[
                'America/Los_Angeles (PST/PDT)',
                'America/New_York (EST/EDT)',
                'Europe/London (GMT/BST)',
                'Asia/Kolkata (IST)'
              ]}
              defaultValue="America/Los_Angeles (PST/PDT)"
            />
          </div>
        </Card>

        {/* Work Shifts & Attendance Rules */}
        <Card title="Shift & Working Hours" subtitle="Standard daily attendance parameters">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Standard Shift Start"
              type="time"
              defaultValue="09:00"
              required
            />
            <Input
              label="Standard Shift End"
              type="time"
              defaultValue="17:30"
              required
            />
            <Input
              label="Late Arrival Grace (Minutes)"
              type="number"
              defaultValue="15"
              required
            />
          </div>
        </Card>

        {/* Default Leave Quotas */}
        <Card title="Annual Leave Policy Quotas" subtitle="Default calendar year leave allocations">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Annual Vacation (Days)"
              type="number"
              defaultValue="20"
              required
            />
            <Input
              label="Paid Sick Leave (Days)"
              type="number"
              defaultValue="10"
              required
            />
            <Input
              label="Casual Leave (Days)"
              type="number"
              defaultValue="7"
              required
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" icon={Save}>
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
