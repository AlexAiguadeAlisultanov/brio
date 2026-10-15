// Contenido de la landing en los tres idiomas. El español es la fuente de verdad del tipo
// (los otros dos lo cumplen con `satisfies`, asi no se queda ningun texto sin traducir). El
// copy va con voz humana: frases cortas, directas, sin cliches.

export type Lang = 'es' | 'ca' | 'en'

export const IDIOMAS: { codigo: Lang; etiqueta: string; nombre: string }[] = [
  { codigo: 'es', etiqueta: 'ES', nombre: 'Español' },
  { codigo: 'ca', etiqueta: 'CA', nombre: 'Català' },
  { codigo: 'en', etiqueta: 'EN', nombre: 'English' },
]

const es = {
  nav: {
    funciones: 'Qué hace',
    capturas: 'Cómo se ve',
    descarga: 'Descargar',
    faq: 'Dudas',
    descargar: 'Descargar',
  },
  hero: {
    eyebrow: 'Entreno y dieta en una app',
    titulo: 'Tu cuerpo, con un plan que piensa por ti',
    sub: 'Brío monta tu rutina de gimnasio y tus comidas a partir de tus datos reales, y las cambia cuando algo no te encaja. Los números los calcula un motor que no improvisa y funciona sin internet.',
    ctaDescargar: 'Descargar para Android',
    ctaProximamente: 'Disponible muy pronto',
    ctaSecundario: 'Ver qué hace',
    disclaimer: 'Brío te orienta, no sustituye a tu médico ni a tu dietista-nutricionista.',
  },
  tiras: ['Lo esencial, gratis', 'Funciona sin internet', 'Tus datos, en tu móvil'],
  funciones: {
    titulo: 'Qué hace Brío',
    intro: 'Nada de rutinas genéricas. Brío parte de ti y rehace el plan cuando hace falta.',
    items: [
      {
        icono: 'target',
        titulo: 'Un plan a partir de tus datos',
        texto: 'Con tu cuerpo, tu actividad y cómo entrenas calcula tu gasto, tus calorías y tus macros, y te arma la rutina de tu objetivo con su progresión semana a semana.',
      },
      {
        icono: 'refresh',
        titulo: 'Se adapta cuando algo no encaja',
        texto: 'Si una comida o un ejercicio no te va, pides el cambio. Brío distingue entre lo que no puedes hacer y lo que hoy no te apetece, y te propone una alternativa equivalente.',
      },
      {
        icono: 'shield',
        titulo: 'Seguridad antes que los números',
        texto: 'Suelos de calorías, límites de déficit y banderas que te mandan al médico cuando toca. Las alergias y las lesiones no se tocan nunca, pase lo que pase con el plan.',
      },
      {
        icono: 'cpu',
        titulo: 'Un motor que no improvisa',
        texto: 'Calorías, macros, series y sustituciones las calcula un motor probado con tests. La misma entrada da siempre el mismo plan, y todo funciona sin conexión.',
      },
      {
        icono: 'lock',
        titulo: 'Tus datos se quedan contigo',
        texto: 'Lo que cuentas de tu cuerpo vive en tu teléfono. La IA es opcional y va apagada; si la enciendes, solo salen unas etiquetas para pedir una alternativa, nunca tu perfil.',
      },
      {
        icono: 'trending',
        titulo: 'Progreso con tu peso real',
        texto: 'Tu tendencia de peso suavizada, tus marcas y un calendario de constancia que no te castiga por un mal día. Cada semana el plan se reajusta con lo que de verdad pasó.',
      },
    ],
  },
  capturas: {
    titulo: 'Cómo se ve',
    intro: 'Pensada para el móvil, de un vistazo y sin ruido.',
    items: [
      {
        pantalla: 'plan' as const,
        etiqueta: 'El plan',
        titulo: 'Tu semana, montada',
        texto: 'Entreno y comidas por días, con la lista de la compra ya reunida.',
      },
      {
        pantalla: 'cambios' as const,
        etiqueta: 'Cambios',
        titulo: 'Cámbialo sin romper el plan',
        texto: 'Elige por qué lo cambias y Brío te da alternativas que respetan tus límites, las más parecidas primero.',
      },
      {
        pantalla: 'progreso' as const,
        etiqueta: 'Progreso',
        titulo: 'Lo que de verdad pasó',
        texto: 'Tu tendencia de peso real, tus marcas y una racha que perdona los días flojos.',
      },
    ],
  },
  descarga: {
    titulo: 'Descárgala y pruébala',
    texto: 'Brío está en beta y por ahora es para Android. Montar el plan, el día a día y los cambios por el motor local son gratis.',
    boton: 'Descargar para Android (APK)',
    botonProximamente: 'Próximamente',
    pendienteNota: 'El enlace de descarga estará disponible muy pronto. Vuelve en unos días.',
    requisitos: 'Android · archivo .apk para instalar a mano',
    instalar: 'Al abrir el archivo, Android te pedirá permiso para instalar apps de esta fuente. Es lo normal al instalar un APK fuera de Play Store.',
    betaTitulo: 'Es una beta',
    betaTexto: 'Seguimos puliendo cosas y añadiendo otras. Si algo no funciona como esperabas, es parte del camino. La versión de iPhone llegará más adelante.',
  },
  faq: {
    titulo: 'Preguntas rápidas',
    items: [
      {
        q: '¿Es gratis?',
        a: 'Sí. Montar el plan, el día a día, registrar tus series y comidas y los cambios por el motor local no cuestan nada. Hay un Premium opcional que añade los cambios con IA, el check-in semanal, cambiar de objetivo, la lista de la compra y el progreso avanzado.',
      },
      {
        q: '¿Funciona sin internet?',
        a: 'Sí. Todos los números los calcula un motor dentro del propio teléfono. La IA es un extra; sin ella, el motor local te propone igual los cambios.',
      },
      {
        q: '¿Qué pasa con mis datos?',
        a: 'Tus datos del cuerpo y del cuestionario de salud se quedan en tu teléfono. Si activas la IA, que va apagada por defecto, solo salen unas etiquetas (rangos y exclusiones), nunca tu perfil.',
      },
      {
        q: '¿Sustituye a un médico o a un dietista?',
        a: 'No. Brío te orienta. Si tienes una condición, estás embarazada o tomas medicación, consúltalo antes de empezar.',
      },
      {
        q: '¿Y el iPhone?',
        a: 'Por ahora la beta es solo para Android. La versión de iPhone llegará más adelante.',
      },
    ],
  },
  footer: {
    tagline: 'Tu entreno y tus comidas, con cabeza.',
    disclaimer: 'Brío te orienta, no sustituye a tu médico ni a tu dietista-nutricionista. Si tienes una condición, estás embarazada o tomas medicación, consúltalo antes.',
    repo: 'Código en GitHub',
    credito: 'Hecho por Alex Aiguadé',
    copyright: '© 2026 Brío',
  },
  mock: {
    hoy: 'Hoy',
    restantes: 'te quedan',
    kcal: 'kcal',
    proteina: 'Proteína',
    carbos: 'Carbos',
    grasa: 'Grasa',
    comida: 'Comida',
    comidaNombre: 'Pollo al horno con arroz',
    entreno: 'Entreno de hoy',
    entrenoDetalle: 'Torso · 6 ejercicios',
    registrar: 'Registrar',
    plan: 'Tu plan',
    objetivo: 'Objetivo',
    semana: 'Tu semana',
    cambiarComida: 'Cambiar comida',
    noPuedo: 'No puedo con esto',
    noApetece: 'Hoy no me apetece',
    alternativa: 'Pavo a la plancha',
    delta: '+15 kcal · misma proteína',
    elegir: 'Elegir',
    progreso: 'Progreso',
    ritmo: '−0,4 kg/sem',
    racha: '5 días seguidos',
    dias: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  },
}

