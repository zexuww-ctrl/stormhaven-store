const Stripe = require('stripe');
const paypal = require('paypal-rest-sdk');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

async function createStripeSession(order) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: order.items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    })),
    success_url: `${process.env.FRONTEND_URL}/order-confirmation?orderId=${order._id}`,
    cancel_url: `${process.env.FRONTEND_URL}/cart`,
    metadata: { orderId: String(order._id) }
  });
  return session;
}

module.exports = { stripe, paypal, createStripeSession };
