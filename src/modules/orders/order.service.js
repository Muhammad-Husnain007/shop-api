import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { paginated, parsePagination } from '../../utils/pagination.js';
import { Product } from '../products/product.model.js';
import { Order } from './order.model.js';

export async function listOrders(user, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = user.role === 'admin' ? {} : { user: user.id };
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  return paginated(items, total, { page, limit });
}

export async function getOrder(id, user) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');
  if (user.role !== 'admin' && String(order.user) !== user.id) throw ApiError.forbidden('Not your order');
  return order;
}

export async function updateOrderStatus(id, user, status) {
  const order = await getOrder(id, user);
  if (user.role !== 'admin') throw ApiError.forbidden('Only admin can update status');
  order.status = status;
  return order.save();
}

export async function cancelOrder(id, user) {
  const order = await getOrder(id, user);
  if (!['placed', 'paid'].includes(order.status)) {
    throw ApiError.badRequest('Order can no longer be cancelled');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const claimed = await Order.findOneAndUpdate(
      { _id: order.id, status: { $in: ['placed', 'paid'] } },
      { $set: { status: 'cancelled' } },
      { new: true, session },
    );
    if (!claimed) throw ApiError.badRequest('Order can no longer be cancelled');

    for (const item of claimed.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } },
        { session },
      );
    }
    await session.commitTransaction();
    return claimed;
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
