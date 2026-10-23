/**
 * Jedno źródło prawdy o firmie, usługach i FAQ.
 * Z tych danych generowane są: treść stron, JSON-LD (schema.org), llms.txt, sitemap.
 */

export const SITE = {
  url: 'https://grupowe.pro',
  name: 'grupowe.pro',
  tagline: 'Ubezpieczenia grupowe dla firm – broker Aura Consulting',
  description:
    'Niezależny broker ubezpieczeniowy. Grupowe ubezpieczenia na życie, opieka medyczna, LAVEN i MediSky dla pracowników firm. Analiza rynku i wdrożenie bezpłatne.',
  locale: 'pl_PL',
  lang: 'pl',
  phone: '+48 500 502 702',
  phoneHref: 'tel:+48500502702',
  phoneDisplay: '500 502 702',
  email: 'biuro@grupowe.pro',
  instagram: 'https://www.instagram.com/grupowe.pro/',
  gaId: 'G-L5S53BCN1K',
  web3formsKey: 'afbc1d1c-d275-4e6b-86f0-fd4393ca30be',
  ogImage: '/og-default.png',
} as const;

export const COMPANY = {
  legalName: 'Aura Consulting spółka z ograniczoną odpowiedzialnością',
  shortName: 'Aura Consulting',
  street: 'ul. Bolkowska 2A lok. 28',
  postalCode: '01-466',
  city: 'Warszawa',
  country: 'PL',
  krs: '0000426835',
  regon: '341302033',
  shareCapital: '34 000 zł',
  court: 'Sąd Rejonowy dla m.st. Warszawy, XII Wydział Gospodarczy KRS',
  knfPermit: '1972/13',
  brokerRegister: '00001851/U',
  website: 'https://www.auraconsulting.pl',
  foundingYear: 2012,
} as const;

