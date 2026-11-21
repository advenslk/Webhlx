export type DivisionId = 'cloud' | 'shop' | 'studio';

export interface DivisionInfo {
  id: DivisionId;
  name: string;
  shortName: string;
  headline: string;
  description: string;
  highlights: string[];
  metricLabel: string;
  ctaLabel: string;
}

export interface WorkspaceItem {
  id: string;
  title: string;
  category: string;
  dateOrMetric: string;
  state: 'Active' | 'In Progress' | 'Completed' | 'Ready';
  owner: string;
  initials: string;
  detail: string;
}

export interface WorkspaceSectionData {
  id: DivisionId;
  breadcrumb: string;
  heading: string;
  subgroups: {
    label: string;
    items: WorkspaceItem[];
  }[];
}

export interface CaseStudy {
  id: string;
  division: string;
  client: string;
  metric: string;
  summary: string;
  quote: string;
  author: string;
  role: string;
}

export const DIVISIONS: DivisionInfo[] = [
  {
    id: 'cloud',
    name: 'HelzerX Cloud',
    shortName: 'Cloud',
    headline: 'Member Cloud Console for Proxmox LXC and Pterodactyl servers',
    description:
      'Manage verified HZL credits, deploy high-performance Paper Minecraft and Proxmox LXC containers on sn1.helzerx.cyou nodes, and monitor live infrastructure.',
    highlights: ['Proxmox LXC', 'MC Pterodactyl', 'HZL Credits'],
    metricLabel: 'sn1.helzerx.cyou · Instant Provisioning',
    ctaLabel: 'Inspect Cloud Console',
  },
  {
    id: 'shop',
    name: 'HelzerX Shop',
    shortName: 'Shop',
    headline: 'Curated workstations, developer hardware, and licensed digital kits',
    description:
      'Direct-to-team procurement for calibrated studio displays, custom mechanical input gear, enterprise server blades, and production software licenses.',
    highlights: ['Same-Day Dispatch', 'Enterprise Billing', '3-Year Warranty'],
    metricLabel: '4,200+ studio & lab setups shipped',
    ctaLabel: 'Inspect Shop Catalog',
  },
  {
    id: 'studio',
    name: 'HelzerX Studio',
    shortName: 'Studio',
    headline: 'End-to-end product engineering, design systems, and brand architecture',
    description:
      'Dedicated principal designers and full-stack engineers shipping high-conversion web platforms, bespoke internal tools, and interactive 3D product showcases.',
    highlights: ['6-Week Sprints', 'Design Systems', 'Full Ownership'],
    metricLabel: '38 commercial platforms launched',
    ctaLabel: 'Inspect Studio Pipeline',
  },
];

