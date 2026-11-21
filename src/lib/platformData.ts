export type DivisionId = 'cloud' | 'shop' | 'studio';

export interface WorkspaceItem {
  id: string;
  title: string;
  category: string;
  detail: string;
  dateOrMetric: string;
  state: 'Completed' | 'In Progress' | 'Active';
  owner: string;
  initials: string;
}

export interface WorkspaceGroup {
  label: string;
  items: WorkspaceItem[];
}

export interface WorkspaceData {
  breadcrumb: string;
  heading: string;
  subgroups: WorkspaceGroup[];
}

export const WORKSPACE_DATA: Record<DivisionId, WorkspaceData> = {
  cloud: {
    breadcrumb: 'HelzerX Cloud / sn1.helzerx.cyou / Node Pool',
    heading: 'Pterodactyl & Proxmox LXC Telemetry',
    subgroups: [
      {
        label: 'Active Compute Clusters',
        items: [
          {
            id: 'cld-1',
            title: 'hx-nd-01 · Paper 1.21.4 Production Node',
            category: 'Minecraft Node',
            detail: 'Ryzen EPYC 9354 · 20.0 TPS sustained across 180 concurrent players',
            dateOrMetric: '12.4 GB / 16 GB',
            state: 'Active',
            owner: 'K. Rodrigo',
            initials: 'KR',
          },
          {
            id: 'cld-2',
            title: 'lx-sg-04 · Ubuntu 24.04 API Container',
            category: 'Proxmox LXC',
            detail: 'Mirrored Gen4 NVMe ZFS pool with automated 6h snapshot retention',
            dateOrMetric: '4 vCPU · 8 GB',
            state: 'Completed',
            owner: 'A. Silva',
            initials: 'AS',
          },
        ],
      },
      {
        label: 'Network & Mitigation',
        items: [
          {
            id: 'cld-3',
            title: 'Anycast L4/L7 Edge Scrubbing Mesh',
            category: 'Security',
            detail: 'Singapore & Frankfurt PoPs enforcing sub-15ms packet filtering',
            dateOrMetric: '99.98% SLA',
            state: 'Active',
            owner: 'M. Vance',
            initials: 'MV',
          },
        ],
      },
    ],
  },
  shop: {
    breadcrumb: 'HelzerX Shop / Catalog / Fulfillment Queue',
    heading: 'Live Hardware & Software Procurement',
    subgroups: [
      {
        label: 'Featured Enterprise Stock',
        items: [
          {
            id: 'shp-1',
            title: 'HelzerX Core 1U Rack Compute Blade',
            category: 'Rack Hardware',
            detail: 'Dual-socket EPYC chassis with 10GbE SFP+ uplinks and redundant PSU',
            dateOrMetric: '$2,490 · In Stock',
            state: 'Active',
            owner: 'D. Chen',
            initials: 'DC',
          },
          {
            id: 'shp-2',
            title: 'HelzerX Studio 6K Calibrated Reference Display',
            category: 'Workstations',
            detail: 'Factory Delta-E < 0.8 matte nano-etched anodized aluminum display',
            dateOrMetric: '$1,850 · 14 left',
            state: 'In Progress',
            owner: 'S. Perera',
            initials: 'SP',
          },
          {
            id: 'shp-3',
            title: 'CNC Anodized Mechanical Control Deck',
            category: 'Peripherals',
            detail: 'Machined 6063 aluminum chassis with hot-swap tactile rotary encoders',
            dateOrMetric: '$280 · 32 left',
            state: 'Active',
            owner: 'R. Patel',
            initials: 'RP',
          },
        ],
      },
      {
        label: 'Software & Launch Perks',
        items: [
          {
            id: 'shp-4',
            title: 'HelzerX Enterprise SaaS Starter Kit',
            category: 'Digital License',
            detail: 'TypeScript + Express + SQLite RBAC production boilerplate & audit kit',
            dateOrMetric: '$149 · Instant',
            state: 'Completed',
            owner: 'K. Rodrigo',
            initials: 'KR',
          },
        ],
      },
    ],
  },
  studio: {
    breadcrumb: 'HelzerX Studio / Client Portal / Sprint Queue',
    heading: 'Creative Engineering & Design Delivery',
    subgroups: [
      {
        label: 'Active Client Sprints',
        items: [
          {
            id: 'std-1',
            title: 'FinTech Web Platform & Interactive 3D Hero',
            category: 'Web Development',
            detail: 'React + TypeScript + Three.js production launch with custom API gateway',
            dateOrMetric: 'Week 4 / 6',
            state: 'In Progress',
            owner: 'S. Perera',
            initials: 'SP',
          },
          {
            id: 'std-2',
            title: 'Global Brand Identity & Design Token System',
            category: 'Branding & UI/UX',
            detail: 'Complete Figma variable architecture, typography scale, and motion specs',
            dateOrMetric: 'Delivered',
            state: 'Completed',
            owner: 'E. Lin',
            initials: 'EL',
          },
        ],
      },
    ],
  },
};

