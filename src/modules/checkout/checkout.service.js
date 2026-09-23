import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { clearCart, getOrCreateCart } from '../cart/cart.service.js';
import { createPaidOrder } from '../orders/order.service.js';
import { Product } from '../products/product.model.js';
import { Checkout } from './checkout.model.js';
import { lockAndReserveStock } from './checkout.inventory.js';

function assertOwner(checkout, user) {
  if (String(checkout.user) !== user.id && user.role !== 'admin') {
    throw ApiError.forbidden('Not your checkout');
  }
}

export async function createCheckout(user, { address, shipping = 0 }) {
  const cart = await getOrCreateCart(user.id);
  if (!cart.items.length) throw ApiError.badRequest('Cart is empty');

  const items = [];
  for (const item of cart.items) {
    const product = await Product.findById(item.product._id || item.product);
    if (!product || !product.isActive) throw ApiError.badRequest('A product is no longer available');
    if (product.stock < item.quantity) throw ApiError.badRequest(`${product.title} is out of stock`);
    items.push({
      product: product.id,
      title: product.title,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice: product.price,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return Checkout.create({
    user: user.id,
    items,
    address,
    subtotal,
    shipping,
    total: subtotal + shipping,
    currency: 'USD',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
}

export async function getCheckout(id, user) {
  const checkout = await Checkout.findById(id);
  if (!checkout) throw ApiError.notFound('Checkout not found');
  assertOwner(checkout, user);
  if (checkout.status === 'pending' && checkout.expiresAt < new Date()) {
    checkout.status = 'expired';
    await checkout.save();
  }
  return checkout;
}

export async function confirmCheckout(id, user, paymentRef) {
  const checkout = await getCheckout(id, user);
  if (checkout.status === 'expired') throw ApiError.badRequest('Checkout expired');
  if (checkout.status === 'paid') throw ApiError.conflict('Checkout already paid');
  if (checkout.status !== 'pending') throw ApiError.badRequest('Checkout cannot be confirmed');

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const context = {
      checkout,
      user,
      session,
      paymentRef: paymentRef || `pay_${checkout.id}`,
      items: checkout.items.map((item) => ({
        product: item.product,
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    const reservation = lockAndReserveStock(context);
    const { order } = await createPaidOrder(context);
    await reservation;

    checkout.status = 'paid';
    checkout.paymentRef = order.paymentRef;
    checkout.order = order.id;
    await checkout.save({ session });
    await session.commitTransaction();
    await clearCart(user.id);
    return { checkout, order };
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    if (error?.code === 11000) throw ApiError.conflict('Checkout already paid');
    throw error;
  } finally {
    session.endSession();
  }
}
