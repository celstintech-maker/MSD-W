import express from "express";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

let initError: any = null;

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

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        stock INT DEFAULT 0,
        image_url LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure image_url is LONGTEXT if it was previously created as TEXT
    try {
      await pool.query('ALTER TABLE products MODIFY COLUMN image_url LONGTEXT');
    } catch (e) {
      console.log('Could not modify image_url column, it might already be LONGTEXT');
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        wishlist LONGTEXT,
        cart LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await pool.query('ALTER TABLE users ADD COLUMN wishlist LONGTEXT');
    } catch (e) {
      console.log('Could not add wishlist column, it might already exist');
    }

    try {
      await pool.query('ALTER TABLE users ADD COLUMN cart LONGTEXT');
    } catch (e) {
      console.log('Could not add cart column, it might already exist');
    }

    try {
      await pool.query('ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE');
      await pool.query('ALTER TABLE users ADD COLUMN verification_token VARCHAR(255)');
      await pool.query('ALTER TABLE users ADD COLUMN reset_token VARCHAR(255)');
    } catch (e) {
      console.log('Could not add verification columns, they might already exist');
    }

    await pool.query(`
      INSERT IGNORE INTO users (name, email, password, role, is_verified) 
      VALUES ('System Admin', 'info@msdw.com', 'admin', 'admin', TRUE)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        service_type VARCHAR(100) NOT NULL,
        booking_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        payment_reference VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT PRIMARY KEY,
        site_config LONGTEXT,
        email_settings LONGTEXT,
        chat_settings LONGTEXT
      )
    `);

    try {
      await pool.query('ALTER TABLE site_settings MODIFY COLUMN site_config LONGTEXT');
      await pool.query('ALTER TABLE site_settings MODIFY COLUMN email_settings LONGTEXT');
      await pool.query('ALTER TABLE site_settings MODIFY COLUMN chat_settings LONGTEXT');
    } catch (e) {
      console.log('Could not modify site_settings columns, they might already be LONGTEXT');
    }

    await pool.query(`
      INSERT IGNORE INTO site_settings (id, site_config, email_settings, chat_settings) 
      VALUES (1, '{}', '{}', '{}')
    `);

    console.log("Database tables initialized successfully.");
  } catch (error) {
    initError = error;
    console.error("Failed to initialize database tables:", error);
  }
}

async function startServer() {
  await initDB();
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.get("/api/settings", async (req, res) => {
    try {
      const [rows]: any = await pool.query('SELECT * FROM site_settings WHERE id = 1');
      if (rows.length > 0) {
        res.json({
          siteConfig: JSON.parse(rows[0].site_config || '{}'),
          emailSettings: JSON.parse(rows[0].email_settings || '{}'),
          chatSettings: JSON.parse(rows[0].chat_settings || '{}')
        });
      } else {
        res.json({});
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/settings/config", async (req, res) => {
    try {
      await pool.query('UPDATE site_settings SET site_config = ? WHERE id = 1', [JSON.stringify(req.body)]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/settings/email", async (req, res) => {
    try {
      await pool.query('UPDATE site_settings SET email_settings = ? WHERE id = 1', [JSON.stringify(req.body)]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/settings/chat", async (req, res) => {
    try {
      await pool.query('UPDATE site_settings SET chat_settings = ? WHERE id = 1', [JSON.stringify(req.body)]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, body } = req.body;
      
      const [rows]: any = await pool.query('SELECT email_settings FROM site_settings WHERE id = 1');
      if (rows.length === 0) {
        return res.status(500).json({ error: "Email settings not configured" });
      }

      const settings = JSON.parse(rows[0].email_settings || '{}');
      
      if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPort) {
        return res.status(500).json({ error: "Incomplete email settings" });
      }

      // We need the password from env or settings. Since settings might not store password securely,
      // we'll assume it's in env or we can add it to settings. For now, let's use env if available,
      // or if they saved it in settings (though the frontend doesn't have a password field).
      // Let's check if there's a password field in EmailSettings.
      // Wait, the frontend didn't have a password field. Let's use process.env.SMTP_PASSWORD
      
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: parseInt(settings.smtpPort, 10),
        secure: parseInt(settings.smtpPort, 10) === 465,
        auth: {
          user: settings.smtpUser,
          pass: process.env.SMTP_PASSWORD || settings.smtpPassword || ''
        }
      });

      await transporter.sendMail({
        from: `"${settings.senderName || 'MSD&W'}" <${settings.smtpUser}>`,
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>')
      });

      res.json({ success: true });
    } catch (e: any) {
      console.error("Email send error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/debug", (req, res) => {
    res.json({
      host: process.env.DB_HOST ? process.env.DB_HOST.substring(0, 3) + '...' : 'MISSING',
      user: process.env.DB_USER ? process.env.DB_USER.substring(0, 3) + '...' : 'MISSING',
      db: process.env.DB_NAME ? process.env.DB_NAME.substring(0, 3) + '...' : 'MISSING',
      hasPassword: !!process.env.DB_PASSWORD,
      initError: initError ? initError.message : null
    });
  });

  app.get("/api/debug/schema", async (req, res) => {
    try {
      const [rows] = await pool.query('DESCRIBE products');
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/debug/tables", async (req, res) => {
    try {
      const [rows] = await pool.query('SHOW TABLES');
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

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
      const [rows] = await pool.query('SELECT id, name, email, role, wishlist, cart, is_verified as isVerified, verification_token as verificationToken, reset_token as resetToken FROM users');
      const formattedRows = (rows as any[]).map(row => ({
        ...row,
        isVerified: !!row.isVerified
      }));
      res.json(formattedRows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/debug/users-schema", async (req, res) => {
    try {
      const [rows] = await pool.query('DESCRIBE users');
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/debug/site-settings-schema", async (req, res) => {
    try {
      const [rows] = await pool.query('DESCRIBE site_settings');
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { name, email, password, role, isVerified } = req.body;
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password, role, wishlist, cart, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, password, role || 'user', '[]', '[]', isVerified ? 1 : 0]
      );
      res.json({ id: String((result as any).insertId), name, email, role, wishlist: '[]', cart: '[]', isVerified: isVerified ? true : false });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const [rows]: any = await pool.query('SELECT id, name, email, role, wishlist, cart, is_verified as isVerified FROM users WHERE email = ? AND password = ?', [email, password]);
      if (rows.length > 0) {
        const user = { ...rows[0], isVerified: !!rows[0].isVerified };
        res.json(user);
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/users/:id/wishlist", async (req, res) => {
    try {
      const { wishlist } = req.body;
      await pool.query('UPDATE users SET wishlist = ? WHERE id = ?', [JSON.stringify(wishlist), req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/users/:id/cart", async (req, res) => {
    try {
      const { cart } = req.body;
      await pool.query('UPDATE users SET cart = ? WHERE id = ?', [JSON.stringify(cart), req.params.id]);
      res.json({ success: true });
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
