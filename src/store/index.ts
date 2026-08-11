import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import checkoutReducer from "./slices/checkoutSlice";
import productReducer from "./slices/productSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  checkout: checkoutReducer,
  product: productReducer,
});

// `checkout` is persisted so a Buy Now intent survives the Stripe redirect round
// trip; its own TTL expires stale intents rather than relying on storage lifetime.
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "cart", "checkout"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
