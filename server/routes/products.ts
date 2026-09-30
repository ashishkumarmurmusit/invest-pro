import { Router, Response } from 'express';
import { db, generateId } from '../db';
import { AuthenticatedUserRequest, requireUser } from '../middleware';
import { Order } from '../types';

export const productsRouter = Router();

// Public: Get all active products
productsRouter.get('/', (_req, res: Response) => {
  const activeProducts = db.products.filter(p => p.isActive);
  return res.json({ products: activeProducts });
});

// Public: Get single product by id
productsRouter.get('/:id', (req, res: Response) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  return res.json({ product });
});

// Authenticated: Buy product
productsRouter.post('/buy', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const { productId } = req.body;

  const product = db.products.find(p => p.id === productId && p.isActive);
  if (!product) {
    return res.status(404).json({ error: 'Selected product is not available.' });
  }

  if (product.stock <= 0) {
    return res.status(400).json({ error: 'This product is currently out of stock.' });
  }

  if (user.walletBalance < product.price) {
    return res.status(400).json({
      error: `Insufficient balance (₹${user.walletBalance.toFixed(2)}). Product price is ₹${product.price.toFixed(2)}. Please recharge your wallet.`,
    });
  }

  // Deduct balance
  db.adjustUserBalance(user.id, -product.price);
  product.stock -= 1;

  const orderId = generateId('ORD');
  const now = new Date();
  const endDate = new Date(now.getTime() + product.durationDays * 24 * 60 * 60 * 1000);

  const order: Order = {
    id: orderId,
    userId: user.id,
    productId: product.id,
    productName: product.name,
    planType: product.planType || 'daily_withdrawal',
    price: product.price,
    dailyReturn: product.dailyReturn,
    durationDays: product.durationDays,
    totalReturn: product.totalReturn,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    collectedReturns: 0,
    createdAt: now.toISOString(),
  };

  db.orders.unshift(order);

  // Record ledger transaction
  const tx = db.recordTransaction(
    user.id,
    'order',
    product.price,
    -product.price,
    `Invested in ${product.name} (Capital: ₹${product.price.toFixed(2)}, Type: ${product.planType === 'locking_cycle' ? 'Locking Cycle' : 'Daily Income'})`,
    0,
    order.id,
    'completed'
  );

  // Notify user
  db.addNotification(
    'Investment Plan Activated',
    `You have successfully invested ₹${product.price.toFixed(2)} in ${product.name} (${product.planType === 'locking_cycle' ? `Locked for ${product.durationDays} Days, Maturity: ₹${product.totalReturn}` : `₹${product.dailyReturn}/day for ${product.durationDays} Days`}).`,
    'order',
    user.id
  );

  return res.json({
    success: true,
    message: `${product.name} invested successfully!`,
    order,
    txId: tx.id,
    newBalance: user.walletBalance,
  });
});

