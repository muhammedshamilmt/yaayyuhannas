import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "TEAM PORTAL",
    items: [
      {
        title: "Team Admin",
        url: "/team-admin",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Team Draft",
        url: "/admin/draft",
        icon: Icons.User,
        items: [],
      },
    ],
  },
  {
    label: "FESTIVAL MANAGEMENT",
    items: [
      {
        title: "Overview",
        url: "/admin/dashboard",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Teams",
        url: "/admin/teams",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Candidates",
        url: "/admin/candidates",
        icon: Icons.Authentication,
        items: [],
      },
      {
        title: "Programmes",
        url: "/admin/programmes",
        icon: Icons.Calendar,
        items: [],
      },
      {
        title: "Results",
        url: "/admin/results",
        icon: Icons.PieChart,
        items: [],
      },
      {
        title: "Rank & Top",
        url: "/admin/rankings",
        icon: Icons.FourCircle,
        items: [],
      },

      {
        title: "Search",
        url: "/admin/search",
        icon: Icons.Table,
        items: [],
      },


    ],
  },
  {
    label: "CONTENT & SETTINGS",
    items: [
      {
        title: "Gallery",
        url: "/admin/gallery",
        icon: Icons.Calendar,
        items: [],
      },
      {
        title: "Basic",
        url: "/admin/basic",
        icon: Icons.Alphabet,
        items: [],
      },
      {
        title: "Print",
        url: "/admin/print",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "Settings",
        url: "/admin/settings",
        icon: Icons.Authentication,
        items: [],
      },
      {
        title: "Google Sheets",
        url: "/admin/sync",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "Database",
        url: "/admin/database",
        icon: Icons.Table,
        items: [],
      },
    ],
  },
];