type Contenido = typeof es

const ca: Contenido = {
  nav: {
    funciones: 'Què fa',
    capturas: 'Com es veu',
    descarga: 'Descarregar',
    faq: 'Dubtes',
    descargar: 'Descarregar',
  },
  hero: {
    eyebrow: 'Entreno i dieta en una app',
    titulo: 'El teu cos, amb un pla que pensa per tu',
    sub: 'Brío munta la teva rutina de gimnàs i els teus àpats a partir de les teves dades reals, i els canvia quan alguna cosa no et va bé. Els números els calcula un motor que no improvisa i funciona sense internet.',
    ctaDescargar: 'Descarregar per a Android',
    ctaProximamente: 'Disponible molt aviat',
    ctaSecundario: 'Mira què fa',
    disclaimer: "Brío t'orienta, no substitueix el teu metge ni el teu dietista-nutricionista.",
  },
  tiras: ["L'essencial, gratis", 'Funciona sense internet', 'Les teves dades, al teu mòbil'],
  funciones: {
    titulo: 'Què fa Brío',
    intro: 'Res de rutines genèriques. Brío parteix de tu i refà el pla quan cal.',
    items: [
      {
        icono: 'target',
        titulo: 'Un pla a partir de les teves dades',
        texto: 'Amb el teu cos, la teva activitat i com entrenes calcula la teva despesa, les teves calories i els teus macros, i et munta la rutina del teu objectiu amb la progressió setmana a setmana.',
      },
      {
        icono: 'refresh',
        titulo: "S'adapta quan alguna cosa no encaixa",
        texto: "Si un àpat o un exercici no et va, demanes el canvi. Brío distingeix entre el que no pots fer i el que avui no et ve de gust, i et proposa una alternativa equivalent.",
      },
      {
        icono: 'shield',
        titulo: 'Seguretat abans que els números',
        texto: "Terres de calories, límits de dèficit i banderes que et porten al metge quan toca. Les al·lèrgies i les lesions no es toquen mai, passi el que passi amb el pla.",
      },
      {
        icono: 'cpu',
        titulo: 'Un motor que no improvisa',
        texto: 'Calories, macros, sèries i substitucions les calcula un motor provat amb tests. La mateixa entrada dóna sempre el mateix pla, i tot funciona sense connexió.',
      },
      {
        icono: 'lock',
        titulo: 'Les teves dades es queden amb tu',
        texto: "El que expliques del teu cos viu al teu telèfon. La IA és opcional i va apagada; si l'encens, només surten unes etiquetes per demanar una alternativa, mai el teu perfil.",
      },
      {
        icono: 'trending',
        titulo: 'Progrés amb el teu pes real',
        texto: 'La teva tendència de pes suavitzada, les teves marques i un calendari de constància que no et castiga per un mal dia. Cada setmana el pla es reajusta amb el que de debò va passar.',
      },
    ],
  },
  capturas: {
    titulo: 'Com es veu',
    intro: "Pensada per al mòbil, d'un cop d'ull i sense soroll.",
    items: [
      {
        pantalla: 'plan' as const,
        etiqueta: 'El pla',
        titulo: 'La teva setmana, muntada',
        texto: 'Entreno i àpats per dies, amb la llista de la compra ja reunida.',
      },
      {
        pantalla: 'cambios' as const,
        etiqueta: 'Canvis',
        titulo: 'Canvia-ho sense trencar el pla',
        texto: 'Tria per què ho canvies i Brío et dóna alternatives que respecten els teus límits, les més semblants primer.',
      },
      {
        pantalla: 'progreso' as const,
        etiqueta: 'Progrés',
        titulo: 'El que de debò va passar',
        texto: 'La teva tendència de pes real, les teves marques i una ratxa que perdona els dies fluixos.',
      },
    ],
  },
  descarga: {
    titulo: 'Descarrega-la i prova-la',
    texto: 'Brío està en beta i de moment és per a Android. Muntar el pla, el dia a dia i els canvis pel motor local són gratis.',
    boton: 'Descarregar per a Android (APK)',
    botonProximamente: 'Properament',
    pendienteNota: "L'enllaç de descàrrega estarà disponible molt aviat. Torna d'aquí uns dies.",
    requisitos: 'Android · fitxer .apk per instal·lar a mà',
    instalar: "En obrir el fitxer, Android et demanarà permís per instal·lar apps d'aquesta font. És el normal en instal·lar un APK fora de Play Store.",
    betaTitulo: 'És una beta',
    betaTexto: "Continuem polint coses i afegint-ne d'altres. Si alguna cosa no funciona com esperaves, forma part del camí. La versió d'iPhone arribarà més endavant.",
  },
  faq: {
    titulo: 'Preguntes ràpides',
    items: [
      {
        q: 'És gratis?',
        a: "Sí. Muntar el pla, el dia a dia, registrar les teves sèries i àpats i els canvis pel motor local no costen res. Hi ha un Premium opcional que afegeix els canvis amb IA, el check-in setmanal, canviar d'objectiu, la llista de la compra i el progrés avançat.",
      },
      {
        q: 'Funciona sense internet?',
        a: 'Sí. Tots els números els calcula un motor dins del mateix telèfon. La IA és un extra; sense ella, el motor local et proposa igual els canvis.',
      },
      {
        q: 'Què passa amb les meves dades?',
        a: 'Les teves dades del cos i del qüestionari de salut es queden al teu telèfon. Si actives la IA, que va apagada per defecte, només surten unes etiquetes (rangs i exclusions), mai el teu perfil.',
      },
      {
        q: 'Substitueix un metge o un dietista?',
        a: "No. Brío t'orienta. Si tens una condició, estàs embarassada o prens medicació, consulta-ho abans de començar.",
      },
      {
        q: "I l'iPhone?",
        a: "De moment la beta és només per a Android. La versió d'iPhone arribarà més endavant.",
      },
    ],
  },
  footer: {
    tagline: 'El teu entreno i els teus àpats, amb cap.',
    disclaimer: "Brío t'orienta, no substitueix el teu metge ni el teu dietista-nutricionista. Si tens una condició, estàs embarassada o prens medicació, consulta-ho abans.",
    repo: 'Codi a GitHub',
    credito: 'Fet per Alex Aiguadé',
    copyright: '© 2026 Brío',
  },
  mock: {
    hoy: 'Avui',
    restantes: 'et queden',
    kcal: 'kcal',
    proteina: 'Proteïna',
    carbos: 'Carbos',
    grasa: 'Greix',
    comida: 'Àpat',
    comidaNombre: 'Pollastre al forn amb arròs',
    entreno: "Entreno d'avui",
    entrenoDetalle: 'Tors · 6 exercicis',
    registrar: 'Registrar',
    plan: 'El teu pla',
    objetivo: 'Objectiu',
    semana: 'La teva setmana',
    cambiarComida: 'Canviar àpat',
    noPuedo: 'No puc amb això',
    noApetece: 'Avui no em ve de gust',
    alternativa: 'Gall dindi a la planxa',
    delta: '+15 kcal · mateixa proteïna',
    elegir: 'Triar',
    progreso: 'Progrés',
    ritmo: '−0,4 kg/set',
    racha: '5 dies seguits',
    dias: ['dl', 'dt', 'dc', 'dj', 'dv', 'ds', 'dg'],
  },
}