// Authenticated: Transfer/Claim accumulated investment profit to Main Wallet
productsRouter.post('/transfer', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const { orderId } = req.body;

  const userOrders = db.orders.filter(o => o.userId === user.id && o.status === 'active');
  if (userOrders.length === 0) {
    return res.status(400).json({ error: 'You have no active investment plans.' });
  }

  const targetOrders = orderId ? userOrders.filter(o => o.id === orderId) : userOrders;
  if (targetOrders.length === 0) {
    return res.status(404).json({ error: 'Selected investment plan not found or already completed.' });
  }

  const now = new Date();
  const nowMs = now.getTime();
  let totalTransferred = 0;
  const processedOrders: Order[] = [];

  for (const order of targetOrders) {
    const isLocking = order.planType === 'locking_cycle';
    const collected = order.collectedReturns || 0;
    const remainingTotal = Math.max(0, order.totalReturn - collected);

    if (remainingTotal <= 0) {
      order.status = 'completed';
      continue;
    }

    if (isLocking) {
      // Locking Cycle: Funds unlock ONLY after durationDays have elapsed!
      const startDate = new Date(order.startDate).getTime();
      const diffDays = Math.floor((nowMs - startDate) / (1000 * 60 * 60 * 24));

      if (diffDays >= order.durationDays || nowMs >= new Date(order.endDate).getTime()) {
        const claimable = remainingTotal;
        if (claimable > 0) {
          order.collectedReturns = order.totalReturn;
          order.status = 'completed';
          totalTransferred += claimable;
          processedOrders.push(order);
        }
      }
    } else {
      // Daily Withdrawal: 1 day payout (e.g. ₹100) per 24 hours
      // Check 24-hour timer from last claim date
      let isEligible = false;

      if (!order.lastClaimDate) {
        // First claim upon plan activation
        isEligible = true;
      } else {
        const lastClaimMs = new Date(order.lastClaimDate).getTime();
        const elapsedHours = (nowMs - lastClaimMs) / (1000 * 60 * 60);

        if (elapsedHours >= 24) {
          isEligible = true;
        }
      }

      if (isEligible) {
        const claimable = Math.min(order.dailyReturn, remainingTotal);

        if (claimable > 0) {
          order.collectedReturns = collected + claimable;
          order.daysClaimed = (order.daysClaimed || 0) + 1;
          order.lastClaimDate = now.toISOString();
          order.nextClaimAvailableAt = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();

          totalTransferred += claimable;

          if (order.collectedReturns >= order.totalReturn || (order.daysClaimed || 0) >= order.durationDays) {
            order.status = 'completed';
          }

          processedOrders.push(order);
        }
      }
    }
  }

  if (totalTransferred <= 0) {
    if (targetOrders.length === 1) {
      const ord = targetOrders[0];
      if (ord.planType === 'locking_cycle') {
        const remaining = Math.max(0, ord.durationDays - Math.floor((nowMs - new Date(ord.startDate).getTime()) / (1000 * 60 * 60 * 24)));
        return res.status(400).json({
          error: `This plan is locked in a ${ord.durationDays}-day cycle (${remaining} days remaining). Full payout of ₹${ord.totalReturn.toFixed(2)} will unlock upon maturity.`,
        });
      } else if (ord.nextClaimAvailableAt) {
        const diffMs = new Date(ord.nextClaimAvailableAt).getTime() - nowMs;
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          return res.status(400).json({
            error: `Today's profit was already transferred! Next 24-hour claim unlocks in ${hours}h ${mins}m.`,
          });
        }
      }
    }
    return res.status(400).json({ error: 'No daily profit available to transfer right now. Please wait for the 24-hour timer to complete.' });
  }

  // Credit user's main wallet directly
  db.adjustUserBalance(user.id, totalTransferred);

  // Record ledger transaction
  const tx = db.recordTransaction(
    user.id,
    'order',
    totalTransferred,
    totalTransferred,
    `Transferred ₹${totalTransferred.toFixed(2)} Daily Investment Profit to Main Wallet`,
    0,
    processedOrders[0]?.id,
    'completed'
  );

  // Notification
  db.addNotification(
    'Profit Transferred to Main Wallet',
    `₹${totalTransferred.toFixed(2)} daily return has been transferred to your Main Wallet. Next claim unlocks in 24 hours.`,
    'order',
    user.id
  );

  const updatedOrders = db.orders.filter(o => o.userId === user.id);

  return res.json({
    success: true,
    message: `₹${totalTransferred.toFixed(2)} transferred to your Main Wallet successfully! Next claim in 24 hours.`,
    transferredAmount: totalTransferred,
    newBalance: user.walletBalance,
    txId: tx.id,
    orders: updatedOrders,
  });
});

// Authenticated: Get user active orders
productsRouter.get('/user/orders', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const userOrders = db.orders.filter(o => o.userId === user.id);
  return res.json({ orders: userOrders });
});
