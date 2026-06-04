'use client';

import { useEffect, useState } from 'react';
import { useFields } from '@/hooks/use-fields';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MemberRow {
  userId: string;
  email: string;
  role: string;
  zoneIds: string[];
}

export function TeamZoneAssignments() {
  const { fields } = useFields();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [zoneIds, setZoneIds] = useState<string[]>([]);

  const allZones = fields.flatMap((f) =>
    f.zones.map((z) => ({ id: z.id, label: `${f.name} · ${z.name}` }))
  );

  useEffect(() => {
    fetch('/api/team/assignments')
      .then((r) => r.json())
      .then((d: { members?: MemberRow[] }) => {
        setMembers(d.members ?? []);
        const fw = d.members?.find((m) => m.role === 'field_worker');
        if (fw) {
          setSelectedUser(fw.userId);
          setZoneIds(fw.zoneIds);
        }
      })
      .catch(() => undefined);
  }, []);

  async function save() {
    if (!selectedUser) {
      toast.error('Elegí un técnico');
      return;
    }
    const res = await fetch('/api/team/assignments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedUser, zoneIds }),
    });
    if (!res.ok) {
      toast.error('No se guardaron las zonas');
      return;
    }
    toast.success('Zonas asignadas');
  }

  function toggleZone(id: string) {
    setZoneIds((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  }

  const fieldWorkers = members.filter((m) => m.role === 'field_worker');

  return (
    <div className="space-y-3 text-sm">
      {fieldWorkers.length === 0 ? (
        <p className="text-muted-foreground">
          Invitá un miembro con rol «Campo» para asignar zonas.
        </p>
      ) : (
        <>
          <select
            className="rounded-md border bg-background px-3 py-2 w-full max-w-xs"
            value={selectedUser}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedUser(id);
              const m = members.find((x) => x.userId === id);
              setZoneIds(m?.zoneIds ?? []);
            }}
          >
            {fieldWorkers.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.email}
              </option>
            ))}
          </select>
          <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
            {allZones.map((z) => (
              <label key={z.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={zoneIds.includes(z.id)}
                  onChange={() => toggleZone(z.id)}
                />
                {z.label}
              </label>
            ))}
          </div>
          <Button size="sm" onClick={() => void save()}>
            Guardar asignación
          </Button>
        </>
      )}
    </div>
  );
}
