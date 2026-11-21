import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'helzerx.db');
export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      status TEXT NOT NULL DEFAULT 'active',
      email_verified INTEGER NOT NULL DEFAULT 0,
      verification_token TEXT,
      reset_token TEXT,
      avatar_url TEXT DEFAULT '',
      notify_email INTEGER NOT NULL DEFAULT 1,
      notify_security INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hosting_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      cpu TEXT NOT NULL,
      ram_gb INTEGER NOT NULL,
      storage_gb INTEGER NOT NULL,
      network TEXT NOT NULL,
      price_monthly_usd REAL NOT NULL,
      hzl_cost INTEGER NOT NULL,
      location TEXT NOT NULL,
      features_json TEXT NOT NULL,
      available INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cloud_servers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      name TEXT NOT NULL,
      node_name TEXT NOT NULL,
      pterodactyl_id INTEGER,
      pterodactyl_identifier TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending_provisioning',
      location TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES hosting_plans(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price_usd REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      image_url TEXT NOT NULL,
      badge TEXT DEFAULT '',
      summary TEXT NOT NULL,
      specs_json TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      discount_percent INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      max_uses INTEGER NOT NULL DEFAULT 100,
      used_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      subtotal_usd REAL NOT NULL,
      discount_usd REAL NOT NULL DEFAULT 0,
      total_usd REAL NOT NULL,
      coupon_code TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending_payment',
      payment_provider TEXT NOT NULL DEFAULT 'unconfigured',
      payment_status TEXT NOT NULL DEFAULT 'awaiting_payment',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_usd REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_id TEXT,
      invoice_number TEXT NOT NULL UNIQUE,
      amount_usd REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid',
      issued_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS studio_projects (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      service_type TEXT NOT NULL,
      title TEXT NOT NULL,
      budget_range TEXT NOT NULL,
      timeline TEXT NOT NULL,
      brief TEXT NOT NULL,
      attachment_name TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'submitted',
      admin_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS studio_messages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES studio_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS partners (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      website TEXT DEFAULT '',
      audience_summary TEXT NOT NULL,
      referral_code TEXT NOT NULL UNIQUE,
      commission_rate INTEGER NOT NULL DEFAULT 15,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      partner_id TEXT NOT NULL,
      referred_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      commission_usd REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS career_applications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      position_id TEXT NOT NULL,
      position_title TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      email TEXT NOT NULL,
      portfolio_url TEXT DEFAULT '',
      cover_note TEXT NOT NULL,
      attachment_name TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'received',
      reviewer_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_replies (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      body TEXT NOT NULL,
      attachment_name TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      author_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      featured INTEGER NOT NULL DEFAULT 0,
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'launch',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS launch_campaign (
      id TEXT PRIMARY KEY,
      launch_date TEXT NOT NULL,
      base_preorders INTEGER NOT NULL DEFAULT 47,
      early_access_limit INTEGER NOT NULL DEFAULT 50,
      announcement_text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS early_access_registrations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      use_case TEXT NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 0,
      accepted_terms INTEGER NOT NULL DEFAULT 0,
      eligibility_status TEXT NOT NULL DEFAULT 'pending_verification',
      slot_number INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_inquiries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT DEFAULT '',
      scope TEXT NOT NULL,
      brief TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);

  seedInitialData();
}

function seedInitialData(): void {
  const now = new Date().toISOString();

  const planCount = db.prepare('SELECT COUNT(*) as c FROM hosting_plans').get() as { c: number };
  if (planCount.c === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO hosting_plans (id, name, category, cpu, ram_gb, storage_gb, network, price_monthly_usd, hzl_cost, location, features_json, available, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const plans = [
      [
        'plan_mc_core',
        'MC Pterodactyl Core',
        'Minecraft',
        '4 vCPU AMD EPYC',
        8,
        45,
        '10 Gbps DDoS Protected',
        12.0,
        400,
        'Singapore · sn1.helzerx.cyou',
        JSON.stringify(['Paper / Purpur / Fabric', 'Automated Off-Node Backups', 'SFTP & Subuser Controls', 'Instant Pterodactyl Panel']),
        1,
        1,
      ],
      [
        'plan_mc_titan',
        'MC Network Pro',
        'Minecraft',
        '8 vCPU Ryzen 9 7950X',
        16,
        120,
        '10 Gbps Unmetered',
        26.0,
        900,
        'Singapore · sn1.helzerx.cyou',
        JSON.stringify(['Dedicated Proxy Port 25565', 'BungeeCord / Velocity Ready', 'Daily Snapshots', 'Priority Node hx-nd-01-10']),
        1,
        2,
      ],
      [
        'plan_game_apex',
        'Game Node Multi-Engine',
        'Game Servers',
        '6 vCPU High-Clock',
        12,
        80,
        '10 Gbps Low-Jitter',
        19.0,
        650,
        'Frankfurt · eu1.helzerx.cyou',
        JSON.stringify(['Rust, CS2, Palworld, ARK', 'One-Click Mod Manager', 'Automated Crash Recovery', 'Realtime Resource Telemetry']),
        1,
        3,
      ],
      [
        'plan_lxc_compute',
        'Proxmox LXC Compute',
        'Server Management',
        '4 vCPU Dedicated',
        16,
        120,
        '2.5 Gbps Private Bridge',
        18.0,
        600,
        'Singapore · hx-nd-01-10',
        JSON.stringify(['Debian 12 / Ubuntu 24.04', 'ZFS NVMe Mirroring', 'Automated TLS Rotation', 'Snapshot Rollback']),
        1,
        4,
      ],
      [
        'plan_vps_dedicated',
        'Enterprise KVM VPS',
        'VPS Hosting',
        '8 vCPU Dedicated',
        32,
        250,
        '10 Gbps BGP Anycast',
        44.0,
        1500,
        'Frankfurt · Singapore · US-East',
        JSON.stringify(['Full Kernel Isolation', 'IPv4 + /64 IPv6 Block', 'Custom ISO Mounting', '99.98% Availability SLA']),
        1,
        5,
      ],
      [
        'plan_early_access_8gb',
        '2027 Launch 8GB RAM Early Access',
        'Minecraft',
        '4 vCPU Ryzen EPYC',
        8,
        50,
        '10 Gbps DDoS Protected',
        0.0,
        0,
        'Singapore · sn1.helzerx.cyou',
        JSON.stringify(['Reserved for First 50 Eligible Users', 'Pre-Launch 01.01.2027 Allocation', 'Paper / Modded Ready', 'Verified Account Required']),
        1,
        6,
      ],
    ];

    for (const p of plans) {
      insertPlan.run(...p);
    }
  }

  const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number };
  if (productCount.c === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (id, slug, name, category, price_usd, stock, image_url, badge, summary, specs_json, featured, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const products = [
      [
        'prod_rack_node',
        'helzerx-core-rack-node',
        'HelzerX Core Rack Node',
        'Hardware',
        3490,
        18,
        '/assets/aistudio/IMG_20261121_083503_16556201.JPG',
        'Enterprise',
        '64-core EPYC compute blade pre-imaged with Proxmox VE, dual 25GbE SFP28 uplinks, and sliding rack-rail hardware.',
        JSON.stringify(['64-Core AMD EPYC', '128 GB DDR5 ECC', 'Dual 3.84 TB U.3 NVMe', '3-Year Advance Replacement']),
        1,
        1,
        now,
      ],
      [
        'prod_display_6k',
        'studio-reference-32-6k',
        'Studio Reference 32" 6K Display',
        'Hardware',
        1890,
        9,
        '/src/assets/images/helzerx_studio_dashboard_1795231046611.jpg',
        'Calibrated',
        'Factory-calibrated 6K IPS workstation display with Delta-E < 0.8 verification certificate and 96W single-cable USB-C.',
        JSON.stringify(['6016 x 3384 Resolution', '99.8% DCI-P3', 'Nano-Matte Glass', 'CNC Aluminum Stand']),
        1,
        1,
        now,
      ],
      [
        'prod_tactile_pro',
        'studio-tactile-pro-deck',
        'Studio Tactile Pro Mechanical Deck',
        'Peripherals',
        285,
        64,
        '/assets/aistudio/IMG_20261121_083503_16556201.JPG',
        'In Stock',
        'Gasket-mounted anodized 6063 CNC aluminum 75% mechanical keyboard with programmable rotary encoder and open QMK/VIA firmware.',
        JSON.stringify(['CNC 6063 Aluminum', 'Hot-Swap Tactile', 'QMK / VIA Firmware', 'Braided USB-C']),
        1,
        1,
        now,
      ],
      [
        'prod_rotary_pad',
        'helzerx-command-rotary-pad',
        'HelzerX Command Rotary Pad',
        'Peripherals',
        145,
        42,
        '/src/assets/images/helzerx_studio_dashboard_1795231046611.jpg',
        'In Stock',
        'Compact 12-key machined desk controller built for server power macros, timeline scrubbing, and terminal automation.',
        JSON.stringify(['12 Programmable Switches', 'Dual Steel Encoders', 'OLED Layer Display', 'USB-C & BLE 5.3']),
        0,
        1,
        now,
      ],
      [
        'prod_design_kit',
        'helzerx-design-system-kit',
        'HelzerX Design System & Token Kit',
        'Digital Kits',
        640,
        999,
        '/src/assets/images/helzerx_studio_dashboard_1795231046611.jpg',
        'Commercial License',
        'Production Figma component system paired with accessible React 19 + Tailwind CSS v4 dark/light enterprise primitives.',
        JSON.stringify(['Figma + React 19 Code', 'WCAG AA Verified', 'Tabular Data Grids', 'Lifetime Updates']),
        1,
        1,
        now,
      ],
      [
        'prod_proxmox_pack',
        'proxmox-pterodactyl-automation-pack',
        'Proxmox & Pterodactyl Automation Pack',
        'Digital Kits',
        420,
        999,
        '/assets/aistudio/IMG_20261121_083503_16556201.JPG',
        'DevOps Kit',
        'Terraform and Ansible playbooks for automated node hardening, TLS certificate rotation, and off-node ZFS backup orchestration.',
        JSON.stringify(['Terraform + Ansible', 'Zero-Trust Firewall Rules', 'ZFS Snapshot Sync', '12-Month Updates']),
        0,
        1,
        now,
      ],
    ];

    for (const prod of products) {
      insertProduct.run(...prod);
    }
  }

  const couponCount = db.prepare('SELECT COUNT(*) as c FROM coupons').get() as { c: number };
  if (couponCount.c === 0) {
    db.prepare(`
      INSERT INTO coupons (id, code, discount_percent, active, max_uses, used_count, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('cpn_launch27', 'HELZERX2027', 15, 1, 500, 0, '2027-02-01T00:00:00Z');
  }

  const launchCount = db.prepare('SELECT COUNT(*) as c FROM launch_campaign').get() as { c: number };
  if (launchCount.c === 0) {
    db.prepare(`
      INSERT INTO launch_campaign (id, launch_date, base_preorders, early_access_limit, announcement_text)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'launch_2027',
      '2027-01-01T00:00:00Z',
      47,
      50,
      'Official Global Launch on January 1, 2027 — The first 50 eligible verified accounts receive an 8GB RAM server allocation at launch.',
    );
  }

  const blogCount = db.prepare('SELECT COUNT(*) as c FROM blog_posts').get() as { c: number };
  if (blogCount.c === 0) {
    const insertPost = db.prepare(`
      INSERT INTO blog_posts (id, slug, title, category, tags_json, excerpt, content, author_name, status, featured, published_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPost.run(
      'post_launch_2027',
      'helzerx-official-launch-january-1-2027',
      'Road to January 1, 2027: Unifying Cloud, Studio & Shop',
      'Announcements',
      JSON.stringify(['Launch 2027', 'Cloud', 'Infrastructure']),
      'How HelzerX Technologies is connecting Proxmox LXC and Pterodactyl compute, custom product engineering, and hardware procurement under one platform.',
      'On January 1, 2027, HelzerX Technologies opens public operations at https://helzerx.cyou. Our engineering focus centers on eliminating fragmented tooling: one verified identity across cloud infrastructure, creative studio sprints, and curated hardware fulfillment.\n\nWith 47 pre-orders already committed ahead of release, early-access verification is now open for the first 50 eligible accounts to claim 8GB RAM launch server allocations.',
      'HelzerX Engineering Team',
      'published',
      1,
      '2026-11-20T09:00:00Z',
      now,
    );

    insertPost.run(
      'post_pterodactyl_sync',
      'hardening-pterodactyl-and-proxmox-lxc-nodes',
      'Hardening Pterodactyl Wings & Proxmox LXC on sn1.helzerx.cyou',
      'Engineering',
      JSON.stringify(['Pterodactyl', 'Proxmox', 'Security']),
      'An inside look at how node hx-nd-01-10 isolates game workloads and container networking with zero API credential exposure.',
      'Every HelzerX Cloud workload runs inside strict hardware-enforced namespaces. API communication between our customer console and Pterodactyl Panel takes place exclusively through authenticated server-side proxy endpoints, ensuring application and client keys never touch browser bundles.',
      'Platform Architecture Group',
      'published',
      1,
      '2026-11-18T14:00:00Z',
      now,
    );

    insertPost.run(
      'post_studio_systems',
      'shipping-design-systems-with-zero-layout-drift',
      'How HelzerX Studio Ships Enterprise Dashboards in 6-Week Sprints',
      'Studio',
      JSON.stringify(['Design Systems', 'UI/UX', 'TypeScript']),
      'Why pairing typographic discipline, tabular numerals, and end-to-end TypeScript contracts accelerates commercial product launches.',
      'At HelzerX Studio, design and engineering never operate in separate silos. Every engagement begins with shared tokens, accessible dark-surface contrast rules, and production-ready React + API blueprints delivered within predictable 6-week cycles.',
      'HelzerX Studio Team',
      'published',
      0,
      '2026-11-12T11:30:00Z',
      now,
    );
  }

  const annCount = db.prepare('SELECT COUNT(*) as c FROM announcements').get() as { c: number };
  if (annCount.c === 0) {
    const insertAnn = db.prepare(`
      INSERT INTO announcements (id, title, body, type, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAnn.run(
      'ann_launch2027',
      'Official Launch 01.01.2027 — Early Access Open',
      'The first 50 eligible verified accounts receive an 8GB RAM server allocation for the January 1, 2027 global launch.',
      'launch',
      1,
      now,
    );
    insertAnn.run(
      'ann_sn1',
      'Node hx-nd-01-10 Operational (sn1.helzerx.cyou)',
      'Singapore Proxmox LXC and MC Pterodactyl clusters are live with 10 Gbps DDoS mitigation.',
      'infrastructure',
      1,
      now,
    );
  }

  const faqCount = db.prepare('SELECT COUNT(*) as c FROM faqs').get() as { c: number };
  if (faqCount.c === 0) {
    const insertFaq = db.prepare(`
      INSERT INTO faqs (id, category, question, answer, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    const faqs = [
      [
        'faq_1',
        'Launch 2027',
        'How does the Early Access 8GB RAM server promotion work?',
        'The first 50 eligible users who register before January 1, 2027, verify their email address, and accept the platform terms qualify for an 8GB RAM launch server allocation. Eligibility is verified in the database before qualification is granted.',
        1,
      ],
      [
        'faq_2',
        'HelzerX Cloud',
        'How is the Pterodactyl Panel integrated securely?',
        'All Pterodactyl API requests pass through authenticated HelzerX server-side routes. Application and Client API keys remain strictly in server environment variables and are never sent to browser code.',
        2,
      ],
      [
        'faq_3',
        'Unified Account',
        'Do I need separate logins for Cloud, Studio, Shop, and Support?',
        'No. One HelzerX Technologies account gives you unified access across Cloud servers, Shop orders and invoices, Studio project tracking, Partner referrals, and Support tickets.',
        3,
      ],
      [
        'faq_4',
        'HelzerX Shop',
        'How are Shop checkout payments processed?',
        'Orders are saved immediately to your account with itemized invoices. Online card settlement activates automatically once Stripe server credentials are configured in the deployment environment.',
        4,
      ],
      [
        'faq_5',
        'HelzerX Studio',
        'What services does HelzerX Studio deliver?',
        'HelzerX Studio covers Website Development, UI/UX Design, Branding, Graphic Design, Video Editing, Custom Software Development, and end-to-end Digital Solutions.',
        5,
      ],
      [
        'faq_6',
        'Partnerships',
        'How can businesses join the HelzerX Partner Program?',
        'Submit an application via the Partners page. Once reviewed and approved by an administrator, your Partner Dashboard unlocks referral tracking and commission reporting.',
        6,
      ],
    ];
    for (const f of faqs) {
      insertFaq.run(...f);
    }
  }

  const settingsCount = db.prepare('SELECT COUNT(*) as c FROM site_settings').get() as { c: number };
  if (settingsCount.c === 0) {
    const insertSetting = db.prepare(`
      INSERT INTO site_settings (key, value_json, updated_at) VALUES (?, ?, ?)
    `);
    insertSetting.run(
      'general',
      JSON.stringify({
        companyName: 'HelzerX Technologies',
        domain: 'https://helzerx.cyou',
        launchDate: '2027-01-01T00:00:00Z',
        heroHeading: 'BUILD WITHOUT LIMITS.',
        heroDescription:
          'Powering the next generation of digital experiences through innovative technology, reliable infrastructure, and creative solutions.',
        supportEmail: 'support@helzerx.cyou',
        salesEmail: 'hello@helzerx.cyou',
        promoBanner: 'Official Launch January 1, 2027 — First 50 eligible accounts receive 8GB RAM servers.',
      }),
      now,
    );
    insertSetting.run(
      'seo',
      JSON.stringify({
        title: 'HelzerX Technologies – Cloud, Studio & Shop Platform',
        description:
          'Powering the next generation of digital experiences through innovative technology, reliable infrastructure, and creative solutions.',
        canonical: 'https://helzerx.cyou/',
      }),
      now,
    );
  }
}