const en: Contenido = {
  nav: {
    funciones: 'Features',
    capturas: 'Screens',
    descarga: 'Download',
    faq: 'FAQ',
    descargar: 'Download',
  },
  hero: {
    eyebrow: 'Training and diet in one app',
    titulo: 'Your body, with a plan that thinks for you',
    sub: "Brío builds your gym routine and your meals from your real data, and changes them when something doesn't fit. The numbers come from an engine that doesn't improvise and works offline.",
    ctaDescargar: 'Download for Android',
    ctaProximamente: 'Coming very soon',
    ctaSecundario: 'See what it does',
    disclaimer: 'Brío is guidance, not a replacement for your doctor or your dietitian.',
  },
  tiras: ['The essentials, free', 'Works offline', 'Your data stays on your phone'],
  funciones: {
    titulo: 'What Brío does',
    intro: 'No generic routines. Brío starts from you and rebuilds the plan when it needs to.',
    items: [
      {
        icono: 'target',
        titulo: 'A plan from your own data',
        texto: 'From your body, your activity and how you train, it works out your expenditure, your calories and your macros, and builds the routine for your goal with its week-by-week progression.',
      },
      {
        icono: 'refresh',
        titulo: "It adapts when something doesn't fit",
        texto: "If a meal or an exercise doesn't work for you, ask for a swap. Brío tells apart what you can't do from what you just don't fancy today, and offers an equivalent alternative.",
      },
      {
        icono: 'shield',
        titulo: 'Safety before the numbers',
        texto: 'Calorie floors, deficit limits and flags that send you to a doctor when they should. Allergies and injuries are never touched, whatever happens with the plan.',
      },
      {
        icono: 'cpu',
        titulo: "An engine that doesn't improvise",
        texto: 'Calories, macros, sets and swaps are worked out by an engine covered with tests. The same input always gives the same plan, and it all works offline.',
      },
      {
        icono: 'lock',
        titulo: 'Your data stays with you',
        texto: 'What you tell it about your body lives on your phone. AI is optional and off by default; if you turn it on, only a few labels leave to ask for an alternative, never your profile.',
      },
      {
        icono: 'trending',
        titulo: 'Progress from your real weight',
        texto: "Your smoothed weight trend, your personal bests and a consistency calendar that doesn't punish a bad day. Each week the plan readjusts with what actually happened.",
      },
    ],
  },
  capturas: {
    titulo: 'How it looks',
    intro: 'Built for the phone, clear at a glance and without noise.',
    items: [
      {
        pantalla: 'plan' as const,
        etiqueta: 'The plan',
        titulo: 'Your week, laid out',
        texto: 'Training and meals by day, with the shopping list already gathered.',
      },
      {
        pantalla: 'cambios' as const,
        etiqueta: 'Swaps',
        titulo: 'Change it without breaking the plan',
        texto: "Pick why you're changing it and Brío gives you alternatives that respect your limits, the closest ones first.",
      },
      {
        pantalla: 'progreso' as const,
        etiqueta: 'Progress',
        titulo: 'What actually happened',
        texto: 'Your real weight trend, your bests and a streak that forgives the off days.',
      },
    ],
  },
  descarga: {
    titulo: 'Download it and try it',
    texto: 'Brío is in beta and Android-only for now. Building the plan, the day-to-day and local-engine swaps are free.',
    boton: 'Download for Android (APK)',
    botonProximamente: 'Coming soon',
    pendienteNota: 'The download link will be ready very soon. Check back in a few days.',
    requisitos: 'Android · .apk file to install manually',
    instalar: "When you open the file, Android will ask permission to install apps from this source. That's normal when installing an APK outside the Play Store.",
    betaTitulo: "It's a beta",
    betaTexto: "We keep polishing things and adding others. If something doesn't work as you expected, that's part of the ride. The iPhone version will come later.",
  },
  faq: {
    titulo: 'Quick questions',
    items: [
      {
        q: 'Is it free?',
        a: 'Yes. Building the plan, the day-to-day, logging your sets and meals and local-engine swaps cost nothing. There is an optional Premium that adds AI swaps, the weekly check-in, changing your goal, the shopping list and advanced progress.',
      },
      {
        q: 'Does it work offline?',
        a: 'Yes. All the numbers are worked out by an engine inside the phone itself. AI is an extra; without it, the local engine still suggests your swaps.',
      },
      {
        q: 'What about my data?',
        a: 'Your body data and the health questionnaire stay on your phone. If you turn on AI, which is off by default, only a few labels leave (ranges and exclusions), never your profile.',
      },
      {
        q: 'Does it replace a doctor or a dietitian?',
        a: "No. Brío is guidance. If you have a condition, you're pregnant or you take medication, check with them before you start.",
      },
      {
        q: 'What about iPhone?',
        a: 'For now the beta is Android-only. The iPhone version will come later.',
      },
    ],
  },
  footer: {
    tagline: 'Your training and your meals, done with your head.',
    disclaimer: "Brío is guidance, not a replacement for your doctor or your dietitian. If you have a condition, you're pregnant or you take medication, check first.",
    repo: 'Code on GitHub',
    credito: 'Made by Alex Aiguadé',
    copyright: '© 2026 Brío',
  },
  mock: {
    hoy: 'Today',
    restantes: 'left',
    kcal: 'kcal',
    proteina: 'Protein',
    carbos: 'Carbs',
    grasa: 'Fat',
    comida: 'Meal',
    comidaNombre: 'Baked chicken with rice',
    entreno: "Today's workout",
    entrenoDetalle: 'Upper · 6 exercises',
    registrar: 'Log',
    plan: 'Your plan',
    objetivo: 'Target',
    semana: 'Your week',
    cambiarComida: 'Swap meal',
    noPuedo: "I can't have this",
    noApetece: 'Not feeling it today',
    alternativa: 'Grilled turkey',
    delta: '+15 kcal · same protein',
    elegir: 'Choose',
    progreso: 'Progress',
    ritmo: '−0.4 kg/wk',
    racha: '5-day streak',
    dias: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  },
}

export const CONTENIDO: Record<Lang, Contenido> = { es, ca, en }

// URL del repositorio, comun a los tres idiomas.
export const REPO_URL = 'https://github.com/AlexAiguadeAlisultanov/brio'

export type { Contenido }
