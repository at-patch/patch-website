import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios";
import type { ApiListResponse, Product, ProductListParams } from "@/types";

interface ProductState {
  items: Product[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = { items: [], total: 0, loading: false, error: null };

export const fetchProducts = createAsyncThunk(
  "product/fetchProducts",
  async (params: ProductListParams | undefined) => {
    const { data } = await axiosInstance.get<ApiListResponse<Product>>("/products", { params });
    return data;
  }
);

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load products";
      });
  },
});

export default productSlice.reducer;
