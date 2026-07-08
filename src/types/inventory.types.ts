export type InventorySourceType =
  | "donated"
  | "purchased"
  | "factory-offcut"
  | "returned-garment";

export type InventoryUnit = "kg" | "pieces" | "meters";

export type InventoryStatus = "raw" | "processing" | "converted" | "discarded";

export interface InventoryItem {
  _id: string;
  itemCode: string;
  materialType: string;
  sourceType: InventorySourceType;
  quantity: number;
  unit: InventoryUnit;
  dateReceived: string;
  notes: string;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemInput {
  itemCode: string;
  materialType: string;
  sourceType: InventorySourceType;
  quantity: number;
  unit?: InventoryUnit;
  dateReceived?: string;
  notes?: string;
  status?: InventoryStatus;
}
