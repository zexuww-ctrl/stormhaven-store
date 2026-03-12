 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/.gitignore b/.gitignore
new file mode 100644
index 0000000000000000000000000000000000000000..0e5def6d16693084aad2a18c41b2d3e09d78fafc
--- /dev/null
+++ b/.gitignore
@@ -0,0 +1,7 @@
+node_modules
+.env
+.next
+dist
+coverage
+frontend/.next
+backend/logs/*.log
diff --git a/README.md b/README.md
new file mode 100644
index 0000000000000000000000000000000000000000..2299f61ea10655230e707c831da7cba53fcd37d4
--- /dev/null
+++ b/README.md
@@ -0,0 +1,99 @@
+# Stormhaven Store
+
+Professional Minecraft server store for **Stormhaven** (`mc.stormhaven.fun`) built with Next.js + Tailwind frontend and Express + MongoDB backend.
+
+## Features
+
+- Dark black + emerald gaming UI with responsive layout.
+- Home, Store, Ranks, Crate Keys, Cart, Checkout, Account, and Admin pages.
+- JWT auth with user/admin role protection.
+- Stripe webhook verification and PayPal configuration.
+- RCON execution after successful purchase with command logging and retry job.
+- Mojang username validation endpoint.
+- Live server status + player counter + leaderboard endpoint.
+- Discount code management and revenue stats in admin.
+- API rate limiting and validation middleware.
+
+## Project Structure
+
+```txt
+frontend/          # Next.js + React + Tailwind
+backend/           # Express API, MongoDB models, JWT auth, payment + RCON integration
+docker-compose.yml # Local MongoDB for development
+```
+
+## Setup
+
+### 1) Start MongoDB
+
+```bash
+docker compose up -d mongo
+```
+
+### 2) Backend
+
+```bash
+cd backend
+cp .env.example .env
+npm install
+npm run seed
+npm run dev
+```
+
+### 3) Frontend
+
+```bash
+cd frontend
+cp .env.example .env.local
+npm install
+npm run dev
+```
+
+Frontend runs on `http://localhost:3000`, backend on `http://localhost:5000`.
+
+## Payment Integration
+
+### Stripe
+
+1. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `backend/.env`.
+2. Configure webhook endpoint:
+   - `POST /api/payments/webhook/stripe`
+3. Use Stripe CLI locally:
+
+```bash
+stripe listen --forward-to localhost:5000/api/payments/webhook/stripe
+```
+
+### PayPal
+
+1. Create REST app in PayPal developer dashboard.
+2. Add `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.
+3. Extend `paymentController` for create/capture order if you want full server-side PayPal order capture.
+
+## Connect Website to Minecraft Server (RCON)
+
+1. Enable RCON in your Minecraft server config:
+   - `enable-rcon=true`
+   - `rcon.password=<secure password>`
+   - `rcon.port=25575`
+2. Set `RCON_HOST`, `RCON_PORT`, and `RCON_PASSWORD` in backend `.env`.
+3. Add rank and crate commands to each product, e.g.:
+   - `lp user {player} parent set vip`
+   - `crate give {player} legendary 3`
+4. After successful payment webhook, commands are executed automatically and logged in `CommandLog`.
+5. Failed commands are retried every minute by background retry job.
+
+## Security Notes
+
+- JWT-based auth and role checks for admin routes.
+- Stripe webhook signature verification.
+- Input validation via `express-validator`.
+- API rate limiting enabled globally.
+- HTTPS ready behind reverse proxy (Nginx/Cloudflare).
+
+## Deployment Notes
+
+- Deploy frontend to Vercel/Netlify with environment variables from `frontend/.env.example`.
+- Deploy backend to VPS/Render/Fly.io and expose port `5000` (or configured `PORT`).
+- Use managed MongoDB (MongoDB Atlas recommended).
+- Place backend behind HTTPS reverse proxy and allow Stripe webhook access.
diff --git a/backend/.env.example b/backend/.env.example
new file mode 100644
index 0000000000000000000000000000000000000000..22c123776d5ba01fb0b7fb1a7e1e1401a05e0bd4
--- /dev/null
+++ b/backend/.env.example
@@ -0,0 +1,15 @@
+PORT=5000
+FRONTEND_URL=http://localhost:3000
+MONGODB_URI=mongodb://localhost:27017/stormhaven-store
+JWT_SECRET=change-this-secret
+
+STRIPE_SECRET_KEY=sk_test_xxx
+STRIPE_WEBHOOK_SECRET=whsec_xxx
+PAYPAL_MODE=sandbox
+PAYPAL_CLIENT_ID=paypal_client_id
+PAYPAL_CLIENT_SECRET=paypal_client_secret
+
+RCON_HOST=127.0.0.1
+RCON_PORT=25575
+RCON_PASSWORD=change_me
+MC_SERVER_IP=mc.stormhaven.fun
diff --git a/backend/package.json b/backend/package.json
new file mode 100644
index 0000000000000000000000000000000000000000..a0dc0f955530ababa81e39c8e821254e265207e4
--- /dev/null
+++ b/backend/package.json
@@ -0,0 +1,29 @@
+{
+  "name": "stormhaven-backend",
+  "version": "1.0.0",
+  "main": "src/server.js",
+  "scripts": {
+    "dev": "nodemon src/server.js",
+    "start": "node src/server.js",
+    "seed": "node scripts/seed.js"
+  },
+  "dependencies": {
+    "axios": "^1.7.2",
+    "bcryptjs": "^2.4.3",
+    "cookie-parser": "^1.4.6",
+    "cors": "^2.8.5",
+    "dotenv": "^16.4.5",
+    "express": "^4.19.2",
+    "express-rate-limit": "^7.3.1",
+    "express-validator": "^7.1.0",
+    "jsonwebtoken": "^9.0.2",
+    "mongoose": "^8.4.4",
+    "morgan": "^1.10.0",
+    "node-rcon": "^1.2.0",
+    "paypal-rest-sdk": "^1.8.1",
+    "stripe": "^16.2.0"
+  },
+  "devDependencies": {
+    "nodemon": "^3.1.4"
+  }
+}
diff --git a/backend/scripts/seed.js b/backend/scripts/seed.js
new file mode 100644
index 0000000000000000000000000000000000000000..e279070009b4284786c710a1c0df1733be3cbeaf
--- /dev/null
+++ b/backend/scripts/seed.js
@@ -0,0 +1,23 @@
+require('dotenv').config();
+const connectDB = require('../src/config/db');
+const Product = require('../src/models/Product');
+
+async function seed() {
+  await connectDB();
+  await Product.deleteMany({});
+  await Product.insertMany([
+    { name: 'VIP', category: 'rank', description: 'Entry rank with perks', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420', price: 9.99, perks: ['/kit vip', '2 homes'], commands: ['lp user {player} parent set vip'] },
+    { name: 'MVP', category: 'rank', description: 'Improved rank with extra commands', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f', price: 19.99, perks: ['/kit mvp', '5 homes'], commands: ['lp user {player} parent set mvp'] },
+    { name: 'LEGEND', category: 'rank', description: 'Premium rank with priority queue', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e', price: 34.99, perks: ['/kit legend', '10 homes'], commands: ['lp user {player} parent set legend'] },
+    { name: 'IMMORTAL', category: 'rank', description: 'Top rank with exclusive perks', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5', price: 59.99, perks: ['/kit immortal', '15 homes'], commands: ['lp user {player} parent set immortal'] },
+    { name: 'Vote Key', category: 'crate', description: '1 Vote key', image: 'https://images.unsplash.com/photo-1603481546579-65d935ba9cdd', price: 1.99, commands: ['crate give {player} vote 1'] },
+    { name: 'Rare Key', category: 'crate', description: '1 Rare key', image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025', price: 4.99, commands: ['crate give {player} rare 1'] },
+    { name: 'Epic Key', category: 'crate', description: '1 Epic key', image: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e', price: 7.99, commands: ['crate give {player} epic 1'] },
+    { name: 'Legendary Key', category: 'crate', description: '3 Legendary keys', image: 'https://images.unsplash.com/photo-1633545501846-11284fcbac8d', price: 14.99, commands: ['crate give {player} legendary 3'] },
+    { name: 'Starter Bundle', category: 'bundle', description: 'VIP + 5 Rare keys', image: 'https://images.unsplash.com/photo-1614294149010-950b698f72c0', price: 24.99, commands: ['lp user {player} parent set vip', 'crate give {player} rare 5'] }
+  ]);
+  console.log('Seeded products');
+  process.exit(0);
+}
+
+seed();
diff --git a/backend/src/config/db.js b/backend/src/config/db.js
new file mode 100644
index 0000000000000000000000000000000000000000..bdf4c38c8357601537702e01112a823392e117a4
--- /dev/null
+++ b/backend/src/config/db.js
@@ -0,0 +1,8 @@
+const mongoose = require('mongoose');
+
+const connectDB = async () => {
+  await mongoose.connect(process.env.MONGODB_URI);
+  console.log('MongoDB connected');
+};
+
+module.exports = connectDB;
diff --git a/backend/src/controllers/adminController.js b/backend/src/controllers/adminController.js
new file mode 100644
index 0000000000000000000000000000000000000000..93a726f4190fc3053616a1ae1a4b93d8a7466570
--- /dev/null
+++ b/backend/src/controllers/adminController.js
@@ -0,0 +1,20 @@
+const User = require('../models/User');
+const Order = require('../models/Order');
+const DiscountCode = require('../models/DiscountCode');
+
+exports.stats = async (req, res) => {
+  const orders = await Order.find({ paymentStatus: 'paid' });
+  const revenue = orders.reduce((acc, o) => acc + o.total, 0);
+  res.json({
+    revenue,
+    orders: await Order.countDocuments(),
+    users: await User.countDocuments()
+  });
+};
+
+exports.getDiscountCodes = async (req, res) => res.json(await DiscountCode.find().sort({ createdAt: -1 }));
+exports.createDiscountCode = async (req, res) => res.status(201).json(await DiscountCode.create(req.body));
+exports.deleteDiscountCode = async (req, res) => {
+  await DiscountCode.findByIdAndDelete(req.params.id);
+  res.json({ ok: true });
+};
diff --git a/backend/src/controllers/authController.js b/backend/src/controllers/authController.js
new file mode 100644
index 0000000000000000000000000000000000000000..113f71d732c8eb84ab6749d8ca6464dc3ec40e83
--- /dev/null
+++ b/backend/src/controllers/authController.js
@@ -0,0 +1,19 @@
+const bcrypt = require('bcryptjs');
+const User = require('../models/User');
+const generateToken = require('../utils/generateToken');
+
+exports.register = async (req, res) => {
+  const { username, email, password } = req.body;
+  const hashed = await bcrypt.hash(password, 10);
+  const user = await User.create({ username, email, password: hashed });
+  const token = generateToken({ id: user._id, role: user.role });
+  res.json({ user, token });
+};
+
+exports.login = async (req, res) => {
+  const { email, password } = req.body;
+  const user = await User.findOne({ email });
+  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid credentials' });
+  const token = generateToken({ id: user._id, role: user.role });
+  res.json({ user, token });
+};
diff --git a/backend/src/controllers/orderController.js b/backend/src/controllers/orderController.js
new file mode 100644
index 0000000000000000000000000000000000000000..cf8175f2fe6f83395ed761cfc671e3664f00d019
--- /dev/null
+++ b/backend/src/controllers/orderController.js
@@ -0,0 +1,16 @@
+const Order = require('../models/Order');
+
+exports.getRecentOrders = async (req, res) => {
+  const orders = await Order.find({ paymentStatus: 'paid' }).sort({ createdAt: -1 }).limit(8);
+  res.json(orders.map((o) => ({ _id: o._id, playerName: o.playerName, productName: o.items[0]?.name, total: o.total })));
+};
+
+exports.getMyOrders = async (req, res) => {
+  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
+  res.json(orders);
+};
+
+exports.getAllOrders = async (req, res) => {
+  const orders = await Order.find().sort({ createdAt: -1 });
+  res.json(orders);
+};
diff --git a/backend/src/controllers/paymentController.js b/backend/src/controllers/paymentController.js
new file mode 100644
index 0000000000000000000000000000000000000000..2ce317dfd3f1182501a9959343a9d36f72f3e61a
--- /dev/null
+++ b/backend/src/controllers/paymentController.js
@@ -0,0 +1,78 @@
+const axios = require('axios');
+const { validationResult } = require('express-validator');
+const DiscountCode = require('../models/DiscountCode');
+const Order = require('../models/Order');
+const Product = require('../models/Product');
+const { createStripeSession, stripe } = require('../services/paymentService');
+const { executeOrderCommands } = require('../services/minecraftService');
+
+exports.validateMojangUsername = async (req, res) => {
+  const { username } = req.params;
+  try {
+    await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
+    res.json({ valid: true });
+  } catch {
+    res.json({ valid: false });
+  }
+};
+
+exports.createSession = async (req, res) => {
+  const errors = validationResult(req);
+  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
+
+  const { items, playerName, paymentMethod, discountCode } = req.body;
+  const products = await Product.find({ _id: { $in: items.map((i) => i._id) } });
+
+  const normalizedItems = items.map((cartItem) => {
+    const dbItem = products.find((p) => String(p._id) === String(cartItem._id));
+    return {
+      productId: dbItem._id,
+      name: dbItem.name,
+      price: dbItem.price,
+      quantity: cartItem.quantity,
+      commands: dbItem.commands
+    };
+  });
+
+  const subtotal = normalizedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
+  let discountAmount = 0;
+  if (discountCode) {
+    const code = await DiscountCode.findOne({ code: discountCode.toUpperCase(), active: true });
+    if (code) discountAmount = subtotal * (code.percentage / 100);
+  }
+
+  const order = await Order.create({
+    user: req.user?.id,
+    playerName,
+    items: normalizedItems,
+    subtotal,
+    discountCode,
+    discountAmount,
+    total: subtotal - discountAmount,
+    paymentMethod
+  });
+
+  if (paymentMethod === 'stripe') {
+    const session = await createStripeSession(order);
+    return res.json({ provider: 'stripe', url: session.url, orderId: order._id });
+  }
+
+  return res.json({ provider: 'paypal', orderId: order._id, message: 'Create PayPal order on client or via dedicated endpoint.' });
+};
+
+exports.stripeWebhook = async (req, res) => {
+  const sig = req.headers['stripe-signature'];
+  const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
+
+  if (event.type === 'checkout.session.completed') {
+    const session = event.data.object;
+    const order = await Order.findById(session.metadata.orderId);
+    if (order && order.paymentStatus !== 'paid') {
+      order.paymentStatus = 'paid';
+      await order.save();
+      executeOrderCommands(order);
+    }
+  }
+
+  res.json({ received: true });
+};
diff --git a/backend/src/controllers/productController.js b/backend/src/controllers/productController.js
new file mode 100644
index 0000000000000000000000000000000000000000..7dd52850b9df13eec5d098a668d33b771323fe6a
--- /dev/null
+++ b/backend/src/controllers/productController.js
@@ -0,0 +1,14 @@
+const Product = require('../models/Product');
+
+exports.getProducts = async (req, res) => {
+  const filter = req.query.category ? { category: req.query.category } : {};
+  const products = await Product.find(filter);
+  res.json(products);
+};
+
+exports.createProduct = async (req, res) => res.status(201).json(await Product.create(req.body));
+exports.updateProduct = async (req, res) => res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }));
+exports.deleteProduct = async (req, res) => {
+  await Product.findByIdAndDelete(req.params.id);
+  res.json({ ok: true });
+};
diff --git a/backend/src/controllers/serverController.js b/backend/src/controllers/serverController.js
new file mode 100644
index 0000000000000000000000000000000000000000..aec46438f1f2f0bb59182c4e5d949073af6450d4
--- /dev/null
+++ b/backend/src/controllers/serverController.js
@@ -0,0 +1,18 @@
+const axios = require('axios');
+
+exports.status = async (req, res) => {
+  try {
+    const { data } = await axios.get(`https://api.mcsrvstat.us/2/${process.env.MC_SERVER_IP || 'mc.stormhaven.fun'}`);
+    res.json({ online: data.online, players: data.players?.online || 0, max: data.players?.max || 0 });
+  } catch {
+    res.json({ online: false, players: 0, max: 0 });
+  }
+};
+
+exports.leaderboard = async (req, res) => {
+  res.json([
+    { player: 'Zephyr', value: 1200 },
+    { player: 'Aria', value: 1060 },
+    { player: 'Nova', value: 980 }
+  ]);
+};
diff --git a/backend/src/jobs/retryFailedCommands.js b/backend/src/jobs/retryFailedCommands.js
new file mode 100644
index 0000000000000000000000000000000000000000..6d09250b24a3191665ba8328f40e91895a62e1c8
--- /dev/null
+++ b/backend/src/jobs/retryFailedCommands.js
@@ -0,0 +1,9 @@
+const Order = require('../models/Order');
+const { executeOrderCommands } = require('../services/minecraftService');
+
+module.exports = async function retryFailedCommands() {
+  const pending = await Order.find({ paymentStatus: 'paid', commandStatus: { $ne: 'done' } }).limit(20);
+  for (const order of pending) {
+    await executeOrderCommands(order);
+  }
+};
diff --git a/backend/src/middleware/auth.js b/backend/src/middleware/auth.js
new file mode 100644
index 0000000000000000000000000000000000000000..52c870c2c6fd8ab143a914f1d9d7b7439a348776
--- /dev/null
+++ b/backend/src/middleware/auth.js
@@ -0,0 +1,17 @@
+const jwt = require('jsonwebtoken');
+
+exports.auth = (req, res, next) => {
+  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
+  if (!token) return res.status(401).json({ message: 'Unauthorized' });
+  try {
+    req.user = jwt.verify(token, process.env.JWT_SECRET);
+    next();
+  } catch {
+    res.status(401).json({ message: 'Invalid token' });
+  }
+};
+
+exports.admin = (req, res, next) => {
+  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
+  next();
+};
diff --git a/backend/src/middleware/errorHandler.js b/backend/src/middleware/errorHandler.js
new file mode 100644
index 0000000000000000000000000000000000000000..0c3ccacfd2c9865924ca1462ac9f7d92f40b7242
--- /dev/null
+++ b/backend/src/middleware/errorHandler.js
@@ -0,0 +1,4 @@
+module.exports = (err, req, res, next) => {
+  console.error(err);
+  res.status(500).json({ message: err.message || 'Server error' });
+};
diff --git a/backend/src/middleware/rateLimiter.js b/backend/src/middleware/rateLimiter.js
new file mode 100644
index 0000000000000000000000000000000000000000..92e3487641ef70f221bfab5f90ac7dff53a3f6ff
--- /dev/null
+++ b/backend/src/middleware/rateLimiter.js
@@ -0,0 +1,7 @@
+const rateLimit = require('express-rate-limit');
+
+module.exports = rateLimit({
+  windowMs: 60 * 1000,
+  max: 120,
+  message: 'Too many requests'
+});
diff --git a/backend/src/models/CommandLog.js b/backend/src/models/CommandLog.js
new file mode 100644
index 0000000000000000000000000000000000000000..418dd78d7e9a2ce2f93a54356364a3354a3fc335
--- /dev/null
+++ b/backend/src/models/CommandLog.js
@@ -0,0 +1,12 @@
+const mongoose = require('mongoose');
+
+const commandLogSchema = new mongoose.Schema({
+  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
+  playerName: String,
+  command: String,
+  status: { type: String, enum: ['success', 'failed'] },
+  response: String,
+  attempts: { type: Number, default: 1 }
+}, { timestamps: true });
+
+module.exports = mongoose.model('CommandLog', commandLogSchema);
diff --git a/backend/src/models/DiscountCode.js b/backend/src/models/DiscountCode.js
new file mode 100644
index 0000000000000000000000000000000000000000..8f733a04a6c57a7eebe231cb4853472e1ea6f70a
--- /dev/null
+++ b/backend/src/models/DiscountCode.js
@@ -0,0 +1,12 @@
+const mongoose = require('mongoose');
+
+const discountSchema = new mongoose.Schema({
+  code: { type: String, unique: true },
+  percentage: Number,
+  expiresAt: Date,
+  maxUses: Number,
+  used: { type: Number, default: 0 },
+  active: { type: Boolean, default: true }
+}, { timestamps: true });
+
+module.exports = mongoose.model('DiscountCode', discountSchema);
diff --git a/backend/src/models/Order.js b/backend/src/models/Order.js
new file mode 100644
index 0000000000000000000000000000000000000000..4ab7cbea1921304755c70bf912f2fc19b128310e
--- /dev/null
+++ b/backend/src/models/Order.js
@@ -0,0 +1,22 @@
+const mongoose = require('mongoose');
+
+const orderSchema = new mongoose.Schema({
+  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
+  playerName: String,
+  items: [{
+    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
+    name: String,
+    quantity: Number,
+    price: Number,
+    commands: [String]
+  }],
+  subtotal: Number,
+  discountCode: String,
+  discountAmount: Number,
+  total: Number,
+  paymentMethod: { type: String, enum: ['stripe', 'paypal'] },
+  paymentStatus: { type: String, default: 'pending' },
+  commandStatus: { type: String, default: 'pending' }
+}, { timestamps: true });
+
+module.exports = mongoose.model('Order', orderSchema);
diff --git a/backend/src/models/Product.js b/backend/src/models/Product.js
new file mode 100644
index 0000000000000000000000000000000000000000..d60c26d704c6f118496291258774758102189882
--- /dev/null
+++ b/backend/src/models/Product.js
@@ -0,0 +1,14 @@
+const mongoose = require('mongoose');
+
+const productSchema = new mongoose.Schema({
+  name: String,
+  category: { type: String, enum: ['rank', 'crate', 'bundle'] },
+  description: String,
+  image: String,
+  price: Number,
+  perks: [String],
+  commands: [String],
+  active: { type: Boolean, default: true }
+}, { timestamps: true });
+
+module.exports = mongoose.model('Product', productSchema);
diff --git a/backend/src/models/User.js b/backend/src/models/User.js
new file mode 100644
index 0000000000000000000000000000000000000000..14c2fb00a258abb15b0e43b83ade460d1ffb20a7
--- /dev/null
+++ b/backend/src/models/User.js
@@ -0,0 +1,11 @@
+const mongoose = require('mongoose');
+
+const userSchema = new mongoose.Schema({
+  username: { type: String, required: true, unique: true },
+  email: { type: String, required: true, unique: true },
+  password: { type: String, required: true },
+  purchasedRanks: [{ type: String }],
+  role: { type: String, enum: ['user', 'admin'], default: 'user' }
+}, { timestamps: true });
+
+module.exports = mongoose.model('User', userSchema);
diff --git a/backend/src/routes/adminRoutes.js b/backend/src/routes/adminRoutes.js
new file mode 100644
index 0000000000000000000000000000000000000000..751ede0e4ce0d55e06acdd631e142ff1bf984291
--- /dev/null
+++ b/backend/src/routes/adminRoutes.js
@@ -0,0 +1,10 @@
+const router = require('express').Router();
+const { stats, getDiscountCodes, createDiscountCode, deleteDiscountCode } = require('../controllers/adminController');
+const { auth, admin } = require('../middleware/auth');
+
+router.get('/stats', auth, admin, stats);
+router.get('/discount-codes', auth, admin, getDiscountCodes);
+router.post('/discount-codes', auth, admin, createDiscountCode);
+router.delete('/discount-codes/:id', auth, admin, deleteDiscountCode);
+
+module.exports = router;
diff --git a/backend/src/routes/authRoutes.js b/backend/src/routes/authRoutes.js
new file mode 100644
index 0000000000000000000000000000000000000000..82f8b3596c81441132898e73c260c29a43d95710
--- /dev/null
+++ b/backend/src/routes/authRoutes.js
@@ -0,0 +1,8 @@
+const router = require('express').Router();
+const { body } = require('express-validator');
+const { register, login } = require('../controllers/authController');
+
+router.post('/register', [body('email').isEmail(), body('password').isLength({ min: 6 })], register);
+router.post('/login', login);
+
+module.exports = router;
diff --git a/backend/src/routes/orderRoutes.js b/backend/src/routes/orderRoutes.js
new file mode 100644
index 0000000000000000000000000000000000000000..98d03862985f591d07a8650df5303bed5b33e077
--- /dev/null
+++ b/backend/src/routes/orderRoutes.js
@@ -0,0 +1,9 @@
+const router = require('express').Router();
+const { getRecentOrders, getMyOrders, getAllOrders } = require('../controllers/orderController');
+const { auth, admin } = require('../middleware/auth');
+
+router.get('/recent', getRecentOrders);
+router.get('/me', auth, getMyOrders);
+router.get('/', auth, admin, getAllOrders);
+
+module.exports = router;
diff --git a/backend/src/routes/paymentRoutes.js b/backend/src/routes/paymentRoutes.js
new file mode 100644
index 0000000000000000000000000000000000000000..4e13be8293686bc06b5540892339562c90463ef5
--- /dev/null
+++ b/backend/src/routes/paymentRoutes.js
@@ -0,0 +1,11 @@
+const router = require('express').Router();
+const { body } = require('express-validator');
+const { createSession, stripeWebhook, validateMojangUsername } = require('../controllers/paymentController');
+const { auth } = require('../middleware/auth');
+
+router.post('/create-session', [body('playerName').isLength({ min: 3, max: 16 }), body('items').isArray({ min: 1 })], createSession);
+router.post('/create-session-auth', auth, [body('playerName').isLength({ min: 3, max: 16 }), body('items').isArray({ min: 1 })], createSession);
+router.post('/webhook/stripe', stripeWebhook);
+router.get('/validate-username/:username', validateMojangUsername);
+
+module.exports = router;
diff --git a/backend/src/routes/productRoutes.js b/backend/src/routes/productRoutes.js
new file mode 100644
index 0000000000000000000000000000000000000000..0efd39a124f730bb3f7a120d33c36f46baf404bd
--- /dev/null
+++ b/backend/src/routes/productRoutes.js
@@ -0,0 +1,10 @@
+const router = require('express').Router();
+const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
+const { auth, admin } = require('../middleware/auth');
+
+router.get('/', getProducts);
+router.post('/', auth, admin, createProduct);
+router.put('/:id', auth, admin, updateProduct);
+router.delete('/:id', auth, admin, deleteProduct);
+
+module.exports = router;
diff --git a/backend/src/routes/serverRoutes.js b/backend/src/routes/serverRoutes.js
new file mode 100644
index 0000000000000000000000000000000000000000..a09cfdb7a9dee843f3bf2bc8ec2f5294be078e38
--- /dev/null
+++ b/backend/src/routes/serverRoutes.js
@@ -0,0 +1,7 @@
+const router = require('express').Router();
+const { status, leaderboard } = require('../controllers/serverController');
+
+router.get('/status', status);
+router.get('/leaderboard', leaderboard);
+
+module.exports = router;
diff --git a/backend/src/server.js b/backend/src/server.js
new file mode 100644
index 0000000000000000000000000000000000000000..c3144400444a481ba06e27cba613ce6d49787b04
--- /dev/null
+++ b/backend/src/server.js
@@ -0,0 +1,41 @@
+require('dotenv').config();
+const express = require('express');
+const cors = require('cors');
+const morgan = require('morgan');
+const cookieParser = require('cookie-parser');
+const connectDB = require('./config/db');
+const rateLimiter = require('./middleware/rateLimiter');
+const errorHandler = require('./middleware/errorHandler');
+
+const authRoutes = require('./routes/authRoutes');
+const productRoutes = require('./routes/productRoutes');
+const orderRoutes = require('./routes/orderRoutes');
+const paymentRoutes = require('./routes/paymentRoutes');
+const adminRoutes = require('./routes/adminRoutes');
+const serverRoutes = require('./routes/serverRoutes');
+const retryFailedCommands = require('./jobs/retryFailedCommands');
+
+const app = express();
+connectDB();
+
+app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
+app.use('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }));
+app.use(express.json());
+app.use(cookieParser());
+app.use(morgan('dev'));
+app.use(rateLimiter);
+
+app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
+app.use('/api/auth', authRoutes);
+app.use('/api/products', productRoutes);
+app.use('/api/orders', orderRoutes);
+app.use('/api/payments', paymentRoutes);
+app.use('/api/admin', adminRoutes);
+app.use('/api/server', serverRoutes);
+
+app.use(errorHandler);
+
+setInterval(() => retryFailedCommands().catch(console.error), 60_000);
+
+const PORT = process.env.PORT || 5000;
+app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
diff --git a/backend/src/services/minecraftService.js b/backend/src/services/minecraftService.js
new file mode 100644
index 0000000000000000000000000000000000000000..ea28685d285a032001ed0938a2d62d5090f8c95f
--- /dev/null
+++ b/backend/src/services/minecraftService.js
@@ -0,0 +1,31 @@
+const Rcon = require('node-rcon');
+const CommandLog = require('../models/CommandLog');
+
+async function runCommand(command) {
+  return new Promise((resolve, reject) => {
+    const rcon = new Rcon(process.env.RCON_HOST, process.env.RCON_PORT, process.env.RCON_PASSWORD, { tcp: true, challenge: false });
+    rcon.on('auth', () => rcon.send(command));
+    rcon.on('response', (str) => { rcon.disconnect(); resolve(str); });
+    rcon.on('error', reject);
+    rcon.connect();
+  });
+}
+
+async function executeOrderCommands(order, retry = 0) {
+  for (const item of order.items) {
+    for (const cmd of item.commands) {
+      const command = cmd.replace('{player}', order.playerName);
+      try {
+        const response = await runCommand(command);
+        await CommandLog.create({ orderId: order._id, playerName: order.playerName, command, status: 'success', response, attempts: retry + 1 });
+      } catch (error) {
+        await CommandLog.create({ orderId: order._id, playerName: order.playerName, command, status: 'failed', response: error.message, attempts: retry + 1 });
+        if (retry < 3) {
+          setTimeout(() => executeOrderCommands(order, retry + 1), 10000);
+        }
+      }
+    }
+  }
+}
+
+module.exports = { executeOrderCommands };
diff --git a/backend/src/services/paymentService.js b/backend/src/services/paymentService.js
new file mode 100644
index 0000000000000000000000000000000000000000..0066159ec5c7d8056ef15de4e0fa4e77bc912ab0
--- /dev/null
+++ b/backend/src/services/paymentService.js
@@ -0,0 +1,30 @@
+const Stripe = require('stripe');
+const paypal = require('paypal-rest-sdk');
+
+const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
+
+paypal.configure({
+  mode: process.env.PAYPAL_MODE || 'sandbox',
+  client_id: process.env.PAYPAL_CLIENT_ID,
+  client_secret: process.env.PAYPAL_CLIENT_SECRET
+});
+
+async function createStripeSession(order) {
+  const session = await stripe.checkout.sessions.create({
+    mode: 'payment',
+    line_items: order.items.map((item) => ({
+      price_data: {
+        currency: 'usd',
+        product_data: { name: item.name },
+        unit_amount: Math.round(item.price * 100)
+      },
+      quantity: item.quantity
+    })),
+    success_url: `${process.env.FRONTEND_URL}/order-confirmation?orderId=${order._id}`,
+    cancel_url: `${process.env.FRONTEND_URL}/cart`,
+    metadata: { orderId: String(order._id) }
+  });
+  return session;
+}
+
+module.exports = { stripe, paypal, createStripeSession };
diff --git a/backend/src/utils/generateToken.js b/backend/src/utils/generateToken.js
new file mode 100644
index 0000000000000000000000000000000000000000..8deaadf01ddfe02b0f250936fed1a73519e36c4c
--- /dev/null
+++ b/backend/src/utils/generateToken.js
@@ -0,0 +1,3 @@
+const jwt = require('jsonwebtoken');
+
+module.exports = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
diff --git a/docker-compose.yml b/docker-compose.yml
new file mode 100644
index 0000000000000000000000000000000000000000..4082c36431812f991722d4d5942cb0dbbbbf5204
--- /dev/null
+++ b/docker-compose.yml
@@ -0,0 +1,11 @@
+version: '3.8'
+services:
+  mongo:
+    image: mongo:7
+    restart: unless-stopped
+    ports:
+      - '27017:27017'
+    volumes:
+      - mongo_data:/data/db
+volumes:
+  mongo_data:
diff --git a/frontend/.env.example b/frontend/.env.example
new file mode 100644
index 0000000000000000000000000000000000000000..6ba237a45d856c680f1da017483a00a6e7ff423d
--- /dev/null
+++ b/frontend/.env.example
@@ -0,0 +1,4 @@
+NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
+NEXT_PUBLIC_DISCORD_INVITE=https://discord.gg/stormhaven
+NEXT_PUBLIC_SERVER_IP=mc.stormhaven.fun
+NEXT_PUBLIC_SERVER_NAME=Stormhaven
diff --git a/frontend/app/account/login/page.tsx b/frontend/app/account/login/page.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..aa036cdac00b875def6a171e5f19a9eecb40b909
--- /dev/null
+++ b/frontend/app/account/login/page.tsx
@@ -0,0 +1,17 @@
+'use client';
+
+import { api } from '@/lib/api';
+import { useState } from 'react';
+
+export default function LoginPage() {
+  const [email, setEmail] = useState('');
+  const [password, setPassword] = useState('');
+  return (
+    <div className="panel mx-auto max-w-md space-y-3">
+      <h1 className="text-3xl font-black">Login</h1>
+      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded bg-zinc-900 p-3" />
+      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded bg-zinc-900 p-3" />
+      <button onClick={() => api.post('/auth/login', { email, password })} className="rounded bg-emerald-500 px-4 py-2 font-semibold text-black">Login</button>
+    </div>
+  );
+}
diff --git a/frontend/app/account/orders/page.tsx b/frontend/app/account/orders/page.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..d9ee7c1267eb3e6f112d2d1af243da9d3130b913
--- /dev/null
+++ b/frontend/app/account/orders/page.tsx
@@ -0,0 +1,18 @@
+'use client';
+
+import useSWR from 'swr';
+import { api } from '@/lib/api';
+
+const fetcher = (url: string) => api.get(url).then((res) => res.data);
+
+export default function OrdersPage() {
+  const { data } = useSWR('/orders/me', fetcher);
+  return (
+    <div className="space-y-4">
+      <h1 className="text-4xl font-black">Order History</h1>
+      {data?.map((order: any) => (
+        <div key={order._id} className="panel">{order.items.map((i: any) => i.name).join(', ')} - ${order.total}</div>
+      ))}
+    </div>
+  );
+}
diff --git a/frontend/app/account/register/page.tsx b/frontend/app/account/register/page.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..6f0b7fa0fcba0c19e8f5c716b17e888140accabc
--- /dev/null
+++ b/frontend/app/account/register/page.tsx
@@ -0,0 +1,17 @@
+'use client';
+
+import { api } from '@/lib/api';
+import { useState } from 'react';
+
+export default function RegisterPage() {
+  const [form, setForm] = useState({ email: '', password: '', username: '' });
+  return (
+    <div className="panel mx-auto max-w-md space-y-3">
+      <h1 className="text-3xl font-black">Register</h1>
+      <input placeholder="Username" className="w-full rounded bg-zinc-900 p-3" onChange={(e) => setForm({ ...form, username: e.target.value })} />
+      <input placeholder="Email" className="w-full rounded bg-zinc-900 p-3" onChange={(e) => setForm({ ...form, email: e.target.value })} />
+      <input type="password" placeholder="Password" className="w-full rounded bg-zinc-900 p-3" onChange={(e) => setForm({ ...form, password: e.target.value })} />
+      <button onClick={() => api.post('/auth/register', form)} className="rounded bg-emerald-500 px-4 py-2 font-semibold text-black">Create account</button>
+    </div>
+  );
+}
diff --git a/frontend/app/admin/page.tsx b/frontend/app/admin/page.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..395bc8bb1ea95acfa638a8450c0bd77f73f55466
--- /dev/null
+++ b/frontend/app/admin/page.tsx
@@ -0,0 +1,20 @@
+'use client';
+
+import useSWR from 'swr';
+import { api } from '@/lib/api';
+
+const fetcher = (url: string) => api.get(url).then((res) => res.data);
+
+export default function AdminPage() {
+  const { data } = useSWR('/admin/stats', fetcher);
+  return (
+    <div className="space-y-4">
+      <h1 className="text-4xl font-black">Admin Dashboard</h1>
+      <div className="grid gap-4 md:grid-cols-3">
+        <div className="panel"><p>Revenue</p><p className="text-2xl text-emerald-400">${data?.revenue || 0}</p></div>
+        <div className="panel"><p>Orders</p><p className="text-2xl">{data?.orders || 0}</p></div>
+        <div className="panel"><p>Users</p><p className="text-2xl">{data?.users || 0}</p></div>
+      </div>
+    </div>
+  );
+}
diff --git a/frontend/app/cart/page.tsx b/frontend/app/cart/page.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..1d98b8d27759f8c3d9cb6a6b12966f61f2c86343
--- /dev/null
+++ b/frontend/app/cart/page.tsx
@@ -0,0 +1,37 @@
+'use client';
+
+import { useMemo, useState } from 'react';
+import { useCart } from '@/components/CartProvider';
+import Link from 'next/link';
+
+export default function CartPage() {
+  const { items, removeItem, setQuantity } = useCart();
+  const [discount, setDiscount] = useState('');
+  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items]);
+  const total = discount === 'STORM10' ? subtotal * 0.9 : subtotal;
+
+  return (
+    <div className="space-y-6">
+      <h1 className="text-4xl font-black">Cart</h1>
+      <div className="space-y-3">
+        {items.map((item) => (
+          <div key={item._id} className="panel flex items-center justify-between">
+            <div>
+              <p className="font-semibold">{item.name}</p>
+              <p className="text-sm text-zinc-400">${item.price} each</p>
+            </div>
+            <input type="number" min={1} value={item.quantity} onChange={(e) => setQuantity(item._id, Number(e.target.value))} className="w-20 rounded bg-zinc-900 p-2" />
+            <button onClick={() => removeItem(item._id)} className="text-red-400">Remove</button>
+          </div>
+        ))}
+      </div>
+      <div className="panel max-w-md space-y-3">
+        <input placeholder="Minecraft Username" className="w-full rounded bg-zinc-900 p-2" />
+        <input value={discount} onChange={(e) => setDiscount(e.target.value.toUpperCase())} placeholder="Discount code" className="w-full rounded bg-zinc-900 p-2" />
+        <p>Subtotal: ${subtotal.toFixed(2)}</p>
+        <p className="text-xl font-bold text-emerald-400">Total: ${total.toFixed(2)}</p>
+        <Link href="/checkout" className="inline-block rounded bg-emerald-500 px-4 py-2 font-semibold text-black">Checkout</Link>
+      </div>
+    </div>
+  );
+}
diff --git a/frontend/app/checkout/page.tsx b/frontend/app/checkout/page.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..990ceddd1468db7298979e6c73fe44b59bd2e56d
--- /dev/null
+++ b/frontend/app/checkout/page.tsx
@@ -0,0 +1,31 @@
+'use client';
+
+import { useCart } from '@/components/CartProvider';
+import { api } from '@/lib/api';
+import { useRouter } from 'next/navigation';
+import { useState } from 'react';
+
+export default function CheckoutPage() {
+  const { items, clear } = useCart();
+  const [playerName, setPlayerName] = useState('');
+  const [paymentMethod, setPaymentMethod] = useState('stripe');
+  const router = useRouter();
+
+  const pay = async () => {
+    const { data } = await api.post('/payments/create-session', { items, playerName, paymentMethod });
+    clear();
+    router.push(`/order-confirmation?orderId=${data.orderId}`);
+  };
+
+  return (
+    <div className="panel max-w-xl space-y-4">
+      <h1 className="text-3xl font-black">Checkout</h1>
+      <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Minecraft IGN" className="w-full rounded bg-zinc-900 p-3" />
+      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded bg-zinc-900 p-3">
+        <option value="stripe">Stripe</option>
+        <option value="paypal">PayPal</option>
+      </select>
+      <button onClick={pay} className="rounded bg-emerald-500 px-4 py-2 font-bold text-black">Pay Securely</button>
+    </div>
+  );
+}
diff --git a/frontend/app/crate-keys/page.tsx b/frontend/app/crate-keys/page.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..3015306f1f6f50d317acf797cf18640cd4a10dd2
--- /dev/null
+++ b/frontend/app/crate-keys/page.tsx
@@ -0,0 +1,22 @@
+'use client';
+
+import useSWR from 'swr';
+import { api } from '@/lib/api';
+import { ProductCard } from '@/components/ProductCard';
+import { useCart } from '@/components/CartProvider';
+
+const fetcher = (url: string) => api.get(url).then((res) => res.data);
+
+export default function CrateKeysPage() {
+  const { data } = useSWR('/products?category=crate', fetcher);
+  const { addItem } = useCart();
+
+  return (
+    <div>
+      <h1 className="mb-6 text-4xl font-black">Crate Keys</h1>
+      <div className="grid gap-4 md:grid-cols-2">
+        {data?.map((item: any) => <ProductCard key={item._id} product={item} onAdd={addItem} />)}
+      </div>
+    </div>
+  );
+}
diff --git a/frontend/app/globals.css b/frontend/app/globals.css
new file mode 100644
index 0000000000000000000000000000000000000000..0712cda2cad6503c8cbff1229f0ff393bc6b4762
--- /dev/null
+++ b/frontend/app/globals.css
@@ -0,0 +1,12 @@
+@tailwind base;
+@tailwind components;
+@tailwind utilities;
+
+body {
+  @apply bg-storm-900 text-zinc-100 antialiased;
+  background-image: radial-gradient(circle at top, rgba(16, 185, 129, 0.18), transparent 35%);
+}
+
+.panel {
+  @apply rounded-xl border border-emerald-500/20 bg-storm-800/80 backdrop-blur p-6 shadow-neon;
+}
diff --git a/frontend/app/layout.tsx b/frontend/app/layout.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..f8fcad71b0cf6b79e9704a6e3541e61e36accb06
--- /dev/null
+++ b/frontend/app/layout.tsx
@@ -0,0 +1,23 @@
+import './globals.css';
+import { Navbar } from '@/components/Navbar';
+import { Footer } from '@/components/Footer';
+import { CartProvider } from '@/components/CartProvider';
+
+export const metadata = {
+  title: 'Stormhaven Store',
+  description: 'Official Stormhaven Minecraft server store'
+};
+
+export default function RootLayout({ children }: { children: React.ReactNode }) {
+  return (
+    <html lang="en">
+      <body>
+        <CartProvider>
+          <Navbar />
+          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
+          <Footer />
+        </CartProvider>
+      </body>
+    </html>
+  );
+}
diff --git a/frontend/app/order-confirmation/page.tsx b/frontend/app/order-confirmation/page.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..0c11c558b41c45ea7aae76bc2123d916572f1d7d
--- /dev/null
+++ b/frontend/app/order-confirmation/page.tsx
@@ -0,0 +1,14 @@
+'use client';
+
+import { useSearchParams } from 'next/navigation';
+
+export default function OrderConfirmationPage() {
+  const params = useSearchParams();
+  return (
+    <div className="panel text-center">
+      <h1 className="text-4xl font-black text-emerald-400">Order Confirmed</h1>
+      <p className="mt-2">Thank you for supporting Stormhaven!</p>
+      <p className="mt-1 text-sm text-zinc-400">Order ID: {params.get('orderId')}</p>
+    </div>
+  );
+}
diff --git a/frontend/app/page.tsx b/frontend/app/page.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..e6a9d3dc8f2dfeb69d3ec364a4bef7704f5d25fb
--- /dev/null
+++ b/frontend/app/page.tsx
@@ -0,0 +1,42 @@
+'use client';
+
+import { Copy, Disc3 } from 'lucide-react';
+import useSWR from 'swr';
+import { api } from '@/lib/api';
+import Link from 'next/link';
+import { ServerStatus } from '@/components/ServerStatus';
+
+const fetcher = (url: string) => api.get(url).then((res) => res.data);
+
+export default function HomePage() {
+  const { data: purchases } = useSWR('/orders/recent', fetcher);
+  const ip = process.env.NEXT_PUBLIC_SERVER_IP || 'mc.stormhaven.fun';
+
+  return (
+    <div className="space-y-8">
+      <section className="panel overflow-hidden bg-[url('https://images.unsplash.com/photo-1580077873521-dc3860f5f4f0')] bg-cover bg-center">
+        <div className="bg-black/70 p-8">
+          <h1 className="text-5xl font-black">Stormhaven Store</h1>
+          <p className="mt-2 text-zinc-200">Premium ranks, crate keys, and bundles for the Stormhaven network.</p>
+          <div className="mt-5 flex flex-wrap gap-3">
+            <button onClick={() => navigator.clipboard.writeText(ip)} className="flex items-center gap-2 rounded-md border border-emerald-500/50 px-4 py-2 hover:bg-emerald-500/10">{ip} <Copy size={16} /></button>
+            <a href={process.env.NEXT_PUBLIC_DISCORD_INVITE || '#'} className="flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 font-semibold text-black"><Disc3 size={16}/> Join Discord</a>
+            <Link href="/store" className="rounded-md border border-zinc-600 px-4 py-2">Visit Store</Link>
+          </div>
+        </div>
+      </section>
+
+      <div className="grid gap-6 md:grid-cols-3">
+        <ServerStatus />
+        <div className="panel md:col-span-2">
+          <h2 className="text-xl font-bold">Recent Purchases</h2>
+          <div className="mt-4 space-y-2 text-sm">
+            {purchases?.map((entry: any) => (
+              <div key={entry._id} className="rounded border border-zinc-700 p-3">{entry.playerName} bought {entry.productName} • ${entry.total}</div>
+            )) || <p>No purchases yet.</p>}
+          </div>
+        </div>
+      </div>
+    </div>
+  );
+}
diff --git a/frontend/app/ranks/page.tsx b/frontend/app/ranks/page.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..59de70c5e8de607649a6a5a94a2203aad3752db2
--- /dev/null
+++ b/frontend/app/ranks/page.tsx
@@ -0,0 +1,32 @@
+'use client';
+
+import useSWR from 'swr';
+import { api } from '@/lib/api';
+import { useCart } from '@/components/CartProvider';
+
+const fetcher = (url: string) => api.get(url).then((res) => res.data);
+
+export default function RanksPage() {
+  const { data } = useSWR('/products?category=rank', fetcher);
+  const { addItem } = useCart();
+  return (
+    <div className="space-y-8">
+      <h1 className="text-4xl font-black">Ranks</h1>
+      <div className="panel overflow-x-auto">
+        <table className="w-full text-left text-sm">
+          <thead><tr><th>Rank</th><th>Price</th><th>Perks</th><th></th></tr></thead>
+          <tbody>
+            {data?.map((rank: any) => (
+              <tr key={rank._id} className="border-t border-zinc-700">
+                <td className="py-3 font-semibold uppercase">{rank.name}</td>
+                <td>${rank.price}</td>
+                <td>{rank.perks?.join(', ') || rank.description}</td>
+                <td><button onClick={() => addItem(rank)} className="rounded bg-emerald-500 px-3 py-1 font-semibold text-black">Buy</button></td>
+              </tr>
+            ))}
+          </tbody>
+        </table>
+      </div>
+    </div>
+  );
+}
diff --git a/frontend/app/store/page.tsx b/frontend/app/store/page.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..fb34e73ea6d404155eb2767fc279bf1e637d2a84
--- /dev/null
+++ b/frontend/app/store/page.tsx
@@ -0,0 +1,30 @@
+'use client';
+
+import useSWR from 'swr';
+import { api } from '@/lib/api';
+import { ProductCard } from '@/components/ProductCard';
+import { useCart } from '@/components/CartProvider';
+
+const fetcher = (url: string) => api.get(url).then((res) => res.data);
+
+export default function StorePage() {
+  const { data: products } = useSWR('/products', fetcher);
+  const { addItem } = useCart();
+  const categories = ['rank', 'crate', 'bundle'];
+
+  return (
+    <div className="space-y-8">
+      <h1 className="text-4xl font-black">Store</h1>
+      {categories.map((category) => (
+        <section key={category}>
+          <h2 className="mb-4 text-2xl font-bold capitalize">{category === 'crate' ? 'Crate Keys' : `${category}s`}</h2>
+          <div className="grid gap-4 md:grid-cols-3">
+            {products?.filter((p: any) => p.category === category).map((product: any) => (
+              <ProductCard key={product._id} product={product} onAdd={addItem} />
+            ))}
+          </div>
+        </section>
+      ))}
+    </div>
+  );
+}
diff --git a/frontend/components/CartProvider.tsx b/frontend/components/CartProvider.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..77ed0ea0675898f6efc00102e3c4ecb1796c115c
--- /dev/null
+++ b/frontend/components/CartProvider.tsx
@@ -0,0 +1,49 @@
+'use client';
+
+import { Product } from '@/lib/types';
+import { createContext, useContext, useEffect, useMemo, useState } from 'react';
+
+type CartItem = Product & { quantity: number };
+
+type CartCtx = {
+  items: CartItem[];
+  addItem: (product: Product) => void;
+  removeItem: (id: string) => void;
+  setQuantity: (id: string, quantity: number) => void;
+  clear: () => void;
+};
+
+const Context = createContext<CartCtx | null>(null);
+
+export function CartProvider({ children }: { children: React.ReactNode }) {
+  const [items, setItems] = useState<CartItem[]>([]);
+
+  useEffect(() => {
+    const raw = localStorage.getItem('stormhaven-cart');
+    if (raw) setItems(JSON.parse(raw));
+  }, []);
+
+  useEffect(() => {
+    localStorage.setItem('stormhaven-cart', JSON.stringify(items));
+  }, [items]);
+
+  const value = useMemo(() => ({
+    items,
+    addItem: (product: Product) => setItems((prev) => {
+      const existing = prev.find((item) => item._id === product._id);
+      if (existing) return prev.map((item) => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
+      return [...prev, { ...product, quantity: 1 }];
+    }),
+    removeItem: (id: string) => setItems((prev) => prev.filter((item) => item._id !== id)),
+    setQuantity: (id: string, quantity: number) => setItems((prev) => prev.map((item) => item._id === id ? { ...item, quantity: Math.max(1, quantity) } : item)),
+    clear: () => setItems([])
+  }), [items]);
+
+  return <Context.Provider value={value}>{children}</Context.Provider>;
+}
+
+export function useCart() {
+  const ctx = useContext(Context);
+  if (!ctx) throw new Error('useCart must be used inside CartProvider');
+  return ctx;
+}
diff --git a/frontend/components/Footer.tsx b/frontend/components/Footer.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..232856da8fdefba60608673cdb60bc4a4bdd88ef
--- /dev/null
+++ b/frontend/components/Footer.tsx
@@ -0,0 +1,7 @@
+export function Footer() {
+  return (
+    <footer className="mt-16 border-t border-emerald-500/20 py-8 text-center text-sm text-zinc-400">
+      <p>© {new Date().getFullYear()} Stormhaven Network • IP: mc.stormhaven.fun</p>
+    </footer>
+  );
+}
diff --git a/frontend/components/Navbar.tsx b/frontend/components/Navbar.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..6db4c079152c9c696d5970188a66c42b0a7842a0
--- /dev/null
+++ b/frontend/components/Navbar.tsx
@@ -0,0 +1,28 @@
+'use client';
+
+import Link from 'next/link';
+import { ShoppingCart } from 'lucide-react';
+
+const links = [
+  ['Store', '/store'],
+  ['Ranks', '/ranks'],
+  ['Crate Keys', '/crate-keys'],
+  ['Account', '/account/login'],
+  ['Admin', '/admin']
+];
+
+export function Navbar() {
+  return (
+    <header className="sticky top-0 z-40 border-b border-emerald-500/20 bg-storm-900/90 backdrop-blur">
+      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
+        <Link href="/" className="text-2xl font-black tracking-wide text-emerald-400">Stormhaven</Link>
+        <div className="flex items-center gap-4 text-sm">
+          {links.map(([label, href]) => (
+            <Link key={href} href={href} className="transition hover:text-emerald-300">{label}</Link>
+          ))}
+          <Link href="/cart" className="rounded-lg border border-emerald-500/30 p-2 hover:bg-emerald-500/10"><ShoppingCart size={18} /></Link>
+        </div>
+      </nav>
+    </header>
+  );
+}
diff --git a/frontend/components/ProductCard.tsx b/frontend/components/ProductCard.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..2a2cfacf4d7e30156865b94bc7b5910c8b4d7b80
--- /dev/null
+++ b/frontend/components/ProductCard.tsx
@@ -0,0 +1,18 @@
+'use client';
+
+import { Product } from '@/lib/types';
+import { motion } from 'framer-motion';
+
+export function ProductCard({ product, onAdd }: { product: Product; onAdd?: (product: Product) => void }) {
+  return (
+    <motion.div whileHover={{ y: -4 }} className="panel flex flex-col gap-4">
+      <img src={product.image} alt={product.name} className="h-36 w-full rounded-lg object-cover" />
+      <h3 className="text-xl font-bold">{product.name}</h3>
+      <p className="text-sm text-zinc-300">{product.description}</p>
+      <div className="mt-auto flex items-center justify-between">
+        <span className="text-lg font-semibold text-emerald-400">${product.price.toFixed(2)}</span>
+        <button onClick={() => onAdd?.(product)} className="rounded-md bg-emerald-500 px-4 py-2 font-semibold text-black transition hover:bg-emerald-400">Buy</button>
+      </div>
+    </motion.div>
+  );
+}
diff --git a/frontend/components/ServerStatus.tsx b/frontend/components/ServerStatus.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..ea1e14d7693e1964347bfadbf73732c0458e33d8
--- /dev/null
+++ b/frontend/components/ServerStatus.tsx
@@ -0,0 +1,18 @@
+'use client';
+
+import useSWR from 'swr';
+import { api } from '@/lib/api';
+
+const fetcher = (url: string) => api.get(url).then((res) => res.data);
+
+export function ServerStatus() {
+  const { data } = useSWR('/server/status', fetcher, { refreshInterval: 15000 });
+
+  return (
+    <div className="panel">
+      <p className="text-sm text-zinc-400">Server Status</p>
+      <p className="mt-1 text-2xl font-bold text-emerald-400">{data?.online ? 'Online' : 'Offline'}</p>
+      <p className="text-sm">Players: {data?.players ?? 0}</p>
+    </div>
+  );
+}
diff --git a/frontend/lib/api.ts b/frontend/lib/api.ts
new file mode 100644
index 0000000000000000000000000000000000000000..66eed78fb97c1a85d0d633f57b81527f199b8d79
--- /dev/null
+++ b/frontend/lib/api.ts
@@ -0,0 +1,6 @@
+import axios from 'axios';
+
+export const api = axios.create({
+  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
+  withCredentials: true
+});
diff --git a/frontend/lib/types.ts b/frontend/lib/types.ts
new file mode 100644
index 0000000000000000000000000000000000000000..76c29fad6483b7fa485591b305423cf0226cb64f
--- /dev/null
+++ b/frontend/lib/types.ts
@@ -0,0 +1,18 @@
+export type Product = {
+  _id: string;
+  name: string;
+  category: 'rank' | 'crate' | 'bundle';
+  description: string;
+  price: number;
+  image: string;
+  commands: string[];
+  perks?: string[];
+};
+
+export type Purchase = {
+  _id: string;
+  playerName: string;
+  productName: string;
+  total: number;
+  createdAt: string;
+};
diff --git a/frontend/next-env.d.ts b/frontend/next-env.d.ts
new file mode 100644
index 0000000000000000000000000000000000000000..84ab714bdef68903103f153806cfe168ecbb94f8
--- /dev/null
+++ b/frontend/next-env.d.ts
@@ -0,0 +1,4 @@
+/// <reference types="next" />
+/// <reference types="next/image-types/global" />
+
+// NOTE: This file should not be edited
diff --git a/frontend/next.config.mjs b/frontend/next.config.mjs
new file mode 100644
index 0000000000000000000000000000000000000000..bf455e30907b4b6ae60a6ccbfbaad08bb960aaba
--- /dev/null
+++ b/frontend/next.config.mjs
@@ -0,0 +1,12 @@
+/** @type {import('next').NextConfig} */
+const nextConfig = {
+  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
+  env: {
+    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
+    NEXT_PUBLIC_DISCORD_INVITE: process.env.NEXT_PUBLIC_DISCORD_INVITE,
+    NEXT_PUBLIC_SERVER_IP: process.env.NEXT_PUBLIC_SERVER_IP,
+    NEXT_PUBLIC_SERVER_NAME: process.env.NEXT_PUBLIC_SERVER_NAME
+  }
+};
+
+export default nextConfig;
diff --git a/frontend/package.json b/frontend/package.json
new file mode 100644
index 0000000000000000000000000000000000000000..31ef65874817ed2ccc4deae0e98ce6acd59c3d3c
--- /dev/null
+++ b/frontend/package.json
@@ -0,0 +1,30 @@
+{
+  "name": "stormhaven-frontend",
+  "version": "1.0.0",
+  "private": true,
+  "scripts": {
+    "dev": "next dev",
+    "build": "next build",
+    "start": "next start",
+    "lint": "next lint"
+  },
+  "dependencies": {
+    "axios": "^1.7.2",
+    "clsx": "^2.1.1",
+    "framer-motion": "^11.2.10",
+    "lucide-react": "^0.400.0",
+    "next": "14.2.4",
+    "react": "18.3.1",
+    "react-dom": "18.3.1",
+    "swr": "^2.2.5"
+  },
+  "devDependencies": {
+    "@types/node": "^20.14.8",
+    "@types/react": "^18.3.3",
+    "@types/react-dom": "^18.3.0",
+    "autoprefixer": "^10.4.19",
+    "postcss": "^8.4.39",
+    "tailwindcss": "^3.4.4",
+    "typescript": "^5.5.2"
+  }
+}
diff --git a/frontend/postcss.config.js b/frontend/postcss.config.js
new file mode 100644
index 0000000000000000000000000000000000000000..5cbc2c7d8770dd519eeb059f155ee14aa9dc811a
--- /dev/null
+++ b/frontend/postcss.config.js
@@ -0,0 +1,6 @@
+module.exports = {
+  plugins: {
+    tailwindcss: {},
+    autoprefixer: {}
+  }
+};
diff --git a/frontend/tailwind.config.ts b/frontend/tailwind.config.ts
new file mode 100644
index 0000000000000000000000000000000000000000..c66dcb3321407ece1c0402e912cb42d07f8e3081
--- /dev/null
+++ b/frontend/tailwind.config.ts
@@ -0,0 +1,24 @@
+import type { Config } from 'tailwindcss';
+
+const config: Config = {
+  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
+  theme: {
+    extend: {
+      colors: {
+        storm: {
+          900: '#050607',
+          800: '#0D0F11',
+          700: '#161A1D',
+          emerald: '#10B981',
+          glow: '#34D399'
+        }
+      },
+      boxShadow: {
+        neon: '0 0 25px rgba(52, 211, 153, 0.25)'
+      }
+    }
+  },
+  plugins: []
+};
+
+export default config;
diff --git a/frontend/tsconfig.json b/frontend/tsconfig.json
new file mode 100644
index 0000000000000000000000000000000000000000..8cc9c8600c2737e35f6db31af4f402fa57f1ec3e
--- /dev/null
+++ b/frontend/tsconfig.json
@@ -0,0 +1,22 @@
+{
+  "compilerOptions": {
+    "target": "es5",
+    "lib": ["dom", "dom.iterable", "esnext"],
+    "allowJs": false,
+    "skipLibCheck": true,
+    "strict": true,
+    "noEmit": true,
+    "esModuleInterop": true,
+    "module": "esnext",
+    "moduleResolution": "bundler",
+    "resolveJsonModule": true,
+    "isolatedModules": true,
+    "jsx": "preserve",
+    "incremental": true,
+    "plugins": [{ "name": "next" }],
+    "baseUrl": ".",
+    "paths": {"@/*": ["./*"]}
+  },
+  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
+  "exclude": ["node_modules"]
+}
 
EOF
)
