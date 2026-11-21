export interface CloudTier {
  id: string;
  name: string;
  engine: string;
  hzlCost: string;
  specs: string[];
  summary: string;
}

export interface ShopProduct {
  id: string;
  name: string;
  category: 'Hardware' | 'Peripherals' | 'Digital Kits';
  priceUsd: number;
  stockNote: string;
  summary: string;
  specs: string[];
}

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

export const CLOUD_TIERS: CloudTier[] = [
  {
    id: 'mc-starter',
    name: 'MC Pterodactyl Core',
    engine: 'Paper · Spigot · Purpur',
    hzlCost: '400 HZL / mo',
    specs: ['4 vCPU Ryzen EPYC', '8 GB DDR5 ECC', '40 GB NVMe SSD', 'Node hx-nd-01-10'],
    summary:
      'Low-latency managed Minecraft instances provisioned directly on sn1.helzerx.cyou with instant Pterodactyl console access.',
  },
  {
    id: 'proxmox-lxc',
    name: 'Proxmox LXC Node',
    engine: 'Debian 12 · Ubuntu 24.04 · Alpine',
    hzlCost: '600 HZL / mo',
    specs: ['4 vCPU Dedicated', '16 GB ECC Memory', '120 GB ZFS NVMe', 'Automated Snapshots'],
    summary:
      'Isolated Linux containers for APIs, bots, databases, and staging workloads with predictable throughput and snapshot recovery.',
  },
  {
    id: 'enterprise-cluster',
    name: 'Dedicated Cluster Pool',
    engine: 'Multi-Container · Custom Ports',
    hzlCost: '1,800 HZL / mo',
    specs: ['16 vCPU Pool', '64 GB DDR5 ECC', '500 GB NVMe Mirror', 'Priority Engineering'],
    summary:
      'Private multi-container host allocation with custom firewall rules, automated off-node backups, and direct engineering escalation.',
  },
];

export const SHOP_CATALOG: ShopProduct[] = [
  {
    id: 'prod-rack-node',
    name: 'HelzerX Core Rack Node',
    category: 'Hardware',
    priceUsd: 3490,
    stockNote: '18 units in stock · 48h dispatch',
    summary:
      '64-core EPYC compute blade pre-imaged with HelzerX Cloud OS, dual 25GbE SFP28 uplinks, and sliding rack-rail hardware.',
    specs: ['64-Core EPYC CPU', '128 GB DDR5 ECC', 'Dual 3.84 TB U.3 NVMe', '3-Year Warranty'],
  },
  {
    id: 'prod-display',
    name: 'Studio Reference 32" 6K Display',
    category: 'Hardware',
    priceUsd: 1890,
    stockNote: '9 units in stock · Calibrated',
    summary:
      'Factory-calibrated 6K IPS workstation monitor with Delta-E < 0.8 verification certificate and single-cable 96W USB-C power.',
    specs: ['6016 x 3384 Resolution', '99.8% DCI-P3', 'Matte Nano Texture', 'CNC Aluminum Stand'],
  },
  {
    id: 'prod-tactile-pro',
    name: 'Studio Tactile Pro Mechanical Deck',
    category: 'Peripherals',
    priceUsd: 285,
    stockNote: '64 units in stock · Ships today',
    summary:
      'Gasket-mounted anodized CNC aluminum 75% mechanical keyboard with programmable rotary encoder and QMK/VIA firmware.',
    specs: ['CNC 6063 Aluminum', 'Hot-Swap Tactile', 'QMK / VIA Open Firmware', 'Braided USB-C'],
  },
  {
    id: 'prod-macro-pad',
    name: 'HelzerX Command Rotary Pad',
    category: 'Peripherals',
    priceUsd: 145,
    stockNote: '42 units in stock · Ships today',
    summary:
      'Compact 12-key machined studio controller built for server shortcuts, timeline scrubbing, and terminal macros.',
    specs: ['12 Programmable Keys', 'Dual Steel Encoders', 'OLED Layer Readout', 'USB-C / BLE 5.3'],
  },
  {
    id: 'prod-design-kit',
    name: 'HelzerX Design System & Token Kit',
    category: 'Digital Kits',
    priceUsd: 640,
    stockNote: 'Instant Enterprise License',
    summary:
      'Production Figma component library paired with accessible React 19 and Tailwind CSS v4 UI primitives for dark and light themes.',
    specs: ['Figma + React 19 Code', 'WCAG AA Verified', 'Tabular Data Primitives', 'Lifetime Updates'],
  },
  {
    id: 'prod-cloud-starter-pack',
    name: 'Proxmox & Pterodactyl Automation Pack',
    category: 'Digital Kits',
    priceUsd: 420,
    stockNote: 'Instant Commercial License',
    summary:
      'Infrastructure-as-code Terraform and Ansible playbooks for automated node hardening, TLS rotation, and ZFS snapshot orchestration.',
    specs: ['Terraform + Ansible', 'Zero-Trust Firewall', 'Backup Scripts', '12-Month Support'],
  },
];

