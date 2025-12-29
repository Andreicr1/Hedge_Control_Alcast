import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Supabase client with service role
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ========================================
// MIDDLEWARE: Auth verification
// ========================================
const requireAuth = async (c: any, next: any) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    console.log('Authorization error:', error);
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }

  c.set('user', data.user);
  c.set('userId', data.user.id);
  await next();
};

// ========================================
// HEALTH CHECK
// ========================================
app.get("/make-server-0c296f9f/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ========================================
// AUTH ENDPOINTS
// ========================================

// Sign up
app.post("/make-server-0c296f9f/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name || !role) {
      return c.json({ error: 'Missing required fields: email, password, name, role' }, 400);
    }

    // Validate role
    const validRoles = ['compras', 'vendas', 'financeiro', 'estoque', 'admin'];
    if (!validRoles.includes(role)) {
      return c.json({ error: 'Invalid role. Must be one of: ' + validRoles.join(', ') }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true, // Auto-confirm since no email server configured
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: `Failed to create user: ${error.message}` }, 400);
    }

    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name,
        role: data.user.user_metadata.role,
      }
    });
  } catch (err) {
    console.log('Signup exception:', err);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Get current user profile
app.get("/make-server-0c296f9f/auth/me", requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name,
    role: user.user_metadata?.role,
  });
});

// ========================================
// FORNECEDORES (Suppliers)
// ========================================

app.get("/make-server-0c296f9f/fornecedores", requireAuth, async (c) => {
  try {
    const fornecedores = await kv.getByPrefix('fornecedor:');
    return c.json({ fornecedores: fornecedores.map(f => JSON.parse(f)) });
  } catch (err) {
    console.log('Error fetching fornecedores:', err);
    return c.json({ error: 'Failed to fetch fornecedores' }, 500);
  }
});

app.post("/make-server-0c296f9f/fornecedores", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId');
    const fornecedor = {
      id: crypto.randomUUID(),
      ...body,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`fornecedor:${fornecedor.id}`, JSON.stringify(fornecedor));
    return c.json({ success: true, fornecedor });
  } catch (err) {
    console.log('Error creating fornecedor:', err);
    return c.json({ error: 'Failed to create fornecedor' }, 500);
  }
});

app.put("/make-server-0c296f9f/fornecedores/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const userId = c.get('userId');

    const existing = await kv.get(`fornecedor:${id}`);
    if (!existing) {
      return c.json({ error: 'Fornecedor not found' }, 404);
    }

    const fornecedor = {
      ...JSON.parse(existing),
      ...body,
      id, // Preserve ID
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`fornecedor:${id}`, JSON.stringify(fornecedor));
    return c.json({ success: true, fornecedor });
  } catch (err) {
    console.log('Error updating fornecedor:', err);
    return c.json({ error: 'Failed to update fornecedor' }, 500);
  }
});

app.delete("/make-server-0c296f9f/fornecedores/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`fornecedor:${id}`);
    return c.json({ success: true });
  } catch (err) {
    console.log('Error deleting fornecedor:', err);
    return c.json({ error: 'Failed to delete fornecedor' }, 500);
  }
});

// ========================================
// CLIENTES (Clients)
// ========================================

app.get("/make-server-0c296f9f/clientes", requireAuth, async (c) => {
  try {
    const clientes = await kv.getByPrefix('cliente:');
    return c.json({ clientes: clientes.map(cl => JSON.parse(cl)) });
  } catch (err) {
    console.log('Error fetching clientes:', err);
    return c.json({ error: 'Failed to fetch clientes' }, 500);
  }
});

app.post("/make-server-0c296f9f/clientes", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId');
    const cliente = {
      id: crypto.randomUUID(),
      ...body,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`cliente:${cliente.id}`, JSON.stringify(cliente));
    return c.json({ success: true, cliente });
  } catch (err) {
    console.log('Error creating cliente:', err);
    return c.json({ error: 'Failed to create cliente' }, 500);
  }
});

// ========================================
// CONTRAPARTES (Counterparties - Banks/Brokers)
// ========================================

app.get("/make-server-0c296f9f/contrapartes", requireAuth, async (c) => {
  try {
    const contrapartes = await kv.getByPrefix('contraparte:');
    return c.json({ contrapartes: contrapartes.map(cp => JSON.parse(cp)) });
  } catch (err) {
    console.log('Error fetching contrapartes:', err);
    return c.json({ error: 'Failed to fetch contrapartes' }, 500);
  }
});

app.post("/make-server-0c296f9f/contrapartes", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId');
    const contraparte = {
      id: crypto.randomUUID(),
      ...body,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`contraparte:${contraparte.id}`, JSON.stringify(contraparte));
    return c.json({ success: true, contraparte });
  } catch (err) {
    console.log('Error creating contraparte:', err);
    return c.json({ error: 'Failed to create contraparte' }, 500);
  }
});

// ========================================
// PURCHASE ORDERS (POs)
// ========================================

app.get("/make-server-0c296f9f/pos", requireAuth, async (c) => {
  try {
    const pos = await kv.getByPrefix('po:');
    return c.json({ pos: pos.map(p => JSON.parse(p)) });
  } catch (err) {
    console.log('Error fetching POs:', err);
    return c.json({ error: 'Failed to fetch POs' }, 500);
  }
});

