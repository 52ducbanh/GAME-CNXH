import type { AuditEvent, ResourceLedger } from 'shared';

export function deductResource(ledger: ResourceLedger, missionId: 'M1' | 'M2' | 'M3', description: string, amount: number,
  audit: (category: AuditEvent['category'], message: string) => void): void {
  ledger.currentBudget -= amount;
  ledger.version++;
  ledger.entries.unshift({
    id: `LEDGER_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(), missionId, description, amount, balanceAfter: ledger.currentBudget,
  });
  audit('RESOURCE', `SỔ SÁCH CÔNG: -${amount} đơn vị. Số dư ngân sách còn: ${ledger.currentBudget}.`);
}
