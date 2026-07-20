import OrderModel from "@/lib/models/Order";

export type ClaimGuestOrdersInput = {
  customerId: string;
  email: string;
};

export async function claimGuestOrdersForCustomer({ customerId, email }: ClaimGuestOrdersInput) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!customerId || !normalizedEmail) return { matchedCount: 0, modifiedCount: 0 };

  return OrderModel.updateMany(
    {
      "shippingAddress.email": normalizedEmail,
      $or: [{ customer: { $exists: false } }, { customer: null }],
    },
    { $set: { customer: customerId } }
  );
}