export const WORKSPACE_DATA: Record<DivisionId, WorkspaceSectionData> = {
  cloud: {
    id: 'cloud',
    breadcrumb: 'HelzerX Cloud / My Containers & Servers (2)',
    heading: 'Member Cloud Console',
    subgroups: [
      {
        label: 'Your Server Requests & Deployments',
        items: [
          {
            id: 'cld-1',
            title: 'hl-test — MC Pterodactyl (sn1.helzerx.cyou:25639)',
            category: 'MC Pterodactyl',
            dateOrMetric: '400 HZL · 11/14/2026',
            state: 'Active',
            owner: 'Helzo',
            initials: 'HZ',
            detail: 'Software: Paper (High performance Spigot fork) running on Node hx-nd-01-10 (sn1.helzerx.cyou).',
          },
          {
            id: 'cld-2',
            title: 'my-smp — MC Pterodactyl (sn1.helzerx.cyou:25592)',
            category: 'MC Pterodactyl',
            dateOrMetric: '400 HZL · 11/15/2026',
            state: 'Active',
            owner: 'Helzo',
            initials: 'HZ',
            detail: 'Software: Paper (High performance Spigot fork) running on Node hx-nd-01-10 (sn1.helzerx.cyou).',
          },
          {
            id: 'cld-3',
            title: 'hx-lxc-gateway — Proxmox LXC Container',
            category: 'Proxmox LXC',
            dateOrMetric: '600 HZL · hx-nd-01-10',
            state: 'Ready',
            owner: 'Kavinda Perera',
            initials: 'KP',
            detail: 'Isolated Debian 12 LXC instance with dedicated NVMe storage and automated snapshot backups.',
          },
          {
            id: 'cld-4',
            title: 'HZL Credit Ledger & Wallet Sync',
            category: 'Billing',
            dateOrMetric: '3,400 HZL · $0.00',
            state: 'Completed',
            owner: 'Helzo',
            initials: 'HZ',
            detail: 'Verified HZL credit balance synchronized across Proxmox LXC and Pterodactyl Control Center.',
          },
        ],
      },
      {
        label: 'Node Infrastructure & Control Center',
        items: [
          {
            id: 'cld-5',
            title: 'Node hx-nd-01-10 (sn1.helzerx.cyou) telemetry check',
            category: 'Node Health',
            dateOrMetric: '14 ms · Online',
            state: 'Completed',
            owner: 'Nadia Silva',
            initials: 'NS',
            detail: 'All Pterodactyl wings daemons and Proxmox LXC bridges verified with zero packet loss.',
          },
          {
            id: 'cld-6',
            title: 'Automated daily off-node container snapshot',
            category: 'Backups',
            dateOrMetric: '24h Cycle',
            state: 'Ready',
            owner: 'Kavinda Perera',
            initials: 'KP',
            detail: 'Encrypted incremental snapshots retained across secondary storage pool.',
          },
        ],
      },
    ],
  },
  shop: {
    id: 'shop',
    breadcrumb: 'HelzerX Shop / Hardware & Digital Catalog',
    heading: 'Fulfillment & Gear',
    subgroups: [
      {
        label: 'Featured Hardware & Kits',
        items: [
          {
            id: 'shp-1',
            title: 'HelzerX Core Rack Node — 64-Core EPYC Blade',
            category: 'Hardware',
            dateOrMetric: '$3,490 · 18 Units',
            state: 'Ready',
            owner: 'Dinesh Jayawardena',
            initials: 'DJ',
            detail: 'Pre-flashed with HelzerX Cloud OS image, dual 25GbE SFP28 uplinks, and rack-rail kit included.',
          },
          {
            id: 'shp-2',
            title: 'Studio Tactile Pro — CNC Aluminum Mechanical Deck',
            category: 'Peripherals',
            dateOrMetric: '$285 · 64 Units',
            state: 'Ready',
            owner: 'Maya Lin',
            initials: 'ML',
            detail: 'Gasket-mounted anodized chassis with rotary encoder, QMK/VIA firmware, and braided USB-C cable.',
          },
          {
            id: 'shp-3',
            title: 'HelzerX Design System & Token Kit (Enterprise)',
            category: 'Digital',
            dateOrMetric: '$640 · License',
            state: 'Active',
            owner: 'Maya Lin',
            initials: 'ML',
            detail: 'Production Figma component library paired with accessible React 19 + Tailwind CSS v4 primitives.',
          },
          {
            id: 'shp-4',
            title: 'Calibrated 32" 6K Reference Display Batch #14',
            category: 'Hardware',
            dateOrMetric: '$1,890 · 9 Units',
            state: 'In Progress',
            owner: 'Dinesh Jayawardena',
            initials: 'DJ',
            detail: 'Factory delta-E < 0.8 color calibration certificate included; final QA inspection before dispatch.',
          },
        ],
      },
      {
        label: 'Enterprise Orders',
        items: [
          {
            id: 'shp-5',
            title: 'Kinetix Labs — 12x Workstation Bundle Dispatch',
            category: 'Order #HX-8841',
            dateOrMetric: 'ETA Nov 24',
            state: 'In Progress',
            owner: 'Rohan Fernando',
            initials: 'RF',
            detail: 'Custom asset-tagged macOS & Linux developer stations cleared customs and en route to Singapore.',
          },
          {
            id: 'shp-6',
            title: 'Nordic Grid — Annual Software Seat Renewal',
            category: 'Order #HX-8829',
            dateOrMetric: '120 Seats',
            state: 'Completed',
            owner: 'Elena Rostova',
            initials: 'ER',
            detail: 'Provisioned SSO enterprise keys and priority hardware replacement coverage through Q4 2027.',
          },
        ],
      },
    ],
  },
  studio: {
    id: 'studio',
    breadcrumb: 'HelzerX Studio / Client Builds',
    heading: 'Launch Sprint',
    subgroups: [
      {
        label: 'Product Design & Engineering',
        items: [
          {
            id: 'stu-1',
            title: 'Define typographic hierarchy & obsidian token palette',
            category: 'Design',
            dateOrMetric: 'Nov 14',
            state: 'Completed',
            owner: 'Senuli Wickrama',
            initials: 'SW',
            detail: 'Locked WCAG AA dark-surface contrast ratios, tabular numeral tokens, and responsive grid breakpoints.',
          },
          {
            id: 'stu-2',
            title: 'Architect unified storefront & headless checkout API',
            category: 'Engineering',
            dateOrMetric: 'Nov 19',
            state: 'Completed',
            owner: 'Aarav Patel',
            initials: 'AP',
            detail: 'Edge-cached product pages hitting 99 Lighthouse performance with sub-120ms cart mutations.',
          },
          {
            id: 'stu-3',
            title: 'Build interactive 3D hardware configurator viewport',
            category: 'Interactive',
            dateOrMetric: 'Nov 26',
            state: 'In Progress',
            owner: 'Senuli Wickrama',
            initials: 'SW',
            detail: 'Real-time chassis finish switching and live spec sheet export wired directly to Shop inventory.',
          },
          {
            id: 'stu-4',
            title: 'Ship multi-region analytics & telemetry portal',
            category: 'Engineering',
            dateOrMetric: 'Dec 02',
            state: 'In Progress',
            owner: 'Aarav Patel',
            initials: 'AP',
            detail: 'Role-gated customer console displaying real-time cluster health, order tracking, and invoice history.',
          },
        ],
      },
      {
        label: 'Brand & Go-To-Market',
        items: [
          {
            id: 'stu-5',
            title: 'Produce launch motion reel & technical documentation',
            category: 'Brand',
            dateOrMetric: 'Dec 06',
            state: 'Ready',
            owner: 'Lucas Weber',
            initials: 'LW',
            detail: 'High-frame-rate product walkthroughs and developer onboarding guides formatted for global release.',
          },
          {
            id: 'stu-6',
            title: 'Finalize production load test & cutover checklist',
            category: 'Release',
            dateOrMetric: 'Dec 10',
            state: 'Ready',
            owner: 'Aarav Patel',
            initials: 'AP',
            detail: 'Simulated 25,000 concurrent checkout sessions on HelzerX Cloud with zero dropped transactions.',
          },
        ],
      },
    ],
  },
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'cs-cloud',
    division: 'HelzerX Cloud',
    client: 'Vanguard Logistics',
    metric: '99.98% uptime across 14 regions',
    summary:
      'Consolidated fragmented multi-cloud containers onto HelzerX Cloud edge clusters, cutting cross-border API latency by 47% over 6 months.',
    quote:
      'Moving our dispatch engine to HelzerX Cloud eliminated regional cold starts and reduced monthly infrastructure spend by 31%.',
    author: 'Marcus Vance',
    role: 'VP of Platform Engineering, Vanguard Logistics',
  },
  {
    id: 'cs-shop',
    division: 'HelzerX Shop',
    client: 'Kinetix Robotics',
    metric: '48h workstation fleet rollout',
    summary:
      'Equipped 45 new robotics engineers with pre-imaged HelzerX Core workstations, calibrated displays, and licensed SDK suites in under two days.',
    quote:
      'Every desk arrived pre-configured with our exact Linux toolchain and security certificates. Zero IT onboarding bottlenecks.',
    author: 'Hana Takahashi',
    role: 'Head of Hardware Operations, Kinetix Robotics',
  },
  {
    id: 'cs-studio',
    division: 'HelzerX Studio',
    client: 'Solara Commerce',
    metric: '+164% checkout conversion in 90 days',
    summary:
      'Redesigned Solara’s B2B storefront and customer portal from the ground up, unifying product discovery, bulk ordering, and live freight tracking.',
    quote:
      'HelzerX Studio treated design and engineering as one discipline. Our enterprise re-order volume more than doubled in one quarter.',
    author: 'Devon Mercer',
    role: 'Chief Product Officer, Solara Commerce',
  },
];

export const PARTNER_LOGOS = [
  { name: 'Vanguard', shape: 'prism' },
  { name: 'Kinetix Labs', shape: 'grid' },
  { name: 'Solara', shape: 'cross' },
  { name: 'Nordic Grid', shape: 'pulse' },
  { name: 'Aether', shape: 'hex' },
  { name: 'Vertex Works', shape: 'star' },
] as const;