export const NAV = [
  { href: '/#uslugi', label: 'Zakres ochrony' },
  { href: '/o-nas/', label: 'Dlaczego broker' },
  { href: '/aktualnosci/', label: 'Aktualności' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/kontakt/', label: 'Kontakt' },
] as const;

export interface Service {
  slug: string;
  name: string;
  shortName: string;
  badge: string;
  title: string; // <title> strony
  description: string; // meta description
  lead: string; // nagłówek karty / wstęp
  summary: string; // 1–2 zdania do karty na stronie głównej
  intro: string[]; // akapity wstępu
  forWhom: string[];
  covers: { title: string; text: string }[];
  process: string[];
  faq: { q: string; a: string }[];
  cta: string;
  image: { src: string; alt: string };
  schemaType: string; // schema.org serviceType
}

export const SERVICES: Service[] = [
  {
    slug: 'ubezpieczenie-grupowe-na-zycie',
    name: 'Grupowe ubezpieczenie na życie',
    shortName: 'Życie',
    badge: 'Fundament ochrony',
    title: 'Grupowe ubezpieczenie na życie dla pracowników | grupowe.pro',
    description:
      'Grupowe ubezpieczenie na życie dla firm od 3 pracowników: poważne zachorowanie, szpital, NNW, urodzenie dziecka. Bez ankiet medycznych. Broker Aura Consulting.',
    lead: 'Trzon bezpieczeństwa socjalnego w firmie.',
    summary:
      'Niezawodna ochrona finansowa dla pracowników i ich rodzin na wypadek nieprzewidzianych, trudnych zdarzeń losowych.',
    intro: [
      'Grupowe ubezpieczenie na życie to podstawowy benefit pracowniczy w Polsce i najczęściej wybierany element programu ochrony w firmach każdej wielkości. Polisa obejmuje wszystkich pracowników jedną umową, co daje warunki niedostępne przy ubezpieczeniach indywidualnych: niższą składkę, szerszy zakres i brak ankiet medycznych.',
      'Ubezpieczenie na życie to nie tylko świadczenie w przypadku najgorszego. To realna pomoc finansowa w kluczowych momentach życia pracownika: przy poważnej chorobie, pobycie w szpitalu, wypadku czy narodzinach dziecka.',
    ],
    forWhom: [
      'Firmy zatrudniające od 3–5 pracowników (sektor MŚP) do dużych korporacji.',
      'Pracodawcy, którzy chcą finansować składkę w całości jako koszt uzyskania przychodu.',
      'Firmy, w których składkę opłaca pracownik przez potrącenie z wynagrodzenia, a pracodawca zapewnia dostęp do grupowych warunków.',
      'Organizacje, które mają już polisę grupową i chcą bezpłatnie sprawdzić, czy jej zakres i cena są nadal konkurencyjne.',
    ],
    covers: [
      { title: 'Ochrona finansowa', text: 'Wypłaty w przypadku poważnego zachorowania, pobytu w szpitalu, operacji chirurgicznej czy trwałego uszczerbku na zdrowiu w wyniku nieszczęśliwego wypadku (NNW).' },
      { title: 'Pakiet rodzinny', text: 'Świadczenia za urodzenie dziecka, śmierć rodziców lub teściów, osierocenie dziecka. Możliwość objęcia ochroną współmałżonka i pełnoletnich dzieci.' },
      { title: 'Elastyczność', text: 'Brak ankiet medycznych dla grup, kilka wariantów do wyboru dla pracownika, możliwość indywidualnej kontynuacji polisy po odejściu z pracy.' },
      { title: 'Prosta obsługa', text: 'Jedna umowa, jedna składka, elektroniczne deklaracje przystąpienia i obsługa roszczeń online. Broker wspiera dział HR na każdym etapie.' },
    ],
    process: [
      'Analiza struktury zatrudnienia i obecnej polisy (jeśli istnieje).',
      'Zapytanie ofertowe do wszystkich liczących się towarzystw ubezpieczeniowych w Polsce.',
      'Porównanie ofert w jednej tabeli: zakres, sumy ubezpieczenia, wyłączenia, cena.',
      'Negocjacje warunków i rekomendacja brokera.',
      'Wdrożenie: komunikacja do pracowników, deklaracje, start ochrony.',
      'Bieżąca obsługa i pomoc przy roszczeniach przez cały okres umowy.',
    ],
    faq: [
      { q: 'Czy pracownicy muszą wypełniać ankiety medyczne?', a: 'W ubezpieczeniach grupowych dla firm co do zasady nie ma ankiet medycznych. Ochroną objęci są wszyscy pracownicy, którzy przystąpią do polisy, niezależnie od stanu zdrowia.' },
      { q: 'Kto płaci składkę?', a: 'Składkę może opłacać w całości pracodawca (koszt uzyskania przychodu), w całości pracownik (potrącenie z pensji) lub obie strony w ustalonych proporcjach.' },
      { q: 'Co się dzieje z polisą po odejściu pracownika z firmy?', a: 'Pracownik ma zazwyczaj prawo do indywidualnej kontynuacji ubezpieczenia na warunkach zbliżonych do grupowych, bez ponownej oceny ryzyka.' },
    ],
    cta: 'Zapytaj o wycenę ubezpieczenia na życie',
    image: { src: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80', alt: 'Rodzina na spacerze – ochrona finansowa bliskich' },
    schemaType: 'Grupowe ubezpieczenie na życie',
  },
  {
    slug: 'grupowa-opieka-medyczna',
    name: 'Grupowa opieka medyczna',
    shortName: 'Zdrowie',
    badge: 'Codzienne zdrowie',
    title: 'Grupowa opieka medyczna dla firm – pakiety medyczne | grupowe.pro',
    description:
      'Pakiety medyczne dla pracowników: LUX MED, Medicover, enel-med, PZU Zdrowie, Polmed. Porównanie ofert i negocjacje przez brokera. Bezpłatny audyt pakietu.',
    lead: 'Najbardziej pożądany benefit na polskim rynku pracy.',
    summary:
      'Błyskawiczny dostęp do lekarzy specjalistów i zaawansowanych badań diagnostycznych – bez skierowań i długich kolejek w NFZ.',
    intro: [
      'Prywatna opieka medyczna to benefit, o który pracownicy pytają najczęściej, i jeden z najskuteczniejszych argumentów w rekrutacji. Gwarantuje dostęp do lekarzy i diagnostyki z pominięciem kolejek w NFZ, co w praktyce skraca absencję chorobową i czas trwania zwolnień L4.',
      'Jako broker porównujemy oferty wszystkich liczących się operatorów medycznych i ubezpieczycieli zdrowotnych w Polsce (m.in. LUX MED, Medicover, enel-med, PZU Zdrowie, Polmed, TU Zdrowie, Compensa, Allianz) i negocjujemy warunki, których firma nie uzyska samodzielnie.',
    ],
    forWhom: [
      'Firmy wprowadzające pakiety medyczne po raz pierwszy.',
      'Firmy, które mają pakiet od lat i nigdy nie sprawdzały, czy płacą rynkową cenę.',
      'Organizacje z rozproszonymi lokalizacjami, którym zależy na sieci placówek w całym kraju.',
      'Pracodawcy chcący dołożyć pakiety dla rodzin pracowników (partner, dzieci).',
    ],
    covers: [
      { title: 'Lekarze specjaliści', text: 'Setki placówek partnerskich w całym kraju. Wizyty bez skierowań, zwykle w ciągu kilku dni roboczych.' },
      { title: 'Diagnostyka', text: 'Badania laboratoryjne, RTG, USG, rezonans magnetyczny i tomografia komputerowa w zakresie zależnym od wariantu pakietu.' },
      { title: 'E-zdrowie', text: 'Konsultacje telemedyczne z e-receptą i e-zwolnieniem dostępne 24/7 z aplikacji operatora.' },
      { title: 'Rozszerzenia', text: 'Stomatologia, rehabilitacja, medycyna pracy, szczepienia, profilaktyka i programy zdrowia psychicznego – do wyboru według potrzeb zespołu.' },
    ],
    process: [
      'Audyt obecnego pakietu: zakres, cena, placówki, realna dostępność terminów.',
      'Ankieta potrzeb pracowników (opcjonalnie) – jakie świadczenia są faktycznie wykorzystywane.',
      'Zapytanie ofertowe do operatorów i ubezpieczycieli zdrowotnych.',
      'Porównanie w jednej tabeli i rekomendacja brokera.',
      'Negocjacje ceny i zakresu, wdrożenie i komunikacja do zespołu.',
    ],
    faq: [
      { q: 'Czy medycyna pracy może być częścią pakietu?', a: 'Tak. Badania wstępne, okresowe i kontrolne można włączyć do pakietu, co upraszcza obsługę kadrową i często obniża łączny koszt.' },
      { q: 'Czy pakiet medyczny jest przychodem pracownika?', a: 'Co do zasady wartość pakietu finansowanego przez pracodawcę stanowi przychód pracownika ze stosunku pracy. Szczegóły zależą od konstrukcji programu – doradzamy, jak go ułożyć.' },
      { q: 'Ile trwa zmiana operatora medycznego?', a: 'Standardowo 4–8 tygodni od decyzji do startu ochrony, z uwzględnieniem okresu wypowiedzenia dotychczasowej umowy.' },
    ],
    cta: 'Zamów bezpłatny audyt pakietu medycznego',
    image: { src: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80', alt: 'Lekarz podczas konsultacji – prywatna opieka medyczna dla pracowników' },
    schemaType: 'Grupowa opieka medyczna (pakiety medyczne dla pracowników)',
  },
  {
    slug: 'laven-ubezpieczenie-komplementarne',
    name: 'LAVEN – ubezpieczenie komplementarne',
    shortName: 'LAVEN',
    badge: 'Innowacje medyczne',
    title: 'LAVEN – komplementarne ubezpieczenie medyczne dla firm | grupowe.pro',
    description:
      'LAVEN: ubezpieczenie komplementarne finansujące terapie nierefundowane przez NFZ – leki onkologiczne, robot da Vinci, badania genetyczne. Wdrożenie przez brokera.',
    lead: 'Ubezpieczenie komplementarne – uzupełnienie systemu NFZ.',
    summary:
      'Wsparcie finansowe pokrywające koszty najdroższych, innowacyjnych terapii i technologii medycznych nierefundowanych przez NFZ.',
    intro: [
      'LAVEN to ubezpieczenie komplementarne, czyli uzupełniające publiczny system ochrony zdrowia. Nie zastępuje NFZ ani pakietu medycznego – działa tam, gdzie one się kończą: finansuje nowoczesne, bardzo kosztowne technologie medyczne, które nie są refundowane przez państwo.',
      'W praktyce oznacza to dostęp do leków nowej generacji, procedur robotycznych i diagnostyki molekularnej, których koszt dla pacjenta liczony jest w dziesiątkach lub setkach tysięcy złotych.',
    ],
    forWhom: [
      'Firmy, które mają już opiekę medyczną i ubezpieczenie na życie, a chcą dodać ochronę na wypadek najpoważniejszych chorób.',
      'Pracodawcy budujący programy benefitowe wyróżniające się na tle konkurencji.',
      'Zarządy i kluczowi pracownicy, dla których firma chce zapewnić dostęp do najnowszych metod leczenia.',
    ],
    covers: [
      { title: 'Leki nowej generacji', text: 'Finansowanie leków onkologicznych i terapii celowanych niedostępnych w standardowych koszykach świadczeń.' },
      { title: 'Innowacyjne procedury', text: 'Pokrycie kosztów operacji z użyciem robota da Vinci oraz nieinwazyjnych terapii nowotworowych.' },
      { title: 'Badania genetyczne', text: 'Profilowanie molekularne nowotworu pozwalające dobrać terapię do konkretnego typu choroby.' },
      { title: 'Koordynacja leczenia', text: 'Pomoc w organizacji procesu leczenia i dostępie do placówek wykonujących daną procedurę.' },
    ],
    process: [
      'Rozmowa o obecnym programie benefitów i lukach w ochronie.',
      'Dobór wariantu LAVEN do struktury i budżetu firmy.',
      'Przygotowanie oferty i warunków przystąpienia.',
      'Wdrożenie i komunikacja do pracowników.',
    ],
    faq: [
      { q: 'Czym różni się LAVEN od pakietu medycznego?', a: 'Pakiet medyczny daje dostęp do lekarzy i badań na co dzień. LAVEN finansuje bardzo drogie, nierefundowane technologie leczenia w razie poważnej choroby. Programy się uzupełniają.' },
      { q: 'Czy LAVEN zastępuje NFZ?', a: 'Nie. To ubezpieczenie komplementarne – działa równolegle do NFZ i pokrywa to, czego system publiczny nie finansuje.' },
    ],
    cta: 'Zapytaj o program LAVEN',
    image: { src: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80', alt: 'Laboratorium medyczne – innowacyjne technologie leczenia' },
    schemaType: 'Ubezpieczenie komplementarne (LAVEN)',
  },
  {
    slug: 'medisky-leczenie-za-granica',
    name: 'MediSky – leczenie na całym świecie',
    shortName: 'MediSky',
    badge: 'Leczenie globalne',
    title: 'MediSky – międzynarodowe ubezpieczenie zdrowotne dla firm | grupowe.pro',
    description:
      'MediSky: międzynarodowe ubezpieczenie zdrowotne (PMI) – leczenie w klinikach Europy i USA, logistyka, druga opinia medyczna. Wdrożenie przez brokera Aura Consulting.',
    lead: 'Ty wybierasz, gdzie się leczysz.',
    summary:
      'Otwarty dostęp do najlepszych zagranicznych klinik i światowej klasy ekspertów bez barier terytorialnych.',
    intro: [
      'MediSky to międzynarodowe ubezpieczenie zdrowotne (Private Medical Insurance, PMI), które zdejmuje bariery geograficzne w leczeniu. W razie poważnej diagnozy pacjent ma prawo wybrać klinikę w Europie lub Stanach Zjednoczonych, a polisa pokrywa koszty leczenia i organizacji pobytu.',
      'To rozwiązanie dla firm, które chcą zapewnić zarządowi i kluczowym pracownikom dostęp do medycyny na najwyższym światowym poziomie.',
    ],
    forWhom: [
      'Zarządy, kadra menedżerska i specjaliści o kluczowym znaczeniu dla firmy.',
      'Firmy międzynarodowe z pracownikami pracującymi lub podróżującymi za granicą.',
      'Pracodawcy, którzy chcą zaoferować benefit premium w ramach pakietu motywacyjnego.',
    ],
    covers: [
      { title: 'Brak limitów geograficznych', text: 'Pacjent decyduje, czy operacja odbędzie się w Szwajcarii, Niemczech czy w Stanach Zjednoczonych.' },
      { title: 'Organizacja logistyki', text: 'Polisa pokrywa koszty przelotów i zakwaterowania pacjenta oraz osoby towarzyszącej.' },
      { title: 'Druga opinia medyczna', text: 'Konsultacja wyników badań z uznanymi specjalistami z całego świata w celu potwierdzenia diagnozy i planu leczenia.' },
      { title: 'Asysta 24/7', text: 'Wielojęzyczne centrum pomocy koordynujące leczenie, dokumentację i rozliczenia z placówkami.' },
    ],
    process: [
      'Określenie grupy objętej ochroną i oczekiwanego zakresu terytorialnego.',
      'Dobór wariantu MediSky i wycena.',
      'Przygotowanie dokumentacji i przystąpienie do programu.',
      'Wdrożenie i instrukcja korzystania z asysty medycznej.',
    ],
    faq: [
      { q: 'Czy MediSky działa również w Polsce?', a: 'Tak – zakres obejmuje leczenie w Polsce i za granicą; pacjent wybiera miejsce leczenia.' },
      { q: 'Czy można objąć programem tylko część pracowników?', a: 'Tak. MediSky często wdraża się dla zarządu lub wybranej grupy kluczowych pracowników.' },
    ],
    cta: 'Zapytaj o program MediSky',
    image: { src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80', alt: 'Samolot nad chmurami – leczenie za granicą bez barier' },
    schemaType: 'Międzynarodowe ubezpieczenie zdrowotne (MediSky PMI)',
  },
];

export const FAQ = [
  { q: 'Ile osób musi liczyć firma, żeby wdrożyć ubezpieczenie grupowe?', a: 'Programy grupowe dla sektora MŚP uruchamiamy już od 3–5 pracowników. Negocjujemy stawki dotychczas zarezerwowane dla dużych korporacji.' },
  { q: 'Ile kosztuje pracodawcę usługa brokera?', a: 'Usługa brokerska (doradztwo, porównanie ofert, negocjacje, wdrożenie, obsługa) jest dla firmy bezpłatna – wynagrodzenie brokera wypłaca ubezpieczyciel w formie prowizji (kurtażu). Składkę za samo ubezpieczenie może opłacać firma w całości (koszt uzyskania przychodu) lub częściowo pracownik przez potrącenie z pensji.' },
  { q: 'Czy audyt obecnej polisy jest płatny?', a: 'Nie. Sprawdzenie warunków obecnej polisy pod kątem wyłączeń, luk w ochronie i możliwości optymalizacji kosztów jest całkowicie bezpłatne i niezobowiązujące.' },
  { q: 'Czym różni się broker od agenta ubezpieczeniowego?', a: 'Agent działa w imieniu i na rzecz towarzystwa ubezpieczeniowego. Broker działa wyłącznie w imieniu klienta – porównuje oferty wszystkich ubezpieczycieli, negocjuje warunki i ponosi odpowiedzialność za rekomendację. Broker musi mieć zezwolenie KNF i obowiązkowe ubezpieczenie OC.' },
  { q: 'Jak długo trwa wdrożenie programu?', a: 'Od pierwszej rozmowy do startu ochrony zwykle mija 4–8 tygodni. Zebranie ofert i porównanie zajmuje około 2 tygodni, reszta to wybór wariantu, deklaracje pracowników i formalności.' },
  { q: 'Czy można połączyć kilka programów w jeden pakiet?', a: 'Tak. Najczęściej wdrażane połączenie to ubezpieczenie na życie plus opieka medyczna. LAVEN i MediSky dokładamy jako rozszerzenia dla całej firmy lub wybranych grup.' },
  { q: 'Czy obsługujecie firmy z całej Polski?', a: 'Tak. Pracujemy zdalnie i stacjonarnie – siedziba w Warszawie, klienci w całym kraju. Wdrożenia prowadzimy online, deklaracje pracownicy wypełniają elektronicznie.' },
  { q: 'Jak zacząć?', a: 'Wypełnij formularz na stronie lub zadzwoń: 500 502 702. Przeanalizujemy strukturę zatrudnienia, przygotujemy zapytanie do rynku i w ciągu kilku dni przedstawimy porównanie ofert.' },
];

export const PROJECTS = [
  { href: 'https://www.auraconsulting.pl', name: 'auraconsulting.pl', text: 'Korporacyjny broker ubezpieczeniowy. Złożone audyty dla przemysłu.', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80' },
  { href: 'https://utratadochodu.com', name: 'utratadochodu.com', text: 'Zabezpieczenie płynności finansowej w chorobie (prywatne L4).', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80' },
  { href: 'https://idzik.org.pl', name: 'idzik.org.pl', text: 'Kancelaria Adwokacka Magdaleny Idzik-Cieśla.', image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80' },
];

export const CASE_STUDY = {
  client: 'Duża firma farmaceutyczna',
  scope: 'Audyt pakietów medycznych',
  challenge:
    'Firma płaciła 95 zł za średni pakiet medyczny dla pracownika. Zwróciła się do nas z prośbą o znalezienie sposobu na optymalizację kosztów lub poprawę zakresu świadczeń w tym samym budżecie.',
  solution:
    'Po pełnej weryfikacji rynku wyselekcjonowaliśmy nową ofertę i dobraliśmy dostawcę z taką samą ceną (95 zł) oraz praktycznie identyczną siecią placówek do wyboru przez pracowników.',
  result:
    'Pracownicy od 1 stycznia korzystają z maksymalnego możliwego zakresu ochrony i ubezpieczenia medycznego, jaki na dany moment oferował rynek, przy zachowaniu tego samego budżetu firmowego.',
};
