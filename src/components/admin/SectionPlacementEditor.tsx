"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, LayoutList, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  FormSelect,
  IconButton,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import type { ProductBatch } from "@/types";

export type SectionRow = {
  batch: ProductBatch;
  enabled: boolean;
  order: number;
};

function moveItem<T extends { order: number }>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;

  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next.map((row, rowIndex) => ({ ...row, order: rowIndex }));
}

/**
 * Shared editor for an ordered list of product-batch carousel sections. Used for
 * both the editorial homepage and the Shop landing view so the two placements
 * behave identically.
 */
export function SectionPlacementEditor({
  title,
  description,
  batches,
  rows,
  onChange,
  addLabel,
  emptyDescription,
  loading = false,
}: {
  title: string;
  description: string;
  batches: ProductBatch[];
  rows: SectionRow[];
  onChange: (rows: SectionRow[]) => void;
  addLabel: string;
  emptyDescription: string;
  loading?: boolean;
}) {
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const selectedIds = useMemo(() => new Set(rows.map((row) => row.batch._id)), [rows]);
  const availableBatches = batches.filter((batch) => batch.active && !selectedIds.has(batch._id));

  const addBatch = () => {
    const batch = batches.find((item) => item._id === selectedBatchId);
    if (!batch || selectedIds.has(batch._id)) return;
    onChange([...rows, { batch, enabled: true, order: rows.length }]);
    setSelectedBatchId("");
  };

  return (
    <section className="mt-8">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-patch-ink">{title}</h2>
        <p className="mt-1 text-sm text-patch-ink-muted">{description}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-patch-line bg-patch-bg p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FormSelect
            label="Active product batch"
            value={selectedBatchId}
            onChange={setSelectedBatchId}
            icon={LayoutList}
          >
            <option value="">Select a batch</option>
            {availableBatches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.title}
              </option>
            ))}
          </FormSelect>
        </div>
        <Button type="button" icon={Plus} onClick={addBatch} disabled={!selectedBatchId}>
          {addLabel}
        </Button>
      </div>

      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableCellClass}>Order</th>
            <th className={tableCellClass}>Section</th>
            <th className={tableCellClass}>Products</th>
            <th className={tableCellClass}>Display</th>
            <th className={tableCellClass}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={5} className="p-6">
                <div className="h-24 animate-pulse rounded-lg bg-patch-ink/5" />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState icon={LayoutList} title="No sections selected" description={emptyDescription} />
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.batch._id} className={tableRowClass}>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{index + 1}</td>
                <td className={tableCellClass}>
                  <p className="text-base font-medium text-patch-ink">{row.batch.title}</p>
                  {row.batch.description && (
                    <p className="mt-1 max-w-xl text-sm text-patch-ink-muted">{row.batch.description}</p>
                  )}
                  {!row.batch.active && (
                    <p className="mt-1 text-xs text-red-600">Inactive batches are skipped on the storefront.</p>
                  )}
                </td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{row.batch.products.length} products</td>
                <td className={tableCellClass}>
                  <Badge tone={row.enabled ? "green" : "neutral"}>{row.enabled ? "Enabled" : "Disabled"}</Badge>
                </td>
                <td className={`${tableCellClass} text-right`}>
                  <div className="flex justify-end gap-1">
                    <IconButton
                      icon={ArrowUp}
                      label="Move up"
                      onClick={() => onChange(moveItem(rows, index, -1))}
                      disabled={index === 0}
                    />
                    <IconButton
                      icon={ArrowDown}
                      label="Move down"
                      onClick={() => onChange(moveItem(rows, index, 1))}
                      disabled={index === rows.length - 1}
                    />
                    <IconButton
                      icon={row.enabled ? EyeOff : Eye}
                      label={row.enabled ? "Disable" : "Enable"}
                      onClick={() =>
                        onChange(
                          rows.map((item) =>
                            item.batch._id === row.batch._id ? { ...item, enabled: !item.enabled } : item
                          )
                        )
                      }
                    />
                    <IconButton
                      icon={Trash2}
                      label="Remove"
                      tone="danger"
                      onClick={() =>
                        onChange(
                          rows
                            .filter((item) => item.batch._id !== row.batch._id)
                            .map((item, itemIndex) => ({ ...item, order: itemIndex }))
                        )
                      }
                    />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </section>
  );
}