export interface DivisionOverview {
  id: DivisionId;
  shortName: string;
  headline: string;
  description: string;
  highlights: string[];
  metricLabel: string;
}

export const DIVISIONS: DivisionOverview[] = [
  {
    id: 'cloud',
    shortName: 'HelzerX Cloud',
    headline: 'Bare-metal compute, Minecraft clusters, and isolated LXC nodes.',
    description:
      'High-frequency AMD EPYC infrastructure routed through server-side Pterodactyl orchestration, automated ZFS snapshots, and Anycast edge DDoS filtering.',
    highlights: ['Pterodactyl Daemon Proxy', 'Proxmox LXC Containers', '10 Gbps Edge Protection'],
    metricLabel: '99.98% Target Uptime SLA · sn1.helzerx.cyou',
  },
  {
    id: 'studio',
    shortName: 'HelzerX Studio',
    headline: 'Full-stack software engineering, UI/UX craft, and brand systems.',
    description:
      'Cross-functional product engineers, designers, and video editors shipping commercial platforms, design systems, and bespoke software with live client tracking.',
    highlights: ['7 Creative & Tech Tracks', 'Live Project Message Threads', 'Cloud-Ready Delivery'],
    metricLabel: '2026 Client Portal · End-to-End Sprints',
  },
  {
    id: 'shop',
    shortName: 'HelzerX Shop',
    headline: 'Workstation hardware, rack blades, and commercial starter kits.',
    description:
      'Direct enterprise hardware and software storefront featuring real-time inventory synchronization, coupon validation, verified customer reviews, and instant invoices.',
    highlights: ['Live SQLite Stock Ledger', 'HELZERX2027 Launch Code', 'Automated PDF Invoices'],
    metricLabel: 'Global Fulfillment · USD & Partner Billing',
  },
];

export interface StudioMethodologyPhase {
  id: string;
  stage: string;
  title: string;
  description: string;
}

