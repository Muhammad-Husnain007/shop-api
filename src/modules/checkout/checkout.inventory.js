import { ApiError } from '../../utils/ApiError.js';
import { Product } from '../products/product.model.js';

export async function lockAndReserveStock(context) {
  const lines = context.items;
  context.items = undefined;
  context.paymentRef = undefined;

  for (const item of lines || []) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity }, isActive: true },
      { $inc: { stock: -item.quantity } },
      { new: true, session: context.session },
    );
    if (!updated) throw ApiError.badRequest('Stock changed, recreate checkout');
  }

  return lines;
}

export function reservedProductId(context) {
  return context.items[0].product;
}