export const STUDIO_METHODOLOGY = [
  {
    step: '01.',
    title: 'Product Architecture & Research',
    description:
      'We audit existing technical constraints, user workflows, and conversion bottlenecks before writing production code, locking clear milestones.',
  },
  {
    step: '02.',
    title: 'Design Systems & Interface Craft',
    description:
      'Every screen is engineered with reusable typographic tokens, accessible contrast ratios, and responsive grid discipline.',
  },
  {
    step: '03.',
    title: 'Full-Stack & Cloud Delivery',
    description:
      'Principal engineers ship type-safe frontends, resilient APIs, and production deployments wired directly into HelzerX Cloud.',
  },
];

export const LEGAL_DOCUMENTS: Record<'terms' | 'privacy' | 'sla', LegalDocument> = {
  terms: {
    title: 'Terms of Service',
    effectiveDate: 'Effective November 20, 2026',
    subtitle:
      'These Terms of Service govern your access to and use of HelzerX Technologies services across HelzerX Cloud, HelzerX Shop, and HelzerX Studio.',
    sections: [
      {
        id: 'acceptance',
        heading: '1. Acceptance of Terms',
        paragraphs: [
          'By creating an account, purchasing hardware or digital licenses, deploying workloads on HelzerX Cloud, or engaging HelzerX Studio, you agree to be bound by these Terms of Service and our Privacy Policy. If you accept these terms on behalf of an organization, you represent that you have authority to bind that entity.',
        ],
      },
      {
        id: 'cloud-services',
        heading: '2. HelzerX Cloud & HZL Credits',
        paragraphs: [
          'HelzerX Cloud provides managed Proxmox LXC containers, Pterodactyl game servers, and virtualized infrastructure across regional nodes including sn1.helzerx.cyou. Services are metered or provisioned using verified HZL credits or approved USD billing.',
          'HZL credits added to your Member Cloud Console wallet are non-transferable between unaffiliated accounts and apply strictly toward eligible HelzerX Cloud compute, storage, and server deployments. You are responsible for maintaining backups of critical workload data alongside automated platform snapshots.',
        ],
      },
      {
        id: 'acceptable-use',
        heading: '3. Acceptable Use Policy',
        paragraphs: [
          'You may not use HelzerX Cloud infrastructure to conduct denial-of-service attacks, unauthorized port scanning, malware distribution, cryptocurrency mining without written authorization, or infringement of third-party intellectual property rights.',
          'HelzerX Technologies reserves the right to suspend or isolate any container or server instance that threatens network stability, violates applicable law, or generates abusive outbound traffic.',
        ],
      },
      {
        id: 'shop-orders',
        heading: '4. HelzerX Shop Hardware & Digital Licenses',
        paragraphs: [
          'Hardware shipped through HelzerX Shop includes a standard 3-year limited hardware warranty covering manufacturing defects. Digital kits and design systems are licensed per organization or seat tier as specified at checkout and may not be redistributed or resold as competing templates.',
        ],
      },
      {
        id: 'studio-ip',
        heading: '5. HelzerX Studio Client Deliverables',
        paragraphs: [
          'Upon full settlement of agreed sprint milestones, custom source code, design tokens, and visual assets created exclusively under a HelzerX Studio statement of work transfer to the client, excluding pre-existing HelzerX proprietary libraries and open-source dependencies.',
        ],
      },
      {
        id: 'liability',
        heading: '6. Limitation of Liability',
        paragraphs: [
          'To the maximum extent permitted by applicable law, HelzerX Technologies shall not be liable for indirect, incidental, or consequential damages, including lost profits or data loss, exceeding the total fees paid by you to HelzerX Technologies during the twelve (12) months preceding the claim.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    effectiveDate: 'Effective November 20, 2026',
    subtitle:
      'How HelzerX Technologies collects, processes, and safeguards account, billing, and infrastructure telemetry data.',
    sections: [
      {
        id: 'data-collected',
        heading: '1. Information We Collect',
        paragraphs: [
          'Account & Identity Data: When you register for the Member Cloud Console or submit an inquiry, we collect your name, work email address, organization name, and account identifier.',
          'Operational & Billing Metadata: We record HZL credit ledger entries, server provisioning logs (such as container IDs, node assignments, and timestamps), hardware shipping addresses, and support communications.',
        ],
      },
      {
        id: 'how-used',
        heading: '2. How We Use Information',
        paragraphs: [
          'We process your data solely to provision Proxmox LXC and Pterodactyl servers, fulfill HelzerX Shop orders, coordinate HelzerX Studio engagements, prevent fraudulent abuse, and deliver security notifications.',
          'HelzerX Technologies never sells personal information or customer telemetry to third-party advertising brokers.',
        ],
      },
      {
        id: 'security',
        heading: '3. Data Security & Retention',
        paragraphs: [
          'All control-plane traffic and ledger synchronization endpoints are encrypted in transit via TLS 1.3. Server access tokens and session credentials are hashed and scoped by role. Operational logs are retained only as long as required for security auditing and regulatory compliance.',
        ],
      },
      {
        id: 'your-rights',
        heading: '4. Your Rights & Contact',
        paragraphs: [
          'You may request export, correction, or deletion of your account profile data at any time by contacting our privacy desk through the Contact page or emailing privacy@helzerx.cyou.',
        ],
      },
    ],
  },
  sla: {
    title: 'SLA & Refund Policy',
    effectiveDate: 'Effective November 20, 2026',
    subtitle:
      'Service availability commitments for HelzerX Cloud and return/warranty terms for HelzerX Shop and Studio.',
    sections: [
      {
        id: 'cloud-sla',
        heading: '1. Cloud Infrastructure Availability (99.98% Target)',
        paragraphs: [
          'HelzerX Cloud targets 99.98% monthly network and host node availability for active Proxmox LXC and MC Pterodactyl deployments. Scheduled hardware maintenance windows are announced at least 48 hours in advance inside the Member Cloud Console.',
          'If verified unscheduled downtime exceeds our monthly threshold, affected accounts are eligible for HZL credit rebates proportional to the outage duration upon submitting a support ticket within 14 days.',
        ],
      },
      {
        id: 'hzl-refunds',
        heading: '2. HZL Credit & Server Billing Adjustments',
        paragraphs: [
          'Unused wallet funds may be refunded in accordance with your original payment method within 7 days of top-up if no HZL credits from that transaction have been consumed. Provisioned monthly server cycles are non-refundable once deployed unless an unresolvable node hardware fault occurs.',
        ],
      },
      {
        id: 'hardware-returns',
        heading: '3. HelzerX Shop Hardware Returns & Warranty',
        paragraphs: [
          'Unopened hardware peripherals and displays may be returned within 14 calendar days of delivery for a full refund. Defective rack nodes or calibrated displays are covered by advance hardware replacement under our 3-year warranty.',
        ],
      },
    ],
  },
};