app.post("/make-server-0c296f9f/pos", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId');
    const po = {
      id: crypto.randomUUID(),
      ...body,
      status: body.status || 'draft',
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`po:${po.id}`, JSON.stringify(po));
    return c.json({ success: true, po });
  } catch (err) {
    console.log('Error creating PO:', err);
    return c.json({ error: 'Failed to create PO' }, 500);
  }
});

// ========================================
// SALES ORDERS (SOs)
// ========================================

app.get("/make-server-0c296f9f/sos", requireAuth, async (c) => {
  try {
    const sos = await kv.getByPrefix('so:');
    return c.json({ sos: sos.map(s => JSON.parse(s)) });
  } catch (err) {
    console.log('Error fetching SOs:', err);
    return c.json({ error: 'Failed to fetch SOs' }, 500);
  }
});

app.post("/make-server-0c296f9f/sos", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId');
    const so = {
      id: crypto.randomUUID(),
      ...body,
      status: body.status || 'draft',
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`so:${so.id}`, JSON.stringify(so));
    return c.json({ success: true, so });
  } catch (err) {
    console.log('Error creating SO:', err);
    return c.json({ error: 'Failed to create SO' }, 500);
  }
});

// ========================================
// RFQs (Request for Quotes)
// ========================================

app.get("/make-server-0c296f9f/rfqs", requireAuth, async (c) => {
  try {
    const rfqs = await kv.getByPrefix('rfq:');
    return c.json({ rfqs: rfqs.map(r => JSON.parse(r)) });
  } catch (err) {
    console.log('Error fetching RFQs:', err);
    return c.json({ error: 'Failed to fetch RFQs' }, 500);
  }
});

app.post("/make-server-0c296f9f/rfqs", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId');
    const rfq = {
      id: crypto.randomUUID(),
      ...body,
      status: body.status || 'pending',
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`rfq:${rfq.id}`, JSON.stringify(rfq));
    return c.json({ success: true, rfq });
  } catch (err) {
    console.log('Error creating RFQ:', err);
    return c.json({ error: 'Failed to create RFQ' }, 500);
  }
});

// ========================================
// MTM (Mark-to-Market) - Cálculos de hedge
// ========================================

app.get("/make-server-0c296f9f/mtm", requireAuth, async (c) => {
  try {
    const mtmData = await kv.getByPrefix('mtm:');
    return c.json({ mtm: mtmData.map(m => JSON.parse(m)) });
  } catch (err) {
    console.log('Error fetching MTM:', err);
    return c.json({ error: 'Failed to fetch MTM data' }, 500);
  }
});

// Calculate MTM for positions
app.post("/make-server-0c296f9f/mtm/calculate", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const { positions, currentPrice } = body;

    if (!positions || !currentPrice) {
      return c.json({ error: 'Missing positions or currentPrice' }, 400);
    }

    // MTM Calculation logic (ultra-professional)
    const results = positions.map((pos: any) => {
      const entryValue = pos.quantity * pos.entryPrice;
      const currentValue = pos.quantity * currentPrice;
      const pnl = currentValue - entryValue;
      const pnlPercent = (pnl / entryValue) * 100;

      return {
        positionId: pos.id,
        entryPrice: pos.entryPrice,
        currentPrice,
        quantity: pos.quantity,
        entryValue,
        currentValue,
        pnl,
        pnlPercent: parseFloat(pnlPercent.toFixed(4)),
        timestamp: new Date().toISOString(),
      };
    });

    // Store MTM results
    const mtmId = crypto.randomUUID();
    await kv.set(`mtm:${mtmId}`, JSON.stringify({
      id: mtmId,
      results,
      calculatedAt: new Date().toISOString(),
    }));

    return c.json({ success: true, results });
  } catch (err) {
    console.log('Error calculating MTM:', err);
    return c.json({ error: 'Failed to calculate MTM' }, 500);
  }
});

// ========================================
// ESTOQUE (Inventory)
// ========================================

app.get("/make-server-0c296f9f/estoque", requireAuth, async (c) => {
  try {
    const estoque = await kv.getByPrefix('estoque:');
    return c.json({ estoque: estoque.map(e => JSON.parse(e)) });
  } catch (err) {
    console.log('Error fetching estoque:', err);
    return c.json({ error: 'Failed to fetch estoque' }, 500);
  }
});

app.post("/make-server-0c296f9f/estoque/movement", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId');
    const movement = {
      id: crypto.randomUUID(),
      ...body,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`estoque:movement:${movement.id}`, JSON.stringify(movement));

    // Update inventory balance
    const itemKey = `estoque:balance:${body.itemId}`;
    const currentBalance = await kv.get(itemKey);
    const balance = currentBalance ? JSON.parse(currentBalance) : { quantity: 0 };
    
    if (body.type === 'in') {
      balance.quantity += body.quantity;
    } else if (body.type === 'out') {
      balance.quantity -= body.quantity;
    }

    await kv.set(itemKey, JSON.stringify(balance));

    return c.json({ success: true, movement, balance });
  } catch (err) {
    console.log('Error recording estoque movement:', err);
    return c.json({ error: 'Failed to record movement' }, 500);
  }
});

Deno.serve(app.fetch);