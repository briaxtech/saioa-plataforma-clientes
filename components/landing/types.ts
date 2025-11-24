
export type Language = 'es' | 'en' | 'pt';

export type View = 'home' | 'login' | 'signup' | 'contact' | 'privacy' | 'terms' | 'who-we-are' | 'solutions';

export interface NavItem {
  label: string;
  href: string;
}

export interface Plan {
  name: string;
  price: string;
  desc: string;
  features: string[];
}

export interface Translations {
  nav: {
    home: string;
    features: string;
    pricing: string;
    whoWeAre: string;
    resources: string;
    contact: string;
    login: string;
    tryFree: string;
  };
  hero: {
    titleStart: string;
    titleEnd: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: string[];
  };
  showcase: {
    title: string;
    subtitle: string;
    modules: {
      dashboard: string;
      backoffice: string;
    };
  };
  benefits: {
    centralized: { title: string; desc: string };
    automation: { title: "Lexy AI"; desc: string };
    portal: { title: string; desc: string };
    reports: { title: string; desc: string };
  };
  features: {
    title: string;
    subtitle: string;
    cards: {
      management: { title: string; desc: string };
      ai: { title: string; desc: string };
      deadlines: { title: string; desc: string };
      collab: { title: string; desc: string };
    }
  };
  whoWeAre: {
    title: string;
    mission: string;
    values: {
      innovation: { title: string; desc: string };
      transparency: { title: string; desc: string };
      mastery: { title: string; desc: string };
    };
    team: {
      title: string;
      desc: string;
    };
  };
  pricing: {
    title: string;
    monthly: string;
    yearly: string;
    plans: {
      starter: Plan;
      pro: Plan & { badge: string };
      enterprise: Plan;
    };
  };
  testimonials: {
    title: string;
    items: Array<{ quote: string; author: string; role: string; country: string }>;
  };
  faq: {
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  footer: {
    desc: string;
    copyright: string;
  };
  chat: {
    badge: string;
    placeholder: string;
    send: string;
    welcome: string;
    suggestions: string[];
  };
  cookies: {
    text: string;
    accept: string;
    decline: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    emailLabel: string;
    passwordLabel: string;
    loginButton: string;
    signupTitle: string;
    signupSubtitle: string;
    nameLabel: string;
    planLabel: string;
    signupButton: string;
    backToHome: string;
  };
  contactPage: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    message: string;
    submit: string;
    infoTitle: string;
  };
  legal: {
    privacyTitle: string;
    termsTitle: string;
    lastUpdated: string;
  }
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}