export const STUDIO_METHODOLOGY: StudioMethodologyPhase[] = [
  {
    id: 'discovery',
    stage: 'Discovery & Architecture',
    title: 'Technical Scope & System Blueprint',
    description:
      'Every engagement opens with clear deliverable milestones, database schema architecture, and verified budget & timeline commitments inside your Client Portal.',
  },
  {
    id: 'execution',
    stage: 'Design & Engineering',
    title: 'Interactive Craft & Full-Stack Build',
    description:
      'Design systems, 3D motion, and server-isolated APIs progress in weekly staging increments with direct feedback threads and file revisions.',
  },
  {
    id: 'deployment',
    stage: 'Deployment & Continuity',
    title: 'Production Rollout & SLA Handover',
    description:
      'Final platforms ship cleanly onto HelzerX Cloud LXC infrastructure or your preferred cluster with documentation, security hardening, and ongoing escalation.',
  },
];

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  effectiveDate: string;
  subtitle: string;
  sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: Record<'terms' | 'privacy' | 'sla', LegalDocument> = {
  terms: {
    title: 'Terms of Service',
    effectiveDate: 'Effective Ahead of January 1, 2027 Launch',
    subtitle:
      'Governing customer accounts, HelzerX Cloud compute provisioning, HelzerX Studio contracts, and HelzerX Shop procurement.',
    sections: [
      {
        id: 'acceptance',
        heading: 'Account Eligibility & Unified Identity',
        paragraphs: [
          'By creating a HelzerX Technologies account at https://helzerx.cyou, you agree to maintain accurate registration details and protect your authentication credentials. Each account provides unified access across Cloud, Studio, Shop, and Partner portals.',
          'Early Access Launch 2027 allocations (including first-50 qualified 8GB RAM launch servers) require a verified email address, timestamped pre-launch registration prior to January 1, 2027 (00:00 UTC), and compliance with acceptable use standards.',
        ],
      },
      {
        id: 'cloud-usage',
        heading: 'HelzerX Cloud & Acceptable Infrastructure Use',
        paragraphs: [
          'Compute nodes, Minecraft servers, and Proxmox LXC containers may not be used for unauthorized network scanning, denial-of-service origination, malware distribution, or unlicensed redistribution.',
          'Pterodactyl daemon access and power actions are proxied strictly through authenticated HelzerX backend routes and logged for security auditing.',
        ],
      },
      {
        id: 'shop-studio',
        heading: 'Shop Orders, Studio Milestones & Billing',
        paragraphs: [
          'All HelzerX Shop orders record itemized invoices against live inventory quantities. Payment confirmation requires an active configured payment gateway; HelzerX never fabricates settled payment statuses.',
          'HelzerX Studio project briefs create trackable proposals whose production timeline begins upon written scope confirmation.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    effectiveDate: 'Updated for Global Operations 2026–2027',
    subtitle:
      'How HelzerX Technologies collects, encrypts, and protects customer identity, telemetry, and order data.',
    sections: [
      {
        id: 'collection',
        heading: 'Information We Process',
        paragraphs: [
          'We store account profile fields (name, email, role), server provisioning identifiers, Studio project communications, Shop order invoices, and technical support tickets strictly necessary to operate requested services.',
          'Passwords are hashed using per-user cryptographic salt with scrypt key derivation and never stored or transmitted in plaintext.',
        ],
      },
      {
        id: 'isolation',
        heading: 'Server-Side Credential Isolation',
        paragraphs: [
          'Third-party infrastructure credentials—including Pterodactyl Panel API keys and payment processor secrets—remain isolated on HelzerX server environments and are never embedded inside browser client bundles.',
        ],
      },
      {
        id: 'rights',
        heading: 'Data Access & Retention Controls',
        paragraphs: [
          'Customers may inspect their active servers, invoices, and project records inside the unified Customer Dashboard or request account export and deletion by contacting legal@helzerx.cyou.',
        ],
      },
    ],
  },
  sla: {
    title: 'SLA & Refund Policy',
    effectiveDate: 'Infrastructure & Procurement Commitment',
    subtitle:
      'Service availability targets, incident credit tiers, hardware returns, and Studio milestone protections.',
    sections: [
      {
        id: 'uptime',
        heading: '99.98% Cloud Network Availability Target',
        paragraphs: [
          'HelzerX Cloud clusters (including sn1.helzerx.cyou and regional nodes) target 99.98% monthly network and hypervisor availability excluding scheduled maintenance announced at least 48 hours in advance.',
          'Verified infrastructure outages exceeding SLA thresholds qualify active monthly subscriptions for prorated HZL credit compensation upon support ticket review.',
        ],
      },
      {
        id: 'refunds',
        heading: 'Hardware Returns & Cloud Cancellations',
        paragraphs: [
          'Unopened HelzerX Shop workstation hardware and peripherals may be returned within 14 days of verified delivery subject to serial inspection. Digital software starter kits are final once license keys or archives are accessed.',
          'New HelzerX Cloud deployments qualify for a 72-hour initial compatibility refund when requested through the Support Center.',
        ],
      },
    ],
  },
};
