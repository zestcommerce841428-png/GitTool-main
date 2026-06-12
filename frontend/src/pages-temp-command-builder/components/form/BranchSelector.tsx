import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitBranch, Loader2 } from 'lucide-react';

export default function BranchSelector({ label, value, onChange, branches, loading }: any) {
  return (
    <div className="form-field">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
        {label}
      </label>
      <div className="relative">
        {loading ? (
          <div className="flex items-center justify-between h-11 w-full rounded-xl border border-border/60 bg-muted/30 px-3 text-sm font-medium text-muted-foreground">
            Loading branches...
            <Loader2 size={15} className="animate-spin text-muted-foreground/50" />
          </div>
        ) : branches?.length > 0 ? (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full h-11 rounded-xl bg-background/80 border-border/60 text-sm font-medium">
              <SelectValue placeholder="Select a branch..." />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b: any) => (
                 <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center h-11 w-full rounded-xl border border-border/60 bg-muted/30 px-3 text-sm font-medium text-muted-foreground cursor-not-allowed">
            {value || 'main'}
            <GitBranch size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          </div>
        )}
      </div>
    </div>
  );
}
