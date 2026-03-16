import express from "express";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // MySQL Connection Pool
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'msdw_holdings',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // API Routes
  app.get("/api/health", async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT 1 + 1 AS solution');
      res.json({ status: "ok", database: "connected", solution: (rows as any)[0].solution });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  // Example API route to get products
  app.get("/api/products", async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM products');
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const { name, description, price, category, stock, image } = req.body;
      const [result] = await pool.query(
        'INSERT INTO products (name, description, price, category, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [name, description, price, category, stock, image]
      );
      res.json({ id: (result as any).insertId, ...req.body });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT id, name, email, role FROM users');
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, password, role || 'user']
      );
      res.json({ id: String((result as any).insertId), name, email, role });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM service_bookings');
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const { user_id, service_type, details, booking_date } = req.body;
      const safeServiceType = ['Construction', 'Logistics', 'Cleaning'].includes(service_type) ? service_type : 'Construction';
      const [result] = await pool.query(
        'INSERT INTO service_bookings (user_id, service_type, details, booking_date) VALUES (?, ?, ?, ?)',
        [user_id || null, safeServiceType, JSON.stringify(details), booking_date || new Date().toISOString().slice(0, 19).replace('T', ' ')]
      );
      res.json({ id: String((result as any).insertId), ...req.body });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/bookings/:id", async (req, res) => {
    try {
      const { status } = req.body;
      await pool.query('UPDATE service_bookings SET status = ? WHERE id = ?', [status, req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM orders');
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { user_id, total_amount, payment_reference, status, items } = req.body;
      
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [orderResult] = await connection.query(
          'INSERT INTO orders (user_id, total_amount, payment_reference, status) VALUES (?, ?, ?, ?)',
          [user_id || null, total_amount, payment_reference || `REF-${Date.now()}`, status || 'Pending']
        );
        const orderId = (orderResult as any).insertId;
        
        if (items && Array.isArray(items)) {
          for (const item of items) {
            await connection.query(
              'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
              [orderId, item.product?.id || null, item.quantity, item.product?.price || 0]
            );
          }
        }
        
        await connection.commit();
        res.json({ id: String(orderId), ...req.body });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const { status } = req.body;
      await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
