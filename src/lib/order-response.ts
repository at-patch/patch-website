import type { Order, OrderItem } from "@/types";

type PopulatedOrderItem = Omit<OrderItem, "product"> & {
  product: string | { _id?: string; images?: string[] };
};

type PopulatedOrder = Omit<Order, "items"> & {
  items: PopulatedOrderItem[];
};

export function serializeOrderWithImages(order: unknown): Order {
  const plain = JSON.parse(JSON.stringify(order)) as PopulatedOrder;

  return {
    ...plain,
    items: plain.items.map((item) => {
      const product = item.product;
      const productId = typeof product === "string" ? product : product?._id ?? "";
      const productImage = typeof product === "object" ? product.images?.[0] : undefined;

      return {
        ...item,
        product: productId,
        image: item.image || productImage,
      };
    }),
  };
}
