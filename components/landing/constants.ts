
import { Translations, Language } from './types';

export const TRANSLATIONS: Record<Language, Translations> = {
  es: {
    nav: {
      home: "Inicio",
      features: "Soluciones",
      pricing: "Precios",
      whoWeAre: "Quiénes Somos",
      resources: "Recursos",
      contact: "Contacto",
      login: "Acceso Clientes",
      tryFree: "Prueba Gratis",
    },
    hero: {
      titleStart: "El Sistema Operativo",
      titleEnd: "Para Firmas Legales.",
      subtitle: "Blex unifica gestión de casos, facturación y una IA paralegal en una sola plataforma. Diseñado para firmas que buscan dominar su mercado.",
      ctaPrimary: "Empieza a Escalar",
      ctaSecondary: "Ver Demo",
      stats: ["Gestión Integral", "IA Nativa", "Seguridad Bancaria"],
    },
    showcase: {
      title: "Potencia Visualizada",
      subtitle: "Una interfaz diseñada para la velocidad y la precisión.",
      modules: {
        dashboard: "Dashboard Ejecutivo",
        backoffice: "Gestión de Expedientes"
      }
    },
    benefits: {
      centralized: { title: "Control Total", desc: "Tu firma entera en el bolsillo. Accede a cualquier expediente en segundos." },
      automation: { title: "Lexy AI", desc: "Redacta, revisa y completa documentos mientras duermes." },
      portal: { title: "Portal Cliente", desc: "Experiencia VIP. Cero llamadas preguntando '¿cómo va mi caso?'." },
      reports: { title: "Analítica", desc: "Toma decisiones basadas en datos reales, no en intuiciones." },
    },
    features: {
      title: "Arquitectura de Élite",
      subtitle: "Software construido con los estándares de la industria tech para el mundo legal.",
      cards: {
        management: { title: "Gestión de Casos", desc: "Workflows personalizables para cualquier área de práctica legal." },
        ai: { title: "Inteligencia Artificial", desc: "Lexy entiende el contexto legal y automatiza tareas repetitivas." },
        deadlines: { title: "Control de Plazos", desc: "Sistema de alertas obsesivo. Nunca pierdas una fecha límite." },
        collab: { title: "Colaboración", desc: "Asigna tareas y controla el rendimiento del equipo en tiempo real." },
      }
    },
    whoWeAre: {
      title: "Quiénes Somos",
      mission: "Nuestra misión es liberar a los abogados de la carga administrativa para que puedan centrarse en la ley.",
      values: {
        innovation: { title: "Innovación Radical", desc: "Reinventamos procesos legales obsoletos con tecnología de punta." },
        transparency: { title: "Transparencia Total", desc: "Sin letras chicas. Nuestros precios y políticas son claros." },
        mastery: { title: "Maestría Técnica", desc: "Obsesión por la calidad del software y la experiencia de usuario." }
      },
      team: {
        title: "El Equipo",
        desc: "Somos un híbrido de abogados expertos e ingenieros de software de Silicon Valley."
      }
    },
    pricing: {
      title: "Planes Simples y Transparentes",
      monthly: "Mensual",
      yearly: "Anual",
      plans: {
        starter: {
          name: "Starter",
          price: "199€",
          desc: "Para abogados independientes.",
          features: ["Gestión de 50 Casos", "Lexy AI Básico", "Portal Cliente"]
        },
        pro: {
          name: "Pro",
          price: "399€",
          desc: "Para firmas en crecimiento.",
          features: ["Gestión Ilimitada", "Lexy AI Avanzado", "Automatización Documental", "Analytics"],
          badge: "MÁS POPULAR"
        },
        enterprise: {
          name: "Enterprise",
          price: "Custom",
          desc: "Para grandes firmas.",
          features: ["API Dedicada", "Soporte 24/7", "Onboarding Personalizado", "SLA Garantizado"]
        }
      }
    },
    testimonials: {
      title: "Firmas que Escalan",
      items: [
        {
          quote: "Blex transformou nuestra operativa. La IA hace el trabajo de dos paralegales.",
          author: "Dr. Javier Méndez",
          role: "Socio Director",
          country: "España"
        },
        {
          quote: "La interfaz es increíblemente rápida. Nada que ver con el software legal viejo.",
          author: "Dra. Valentina Ruiz",
          role: "Abogada Senior",
          country: "México"
        }
      ]
    },
    faq: {
      title: "Preguntas Frecuentes",
      items: [
        {
          question: "¿Sirve para cualquier tipo de derecho?",
          answer: "Sí. Blex es agnóstico al área de práctica. Puedes configurar workflows para Penal, Civil, Corporativo, Inmigración, etc."
        },
        {
          question: "¿Mis datos están seguros?",
          answer: "Usamos encriptación AES-256 y cumplimos con GDPR. Tu información es confidencial y segura."
        },
        {
          question: "¿Puedo importar mis datos actuales?",
          answer: "Sí, ofrecemos herramientas de migración para traer tus clientes y casos desde Excel u otro software."
        }
      ]
    },
    footer: {
      desc: "Tecnología para abogados que valoran su tiempo.",
      copyright: "© 2024 Blex Inc.",
    },
    chat: {
      badge: "Habla con Lexy",
      placeholder: "Escribe tu consulta...",
      send: "Enviar",
      welcome: "Hola, soy Lexy. ¿En qué puedo ayudarte a optimizar tu firma hoy?",
      suggestions: ["Ver precios", "Agendar demo", "¿Qué hace la IA?"]
    },
    cookies: {
      text: "Usamos cookies para mejorar tu experiencia.",
      accept: "Aceptar",
      decline: "Rechazar"
    },
    auth: {
      loginTitle: "Acceso a Blex",
      loginSubtitle: "Ingresa a tu entorno de trabajo seguro.",
      emailLabel: "Email Profesional",
      passwordLabel: "Contraseña",
      loginButton: "Ingresar",
      signupTitle: "Comienza tu Prueba",
      signupSubtitle: "14 días gratis. Sin tarjeta de crédito.",
      nameLabel: "Nombre Completo",
      planLabel: "Selecciona tu Plan",
      signupButton: "Crear Cuenta",
      backToHome: "Volver al inicio"
    },
    contactPage: {
      title: "Hablemos",
      subtitle: "¿Tienes dudas sobre cómo Blex puede adaptarse a tu firma?",
      name: "Nombre",
      email: "Email",
      message: "Mensaje",
      submit: "Enviar Mensaje",
      infoTitle: "Información"
    },
    legal: {
      privacyTitle: "Política de Privacidad",
      termsTitle: "Términos de Servicio",
      lastUpdated: "Última actualización: Marzo 2024"
    }
  },
  en: {
    nav: {
      home: "Home",
      features: "Solutions",
      pricing: "Pricing",
      whoWeAre: "Who We Are",
      resources: "Resources",
      contact: "Contact",
      login: "Client Access",
      tryFree: "Start Trial",
    },
    hero: {
      titleStart: "The Operating System",
      titleEnd: "For Law Firms.",
      subtitle: "Blex unifies case management, billing, and an AI paralegal in one platform. Designed for firms aiming to dominate their market.",
      ctaPrimary: "Start Scaling",
      ctaSecondary: "Watch Demo",
      stats: ["Integral Management", "Native AI", "Bank-Grade Security"],
    },
    showcase: {
      title: "Visualized Power",
      subtitle: "An interface designed for speed and precision.",
      modules: {
        dashboard: "Executive Dashboard",
        backoffice: "Case Management"
      }
    },
    benefits: {
      centralized: { title: "Total Control", desc: "Your entire firm in your pocket. Access any file in seconds." },
      automation: { title: "Lexy AI", desc: "Drafts, reviews, and completes documents while you sleep." },
      portal: { title: "Client Portal", desc: "VIP Experience. No more 'how is my case going?' calls." },
      reports: { title: "Analytics", desc: "Make decisions based on real data, not gut feelings." },
    },
    features: {
      title: "Elite Architecture",
      subtitle: "Software built with tech industry standards for the legal world.",
      cards: {
        management: { title: "Case Management", desc: "Customizable workflows for any legal practice area." },
        ai: { title: "Artificial Intelligence", desc: "Lexy understands legal context and automates repetitive tasks." },
        deadlines: { title: "Deadline Control", desc: "Obsessive alert system. Never miss a filing date." },
        collab: { title: "Collaboration", desc: "Assign tasks and monitor team performance in real-time." },
      }
    },
    whoWeAre: {
      title: "Who We Are",
      mission: "Our mission is to free lawyers from administrative burdens so they can focus on the law.",
      values: {
        innovation: { title: "Radical Innovation", desc: "Reinventing obsolete legal processes with cutting-edge tech." },
        transparency: { title: "Total Transparency", desc: "No fine print. Our pricing and policies are clear." },
        mastery: { title: "Technical Mastery", desc: "Obsession with software quality and user experience." }
      },
      team: {
        title: "The Team",
        desc: "We are a hybrid of expert lawyers and Silicon Valley software engineers."
      }
    },
    pricing: {
      title: "Simple, Transparent Pricing",
      monthly: "Monthly",
      yearly: "Yearly",
      plans: {
        starter: {
          name: "Starter",
          price: "$199",
          desc: "For independent lawyers.",
          features: ["50 Case Management", "Lexy AI Basic", "Client Portal"]
        },
        pro: {
          name: "Pro",
          price: "$399",
          desc: "For growing firms.",
          features: ["Unlimited Cases", "Lexy AI Advanced", "Document Automation", "Analytics"],
          badge: "MOST POPULAR"
        },
        enterprise: {
          name: "Enterprise",
          price: "Custom",
          desc: "For large firms.",
          features: ["Dedicated API", "24/7 Support", "Custom Onboarding", "SLA Guaranteed"]
        }
      }
    },
    testimonials: {
      title: "Scaling Firms",
      items: [
        {
          quote: "Blex transformed our operations. The AI does the work of two paralegals.",
          author: "Javier Méndez",
          role: "Managing Partner",
          country: "Spain"
        },
        {
          quote: "The interface is incredibly fast. Nothing like old legal software.",
          author: "Valentina Ruiz",
          role: "Senior Associate",
          country: "Mexico"
        }
      ]
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        {
          question: "Does it work for any type of law?",
          answer: "Yes. Blex is practice-area agnostic. You can configure workflows for Criminal, Civil, Corporate, Immigration, etc."
        },
        {
          question: "Is my data secure?",
          answer: "We use AES-256 encryption and comply with GDPR. Your information is confidential and secure."
        },
        {
          question: "Can I import my current data?",
          answer: "Yes, we offer migration tools to bring your clients and cases from Excel or other software."
        }
      ]
    },
    footer: {
      desc: "Technology for lawyers who value their time.",
      copyright: "© 2024 Blex Inc.",
    },
    chat: {
      badge: "Talk to Lexy",
      placeholder: "Type your query...",
      send: "Send",
      welcome: "Hi, I'm Lexy. How can I help optimize your firm today?",
      suggestions: ["See pricing", "Book demo", "What does AI do?"]
    },
    cookies: {
      text: "We use cookies to improve your experience.",
      accept: "Accept",
      decline: "Decline"
    },
    auth: {
      loginTitle: "Login to Blex",
      loginSubtitle: "Enter your secure workspace.",
      emailLabel: "Work Email",
      passwordLabel: "Password",
      loginButton: "Login",
      signupTitle: "Start Your Trial",
      signupSubtitle: "14 days free. No credit card.",
      nameLabel: "Full Name",
      planLabel: "Select Plan",
      signupButton: "Create Account",
      backToHome: "Back to Home"
    },
    contactPage: {
      title: "Let's Talk",
      subtitle: "Questions about how Blex fits your firm?",
      name: "Name",
      email: "Email",
      message: "Message",
      submit: "Send Message",
      infoTitle: "Information"
    },
    legal: {
      privacyTitle: "Privacy Policy",
      termsTitle: "Terms of Service",
      lastUpdated: "Last Updated: March 2024"
    }
  },
  pt: {
    nav: {
      home: "Início",
      features: "Soluções",
      pricing: "Preços",
      whoWeAre: "Quem Somos",
      resources: "Recursos",
      contact: "Contato",
      login: "Acesso Cliente",
      tryFree: "Teste Grátis",
    },
    hero: {
      titleStart: "O Sistema Operacional",
      titleEnd: "Para Escritórios.",
      subtitle: "Blex unifica gestão de casos, faturamento e uma IA paralegal em uma única plataforma. Projetado para escritórios que buscam dominar o mercado.",
      ctaPrimary: "Comece a Escalar",
      ctaSecondary: "Ver Demo",
      stats: ["Gestão Integral", "IA Nativa", "Segurança Bancária"],
    },
    showcase: {
      title: "Potência Visualizada",
      subtitle: "Uma interface desenhada para velocidade e precisão.",
      modules: {
        dashboard: "Dashboard Executivo",
        backoffice: "Gestão de Processos"
      }
    },
    benefits: {
      centralized: { title: "Controle Total", desc: "Seu escritório inteiro no bolso. Acesse qualquer arquivo em segundos." },
      automation: { title: "Lexy AI", desc: "Redige, revisa e completa documentos enquanto você dorme." },
      portal: { title: "Portal do Cliente", desc: "Experiência VIP. Zero ligações perguntando 'como está meu caso?'." },
      reports: { title: "Analítica", desc: "Tome decisões baseadas em dados reais, não em intuição." },
    },
    features: {
      title: "Arquitetura de Elite",
      subtitle: "Software construído com padrões da indústria tech para o mundo jurídico.",
      cards: {
        management: { title: "Gestão de Casos", desc: "Workflows personalizáveis para qualquer área do direito." },
        ai: { title: "Inteligência Artificial", desc: "Lexy entende o contexto jurídico e automatiza tarefas repetitivas." },
        deadlines: { title: "Controle de Prazos", desc: "Sistema de alertas obsessivo. Nunca perca uma data." },
        collab: { title: "Colaboração", desc: "Atribua tarefas e monitore o desempenho da equipe em tempo real." },
      }
    },
    whoWeAre: {
      title: "Quem Somos",
      mission: "Nossa missão é liberar os advogados da carga administrativa para que possam focar na lei.",
      values: {
        innovation: { title: "Inovação Radical", desc: "Reinventamos processos jurídicos obsoletos com tecnologia de ponta." },
        transparency: { title: "Transparência Total", desc: "Sem letras miúdas. Nossos preços e políticas são claros." },
        mastery: { title: "Maestria Técnica", desc: "Obsessão pela qualidade do software e experiência do usuário." }
      },
      team: {
        title: "A Equipe",
        desc: "Somos um híbrido de advogados especialistas e engenheiros de software do Vale do Silício."
      }
    },
    pricing: {
      title: "Planos Simples e Transparentes",
      monthly: "Mensal",
      yearly: "Anual",
      plans: {
        starter: {
          name: "Starter",
          price: "R$ 990",
          desc: "Para advogados independentes.",
          features: ["Gestão de 50 Casos", "Lexy IA Básico", "Portal do Cliente"]
        },
        pro: {
          name: "Pro",
          price: "R$ 1.990",
          desc: "Para escritórios em crescimento.",
          features: ["Gestão Ilimitada", "Lexy IA Avançado", "Automação Documental", "Analytics"],
          badge: "MAIS POPULAR"
        },
        enterprise: {
          name: "Enterprise",
          price: "Sob Consulta",
          desc: "Para grandes escritórios.",
          features: ["API Dedicada", "Suporte 24/7", "Onboarding Personalizado", "SLA Garantido"]
        }
      }
    },
    testimonials: {
      title: "Escritórios que Escalável",
      items: [
        {
          quote: "Blex transformou nossa operação. A IA faz o trabalho de dois paralegais.",
          author: "Dr. Javier Méndez",
          role: "Sócio Diretor",
          country: "Espanha"
        },
        {
          quote: "A interface é incrivelmente rápida. Nada a ver com software jurídico antigo.",
          author: "Dra. Valentina Ruiz",
          role: "Advogada Sênior",
          country: "México"
        }
      ]
    },
    faq: {
      title: "Perguntas Frequentes",
      items: [
        {
          question: "Serve para qualquer tipo de direito?",
          answer: "Sim. Blex é agnóstico à área de prática. Você pode configurar workflows para Penal, Cível, Corporativo, Imigração, etc."
        },
        {
          question: "Meus dados estão seguros?",
          answer: "Usamos criptografia AES-256 e cumprimos com GDPR. Sua informação é confidencial e segura."
        },
        {
          question: "Posso importar meus dados atuais?",
          answer: "Sim, oferecemos ferramentas de migração para trazer seus clientes e casos do Excel ou outro software."
        }
      ]
    },
    footer: {
      desc: "Tecnologia para advogados que valorizam seu tempo.",
      copyright: "© 2024 Blex Inc.",
    },
    chat: {
      badge: "Fale com Lexy",
      placeholder: "Digite sua dúvida...",
      send: "Enviar",
      welcome: "Olá, sou Lexy. Como posso ajudar a otimizar seu escritório hoje?",
      suggestions: ["Ver preços", "Agendar demo", "O que a IA faz?"]
    },
    cookies: {
      text: "Usamos cookies para melhorar sua experiência.",
      accept: "Aceitar",
      decline: "Recusar"
    },
    auth: {
      loginTitle: "Acesso Blex",
      loginSubtitle: "Entre no seu ambiente de trabalho seguro.",
      emailLabel: "E-mail Profissional",
      passwordLabel: "Senha",
      loginButton: "Entrar",
      signupTitle: "Comece seu Teste",
      signupSubtitle: "14 días grátis. Sem cartão de crédito.",
      nameLabel: "Nome Completo",
      planLabel: "Selecione seu Plano",
      signupButton: "Criar Conta",
      backToHome: "Voltar ao início"
    },
    contactPage: {
      title: "Vamos Conversar",
      subtitle: "Dúvidas sobre como o Blex pode se adaptar ao seu escritório?",
      name: "Nome",
      email: "E-mail",
      message: "Mensagem",
      submit: "Enviar Mensagem",
      infoTitle: "Informação"
    },
    legal: {
      privacyTitle: "Política de Privacidade",
      termsTitle: "Termos de Serviço",
      lastUpdated: "Última atualização: Março 2024"
    }
  }
};

export const SYSTEM_PROMPTS = {
  es: `Eres Lexy, el asistente virtual de Blex. Eres experta en tecnología legal y gestión de firmas. Objetivo: Convencer al abogado de modernizar su firma con Blex. Tono: Profesional, directo, tech-savvy.`,
  pt: `Você é Lexy, a assistente virtual da Blex. Você é especialista em tecnologia jurídica e gestão de escritórios. Objetivo: Convencer o advogado a modernizar seu escritório com Blex. Tom: Profissional, direto, tech-savvy.`,
  en: `You are Lexi, the virtual assistant for Blex. You are an expert in legal tech and firm management. Goal: Convince the lawyer to modernize their firm with Blex. Tone: Professional, direct, tech-savvy.`
};
