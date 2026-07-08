export interface SavedAddress {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine: string;
  area: "gulshan" | "banani" | "baridhara" | "other";
  city: string;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  addresses: SavedAddress[];
  createdAt: string;
  updatedAt: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
