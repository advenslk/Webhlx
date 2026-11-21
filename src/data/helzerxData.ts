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

/**
 * Product-tour copy for the unified command interface.
 * These are real capabilities of this application — not customer records or
 * fabricated accounts — so nothing here is presented as live user data.
 */
export const DIVISIONS: DivisionInfo[] = [
  {
    id: 'cloud',
    name: 'HelzerX Cloud',
    shortName: 'Cloud',
    headline: 'Member Cloud Console for Proxmox LXC and Pterodactyl servers',
    description:
      'Manage verified HZL credits, request Paper Minecraft and Proxmox LXC containers, and monitor infrastructure connected through the Pterodactyl API.',
    highlights: ['Proxmox LXC', 'MC Pterodactyl', 'HZL Credits'],
    metricLabel: 'sn1.helzerx.cyou · Pterodactyl API',
    ctaLabel: 'Inspect Cloud Console',
  },
  {
    id: 'shop',
    name: 'HelzerX Shop',
    shortName: 'Shop',
    headline: 'Curated workstations, developer hardware, and licensed digital kits',
    description:
      'Browse a live catalog with inventory tracking, coupons, reviews, and invoiced orders handled through one authenticated account.',
    highlights: ['Live Inventory', 'Coupons & Reviews', 'Invoiced Orders'],
    metricLabel: 'Live catalog · Inventory tracked',
    ctaLabel: 'Inspect Shop Catalog',
  },
  {
    id: 'studio',
    name: 'HelzerX Studio',
    shortName: 'Studio',
    headline: 'End-to-end product engineering, design systems, and brand architecture',
    description:
      'Submit project briefs, follow delivery milestones, and collaborate with the Studio team through a shared project workspace.',
    highlights: ['Project Briefs', 'Milestones', 'Shared Workspace'],
    metricLabel: 'Design · Engineering · Delivery',
    ctaLabel: 'Inspect Studio Pipeline',
  },
];

