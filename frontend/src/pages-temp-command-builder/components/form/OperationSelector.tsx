import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OperationSelector({ action, setAction, iconMap, options }: any) {
  return (
    <div className="form-field">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
        1️⃣ Select Operation
      </label>
      <Select value={action} onValueChange={setAction}>
        <SelectTrigger className="w-full h-11 rounded-xl bg-background/80 border-border/60 text-sm font-semibold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((a: any) => {
            const Icon = iconMap ? (iconMap as Record<string,any>)[a] : null;
            return (
              <SelectItem key={a} value={a}>
                <span className="inline-flex items-center gap-2">
                  {Icon && <Icon size={14} className="text-muted-foreground" />}
                  {a}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