export const WORKSPACE_DATA: Record<DivisionId, WorkspaceSectionData> = {
  cloud: {
    id: 'cloud',
    breadcrumb: 'HelzerX Cloud / Platform Tour',
    heading: 'Cloud control center',
    subgroups: [
      {
        label: 'Deployment & account',
        items: [
          {
            id: 'cld-1',
            title: 'Server request queue',
            category: 'Deployment',
            dateOrMetric: 'Pending provisioning',
            state: 'Active',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Requests are recorded against your account with the selected plan and node, then provisioned when panel credentials are connected.',
          },
          {
            id: 'cld-2',
            title: 'Pterodactyl resource monitoring',
            category: 'Monitoring',
            dateOrMetric: 'Live API',
            state: 'Active',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'CPU, memory, and disk utilization are read from the Pterodactyl client API for servers that have been linked to your account.',
          },
          {
            id: 'cld-3',
            title: 'Power controls',
            category: 'Server actions',
            dateOrMetric: 'Start · Stop · Restart',
            state: 'Ready',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Start, stop, restart, and kill signals are sent server-side so panel API keys are never exposed in the browser.',
          },
          {
            id: 'cld-4',
            title: 'HZL credit ledger',
            category: 'Billing',
            dateOrMetric: 'Balance & history',
            state: 'Ready',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Credit balance and transaction activity stay attached to your authenticated account across Cloud, Studio, and Shop.',
          },
        ],
      },
      {
        label: 'Infrastructure',
        items: [
          {
            id: 'cld-5',
            title: 'Node hx-nd-01-10 overview',
            category: 'Nodes',
            dateOrMetric: 'sn1.helzerx.cyou',
            state: 'Ready',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Proxmox LXC and Pterodactyl workloads are organized by node, with status surfaced in your dashboard.',
          },
          {
            id: 'cld-6',
            title: 'Panel credential isolation',
            category: 'Security',
            dateOrMetric: 'Server-side only',
            state: 'Completed',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Panel and payment credentials live in server environment variables and are never shipped to the client bundle.',
          },
        ],
      },
    ],
  },
  shop: {
    id: 'shop',
    breadcrumb: 'HelzerX Shop / Platform Tour',
    heading: 'Commerce workspace',
    subgroups: [
      {
        label: 'Catalog & checkout',
        items: [
          {
            id: 'shp-1',
            title: 'Live product catalog',
            category: 'Catalog',
            dateOrMetric: 'Database-backed',
            state: 'Ready',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Products, pricing, badges, and stock levels are read directly from the Shop database on every visit.',
          },
          {
            id: 'shp-2',
            title: 'Coupon validation',
            category: 'Promotions',
            dateOrMetric: 'HELZERX2027',
            state: 'Active',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Discount codes are verified server-side against stored coupon records before an order is placed.',
          },
          {
            id: 'shp-3',
            title: 'Order & invoice records',
            category: 'Orders',
            dateOrMetric: 'Pending payment',
            state: 'Active',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Checkout creates an order, line items, and an invoice. No card is charged until a payment provider is connected.',
          },
          {
            id: 'shp-4',
            title: 'Customer reviews',
            category: 'Community',
            dateOrMetric: 'Verified accounts',
            state: 'Ready',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Product feedback is stored against real signed-in accounts and surfaced on the relevant product page.',
          },
        ],
      },
      {
        label: 'Operations',
        items: [
          {
            id: 'shp-5',
            title: 'Inventory tracking',
            category: 'Fulfillment',
            dateOrMetric: 'Stock levels',
            state: 'Ready',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Administrators update stock and product details from the admin console, and the storefront reflects changes immediately.',
          },
          {
            id: 'shp-6',
            title: 'Persistent cart & wishlist',
            category: 'Account',
            dateOrMetric: 'Saved locally',
            state: 'Completed',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Your cart and saved items survive reloads so you can finish a purchase on your next visit.',
          },
        ],
      },
    ],
  },
  studio: {
    id: 'studio',
    breadcrumb: 'HelzerX Studio / Platform Tour',
    heading: 'Studio delivery pipeline',
    subgroups: [
      {
        label: 'Project workflow',
        items: [
          {
            id: 'stu-1',
            title: 'Project brief submission',
            category: ' intake',
            dateOrMetric: 'One form',
            state: 'Ready',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Submit deliverables, target users, reference links, and technical requirements from a single project brief.',
          },
          {
            id: 'stu-2',
            title: 'Milestone tracking',
            category: 'Planning',
            dateOrMetric: 'Live status',
            state: 'Ready',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Each project records its stage, budget, and timeline so you can follow progress from brief to launch.',
          },
          {
            id: 'stu-3',
            title: 'Shared project messages',
            category: 'Collaboration',
            dateOrMetric: 'Threaded updates',
            state: 'Active',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Questions and updates are stored on the project itself, keeping the full conversation in one place.',
          },
          {
            id: 'stu-4',
            title: 'Role-gated workspace',
            category: 'Security',
            dateOrMetric: 'RBAC',
            state: 'Completed',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Customers only see their own projects, while authorized staff can review and update delivery state.',
          },
        ],
      },
      {
        label: 'Engagement',
        items: [
          {
            id: 'stu-5',
            title: 'Studio service packages',
            category: 'Services',
            dateOrMetric: 'Design & engineering',
            state: 'Ready',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Web platforms, design systems, internal tools, brand systems, and interactive experiences are scoped through the same intake flow.',
          },
          {
            id: 'stu-6',
            title: 'Direct support handoff',
            category: 'Support',
            dateOrMetric: 'Ticket system',
            state: 'Ready',
            owner: 'HelzerX Platform',
            initials: 'HX',
            detail:
              'Anything outside a project can be raised in the support center and tracked to resolution.',
          },
        ],
      },
    ],
  },
};
