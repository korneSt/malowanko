# Plan Testów - Malowanko

## 1. Wprowadzenie i Cele Testowania

### 1.1 Cel Dokumentu

Niniejszy dokument stanowi kompleksowy plan testów dla aplikacji **Malowanko** - systemu generowania spersonalizowanych kolorowanek dla dzieci przy użyciu sztucznej inteligencji. Plan testów został opracowany w celu zapewnienia wysokiej jakości produktu, bezpieczeństwa treści oraz niezawodności działania wszystkich funkcjonalności aplikacji.

### 1.2 Cele Testowania

Główne cele procesu testowania:

- **Bezpieczeństwo treści**: Zapewnienie, że wszystkie generowane kolorowanki są odpowiednie dla dzieci w wieku 0-12 lat
- **Funkcjonalność**: Weryfikacja poprawnego działania wszystkich funkcji zgodnie z wymaganiami produktu
- **Wydajność**: Sprawdzenie czasu odpowiedzi i obsługi obciążenia
- **Niezawodność**: Weryfikacja stabilności systemu przy różnych scenariuszach użycia
- **Bezpieczeństwo**: Ochrona danych użytkowników i zapobieganie nieautoryzowanemu dostępowi
- **Użyteczność**: Sprawdzenie intuicyjności interfejsu i doświadczenia użytkownika
- **Kompatybilność**: Weryfikacja działania na różnych przeglądarkach i urządzeniach

### 1.3 Zakres Dokumentu

Plan testów obejmuje:
- Testy jednostkowe komponentów i funkcji
- Testy integracyjne między modułami
- Testy end-to-end głównych przepływów użytkownika
- Testy bezpieczeństwa i walidacji treści
- Testy wydajnościowe i obciążeniowe
- Testy kompatybilności przeglądarkowej
- Testy responsywności interfejsu

## 2. Zakres Testów

### 2.1 Funkcjonalności w Zakresie Testowania

#### 2.1.1 System Autoryzacji
- Rejestracja nowego użytkownika przez magic link
- Logowanie istniejącego użytkownika
- Weryfikacja magic linka
- Weryfikacja kodu OTP
- Wylogowanie użytkownika
- Obsługa wygasłych linków weryfikacyjnych
- Obsługa błędów autoryzacji

#### 2.1.2 Generator Kolorowanek
- Generowanie pojedynczych kolorowanek (1-5 obrazków)
- Wybór grupy wiekowej (0-3, 4-8, 9-12 lat)
- Wybór stylu rysunku (prosty, klasyczny, szczegółowy, mandala)
- Walidacja bezpieczeństwa promptów
- Automatyczne tagowanie kolorowanek
- Obsługa limitów dziennych (100 generowań dziennie)
- Obsługa błędów generowania
- Timeouty podczas generowania

#### 2.1.3 Biblioteka Osobista
- Zapisywanie wygenerowanych kolorowanek
- Przeglądanie zapisanych kolorowanek
- Usuwanie kolorowanek z biblioteki
- Oznaczanie kolorowanek jako ulubione
- Filtrowanie i sortowanie w bibliotece
- Podgląd szczegółów kolorowanki

#### 2.1.4 Moduł Drukowania
- Podgląd wydruku przed finalizacją
- Wybór orientacji (pionowa/pozioma)
- Eksport do PDF w formacie A4
- Bezpośredni wydruk z przeglądarki
- Drukowanie z biblioteki
- Drukowanie bezpośrednio po wygenerowaniu

#### 2.1.5 Galeria Publiczna
- Przeglądanie publicznej galerii
- Wyszukiwanie po promptach i tagach
- Filtrowanie po grupie wiekowej
- Sortowanie (Najnowsze, Najpopularniejsze)
- Dodawanie kolorowanek z galerii do ulubionych
- Drukowanie kolorowanek z galerii
- Dostęp dla niezalogowanych użytkowników

#### 2.1.6 System Limitów
- Sprawdzanie pozostałego limitu generowań
- Rezerwacja limitu przy generowaniu
- Reset limitu o północy
- Obsługa przekroczonego limitu
- Wyświetlanie informacji o limicie w interfejsie

### 2.2 Funkcjonalności Poza Zakresem Testowania (MVP)

Następujące funkcjonalności są poza zakresem MVP i nie będą testowane w tej fazie:
- Logowanie przez media społecznościowe
- Prywatne kolorowanki
- System ocen i rankingów
- Onboarding dla nowych użytkowników
- Edycja wygenerowanych kolorowanek
- Kolorowanie online w aplikacji
- Subskrypcje i płatności

## 3. Typy Testów

### 3.1 Testy Jednostkowe (Unit Tests)

**Cel**: Weryfikacja poprawności działania pojedynczych funkcji i komponentów w izolacji.

**Narzędzia**: Vitest, React Testing Library

**Zakres**:
- Funkcje walidacji (Zod schemas)
- Funkcje pomocnicze (utils)
- Serwisy biznesowe:
  - `validatePromptSafety()` - walidacja bezpieczeństwa promptów
  - `generateColoringImage()` - generowanie obrazków
  - `generateTags()` - automatyczne tagowanie
  - `checkAndReserveLimit()` - zarządzanie limitami
  - `getRemainingGenerations()` - pobieranie pozostałego limitu
- Komponenty React:
  - `AuthForm` - formularz autoryzacji
  - `GeneratorForm` - formularz generatora
  - `ColoringCard` - karta kolorowanki
  - `GenerationLimitBadge` - wyświetlanie limitu
- Server Actions:
  - `generateColorings()` - generowanie kolorowanek
  - `signUp()` - rejestracja
  - `signIn()` - logowanie
  - `verifyMagicLink()` - weryfikacja magic linka

**Kryteria akceptacji**:
- Pokrycie kodu testami jednostkowymi ≥ 80%
- Wszystkie funkcje pomocnicze mają testy
- Wszystkie edge cases są pokryte testami

### 3.2 Testy Integracyjne (Integration Tests)

**Cel**: Weryfikacja współpracy między modułami i integracjami zewnętrznymi.

**Narzędzia**: Vitest, MSW (Mock Service Worker), Testcontainers (opcjonalnie)

**Zakres**:
- Integracja z Supabase:
  - Autoryzacja (magic link)
  - Operacje na bazie danych (CRUD)
  - Row Level Security (RLS)
  - Storage (upload/retrieve obrazków)
- Integracja z OpenAI API:
  - Generowanie obrazków (DALL-E 3)
  - Walidacja bezpieczeństwa (GPT-4)
  - Generowanie tagów (GPT-4)
- Integracja z OpenRouter:
  - Routing zapytań do odpowiednich modeli
  - Obsługa błędów API
  - Timeouty i retry logic
- Server Actions z bazą danych:
  - Generowanie i zapisywanie kolorowanek
  - Zarządzanie limitami dziennymi
  - Operacje na bibliotece użytkownika
- Middleware Next.js:
  - Ochrona tras wymagających autoryzacji
  - Odświeżanie sesji użytkownika

**Kryteria akceptacji**:
- Wszystkie integracje zewnętrzne są przetestowane
- Obsługa błędów integracji jest zweryfikowana
- Race conditions w limitach są przetestowane

### 3.3 Testy End-to-End (E2E Tests)

**Cel**: Weryfikacja kompletnych przepływów użytkownika od początku do końca.

**Narzędzia**: Playwright, Cypress

**Zakres**:
- **Przepływ rejestracji i logowania**:
  1. Użytkownik wchodzi na stronę główną
  2. Klika "Zarejestruj się"
  3. Wpisuje adres e-mail
  4. Otrzymuje magic link (mock)
  5. Klika link weryfikacyjny
  6. Zostaje przekierowany do aplikacji
  7. Jest zalogowany i widzi swoją bibliotekę

- **Przepływ generowania kolorowanki**:
  1. Użytkownik loguje się do aplikacji
  2. Przechodzi do generatora
  3. Wpisuje prompt "kot grający na gitarze"
  4. Wybiera grupę wiekową "4-8 lat"
  5. Wybiera styl "klasyczny"
  6. Wybiera liczbę obrazków: 2
  7. Klika "Generuj"
  8. Oczekuje na wygenerowanie (max 30 sekund)
  9. Widzi 2 wygenerowane obrazki
  10. Zapisuje je do biblioteki

- **Przepływ przeglądania biblioteki**:
  1. Użytkownik przechodzi do biblioteki
  2. Widzi listę zapisanych kolorowanek
  3. Klika na jedną z kolorowanek
  4. Widzi szczegóły kolorowanki
  5. Oznacza jako ulubioną
  6. Wraca do listy
  7. Filtruje po ulubionych
  8. Usuwa kolorowankę

- **Przepływ drukowania**:
  1. Użytkownik wybiera kolorowankę z biblioteki
  2. Klika "Drukuj"
  3. Wybiera orientację (pionowa/pozioma)
  4. Widzi podgląd wydruku
  5. Eksportuje do PDF
  6. Weryfikuje poprawność pliku PDF

- **Przepływ galerii publicznej**:
  1. Użytkownik (zalogowany lub nie) przechodzi do galerii
  2. Przegląda kolorowanki
  3. Wyszukuje po tagu "zwierzęta"
  4. Filtruje po grupie wiekowej "4-8 lat"
  5. Sortuje po "Najpopularniejsze"
  6. Dodaje kolorowankę do ulubionych (jeśli zalogowany)
  7. Drukuje kolorowankę z galerii

- **Przepływ obsługi błędów**:
  1. Użytkownik próbuje wygenerować kolorowankę z nieodpowiednim promptem
  2. System blokuje prompt i wyświetla przyjazny komunikat
  3. Użytkownik próbuje wygenerować po przekroczeniu limitu
  4. System informuje o przekroczeniu limitu
  5. Użytkownik próbuje użyć wygasłego magic linka
  6. System wyświetla komunikat o wygaśnięciu

**Kryteria akceptacji**:
- Wszystkie główne przepływy użytkownika działają poprawnie
- Czas wykonania każdego przepływu jest akceptowalny
- Obsługa błędów jest przyjazna dla użytkownika

### 3.4 Testy Bezpieczeństwa i Walidacji Treści

**Cel**: Zapewnienie, że wszystkie generowane treści są bezpieczne dla dzieci.

**Narzędzia**: Testy manualne, testy automatyczne z różnymi promptami

**Zakres**:
- **Walidacja promptów**:
  - Testy z nieodpowiednimi promptami (przemoc, treści dla dorosłych, horror)
  - Testy z granicznymi przypadkami (sugerujące ale nie bezpośrednie)
  - Testy z wielojęzycznymi promptami (polski, angielski)
  - Testy z bardzo długimi promptami
  - Testy z promptami zawierającymi emoji i znaki specjalne
  - Testy z promptami zawierającymi słowa kluczowe z listy blokowanych

- **Filtrowanie treści**:
  - Weryfikacja działania listy blokowanych słów kluczowych
  - Weryfikacja działania AI moderation (GPT-4)
  - Testy fałszywie pozytywnych (poprawne prompty błędnie zablokowane)
  - Testy fałszywie negatywnych (nieodpowiednie prompty przepuszczone)

- **Bezpieczeństwo danych**:
  - Weryfikacja Row Level Security (RLS) w Supabase
  - Testy nieautoryzowanego dostępu do danych innych użytkowników
  - Weryfikacja ochrony tras przez middleware
  - Testy SQL injection (jeśli dotyczy)
  - Weryfikacja bezpiecznego przechowywania danych wrażliwych

**Kryteria akceptacji**:
- Skuteczność filtrowania promptów ≥ 99%
- Fałszywie pozytywne < 5%
- Wszystkie testy bezpieczeństwa przechodzą
- Brak możliwości nieautoryzowanego dostępu do danych

### 3.5 Testy Wydajnościowe i Obciążeniowe

**Cel**: Weryfikacja wydajności systemu przy normalnym i zwiększonym obciążeniu.

**Narzędzia**: k6, Artillery, Lighthouse, WebPageTest

**Zakres**:
- **Czasy odpowiedzi**:
  - Czas generowania pojedynczej kolorowanki < 30 sekund
  - Czas ładowania strony głównej < 3 sekundy
  - Czas ładowania biblioteki < 2 sekundy
  - Czas ładowania galerii < 3 sekundy
  - First Contentful Paint (FCP) < 1.8 sekundy
  - Largest Contentful Paint (LCP) < 2.5 sekundy

- **Testy obciążeniowe**:
  - 10 równoczesnych użytkowników generujących kolorowanki
  - 50 równoczesnych użytkowników przeglądających galerię
  - 100 równoczesnych żądań do API
  - Testy spike (nagły wzrost obciążenia)
  - Testy wytrzymałościowe (długotrwałe obciążenie)

- **Optymalizacja**:
  - Optymalizacja obrazków (Next.js Image)
  - Lazy loading komponentów
  - Caching odpowiedzi API
  - Optymalizacja zapytań do bazy danych

**Kryteria akceptacji**:
- Wszystkie metryki wydajności są spełnione
- System działa stabilnie przy założonym obciążeniu
- Brak wycieków pamięci podczas długotrwałego użytkowania

### 3.6 Testy Kompatybilności Przeglądarkowej

**Cel**: Weryfikacja działania aplikacji na różnych przeglądarkach i urządzeniach.

**Narzędzia**: BrowserStack, Playwright (różne przeglądarki), Responsive Design Mode

**Zakres**:
- **Przeglądarki desktopowe**:
  - Chrome (najnowsza wersja)
  - Firefox (najnowsza wersja)
  - Safari (najnowsza wersja)
  - Edge (najnowsza wersja)

- **Przeglądarki mobilne**:
  - Chrome Mobile (Android)
  - Safari Mobile (iOS)
  - Samsung Internet

- **Urządzenia**:
  - Desktop (1920x1080, 1366x768)
  - Tablet (iPad, Android tablet)
  - Mobile (iPhone, Android phone)

- **Funkcjonalności do przetestowania**:
  - Responsywność interfejsu
  - Działanie formularzy
  - Generowanie kolorowanek
  - Drukowanie i eksport PDF
  - Nawigacja i routing

**Kryteria akceptacji**:
- Aplikacja działa poprawnie na wszystkich wspieranych przeglądarkach
- Interfejs jest responsywny na wszystkich urządzeniach
- Wszystkie funkcjonalności działają na mobile i desktop

### 3.7 Testy Regresyjne

**Cel**: Weryfikacja, że nowe zmiany nie zepsuły istniejących funkcjonalności.

**Narzędzia**: Playwright, Vitest (testy jednostkowe i integracyjne)

**Zakres**:
- Uruchamianie pełnej baterii testów po każdej zmianie kodu
- Testy smoke test przed każdym deploymentem
- Testy krytycznych ścieżek użytkownika

**Kryteria akceptacji**:
- Wszystkie istniejące testy przechodzą po wprowadzeniu zmian
- Brak regresji w funkcjonalnościach krytycznych

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1 System Autoryzacji

#### TC-AUTH-001: Rejestracja nowego użytkownika
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik nie jest zalogowany  
**Kroki**:
1. Użytkownik przechodzi na stronę główną
2. Klika przycisk "Zarejestruj się"
3. Wpisuje prawidłowy adres e-mail (np. test@example.com)
4. Klika "Wyślij link"
5. System wysyła magic link na podany adres e-mail
6. Użytkownik otwiera e-mail i klika magic link
7. System weryfikuje link i tworzy konto
8. Użytkownik jest automatycznie zalogowany i przekierowany do aplikacji

**Oczekiwany rezultat**: Konto jest utworzone, użytkownik jest zalogowany, widzi swoją bibliotekę

#### TC-AUTH-002: Rejestracja z nieprawidłowym e-mailem
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik nie jest zalogowany  
**Kroki**:
1. Użytkownik przechodzi na stronę główną
2. Klika przycisk "Zarejestruj się"
3. Wpisuje nieprawidłowy adres e-mail (np. "nieprawidlowy-email")
4. Klika "Wyślij link"

**Oczekiwany rezultat**: System wyświetla komunikat błędu "Nieprawidłowy adres e-mail"

#### TC-AUTH-003: Rejestracja z istniejącym e-mailem
**Priorytet**: Wysoki  
**Warunki wstępne**: Konto z e-mailem test@example.com już istnieje  
**Kroki**:
1. Użytkownik próbuje zarejestrować się z e-mailem test@example.com
2. System wykrywa istniejące konto

**Oczekiwany rezultat**: System wyświetla komunikat "Konto z tym adresem e-mail już istnieje. Zaloguj się?"

#### TC-AUTH-004: Logowanie istniejącego użytkownika
**Priorytet**: Wysoki  
**Warunki wstępne**: Konto z e-mailem test@example.com istnieje  
**Kroki**:
1. Użytkownik przechodzi na stronę główną
2. Klika przycisk "Zaloguj się"
3. Wpisuje adres e-mail test@example.com
4. Klika "Wyślij link"
5. System wysyła magic link
6. Użytkownik klika magic link
7. System weryfikuje link i loguje użytkownika

**Oczekiwany rezultat**: Użytkownik jest zalogowany i przekierowany do aplikacji

#### TC-AUTH-005: Logowanie z nieistniejącym e-mailem
**Priorytet**: Wysoki  
**Warunki wstępne**: Konto z e-mailem nieistniejacy@example.com nie istnieje  
**Kroki**:
1. Użytkownik próbuje zalogować się z nieistniejącym e-mailem
2. System wykrywa brak konta

**Oczekiwany rezultat**: System wyświetla komunikat "Konto z tym adresem e-mail nie istnieje. Chcesz się zarejestrować?"

#### TC-AUTH-006: Weryfikacja wygasłego magic linka
**Priorytet**: Średni  
**Warunki wstępne**: Użytkownik otrzymał magic link, który wygasł  
**Kroki**:
1. Użytkownik klika wygasły magic link
2. System wykrywa wygaśnięcie linka

**Oczekiwany rezultat**: System wyświetla komunikat "Link weryfikacyjny wygasł. Wpisz swój adres e-mail ponownie, aby otrzymać nowy link."

#### TC-AUTH-007: Weryfikacja kodu OTP
**Priorytet**: Średni  
**Warunki wstępne**: Użytkownik otrzymał e-mail z kodem OTP  
**Kroki**:
1. Użytkownik przechodzi na stronę weryfikacji
2. Wpisuje 6-cyfrowy kod OTP z e-maila
3. Klika "Zweryfikuj"

**Oczekiwany rezultat**: System weryfikuje kod i loguje użytkownika

#### TC-AUTH-008: Wylogowanie użytkownika
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Użytkownik klika przycisk wylogowania w menu profilu
2. System wylogowuje użytkownika
3. Użytkownik jest przekierowany na stronę główną

**Oczekiwany rezultat**: Użytkownik jest wylogowany, sesja jest zamknięta, dostęp do chronionych tras jest zablokowany

### 4.2 Generator Kolorowanek

#### TC-GEN-001: Generowanie pojedynczej kolorowanki
**Priorytet**: Krytyczny  
**Warunki wstępne**: Użytkownik jest zalogowany, ma dostępny limit generowań  
**Kroki**:
1. Użytkownik przechodzi do generatora
2. Wpisuje prompt "kot grający na gitarze"
3. Wybiera grupę wiekową "4-8 lat"
4. Wybiera styl "klasyczny"
5. Wybiera liczbę obrazków: 1
6. Klika "Generuj"
7. System waliduje prompt (bezpieczeństwo)
8. System generuje obrazek (max 30 sekund)
9. System generuje tagi automatycznie
10. System zapisuje kolorowankę do bazy danych

**Oczekiwany rezultat**: Kolorowanka jest wygenerowana, wyświetlona użytkownikowi, zapisana w bazie, limit zmniejszony o 1

#### TC-GEN-002: Generowanie wielu kolorowanek (2-5)
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik jest zalogowany, ma dostępny limit ≥ 5  
**Kroki**:
1. Użytkownik wybiera liczbę obrazków: 5
2. Klika "Generuj"
3. System generuje 5 obrazków równolegle

**Oczekiwany rezultat**: 5 kolorowanek jest wygenerowanych, limit zmniejszony o 5

#### TC-GEN-003: Generowanie z nieodpowiednim promptem
**Priorytet**: Krytyczny  
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Użytkownik wpisuje prompt zawierający nieodpowiednie treści (np. "przemoc")
2. Klika "Generuj"
3. System waliduje prompt

**Oczekiwany rezultat**: System blokuje prompt i wyświetla przyjazny komunikat "Ups! Ten temat nie nadaje się do kolorowanki. Spróbuj czegoś innego". Limit nie jest zużyty.

#### TC-GEN-004: Generowanie po przekroczeniu limitu
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik wykorzystał dzienny limit (100 generowań)  
**Kroki**:
1. Użytkownik próbuje wygenerować kolorowankę
2. System sprawdza limit

**Oczekiwany rezultat**: System wyświetla komunikat o przekroczeniu limitu z informacją o czasie do resetu. Przycisk "Generuj" jest nieaktywny.

#### TC-GEN-005: Timeout podczas generowania
**Priorytet**: Średni  
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Użytkownik rozpoczyna generowanie
2. Generowanie trwa dłużej niż 30 sekund
3. System wykrywa timeout

**Oczekiwany rezultat**: System wyświetla komunikat o timeout, oferuje anulowanie i ponowienie próby. Limit nie jest zużyty.

#### TC-GEN-006: Automatyczne tagowanie
**Priorytet**: Średni  
**Warunki wstępne**: Użytkownik wygenerował kolorowankę  
**Kroki**:
1. System generuje tagi automatycznie na podstawie promptu i obrazka
2. Tagi są zapisywane wraz z kolorowanką

**Oczekiwany rezultat**: Kolorowanka ma 3-5 tagów w języku polskim, tagi są widoczne w bibliotece i galerii

#### TC-GEN-007: Walidacja pustego promptu
**Priorytet**: Średni  
**Warunki wstępne**: Użytkownik jest w generatorze  
**Kroki**:
1. Użytkownik nie wpisuje promptu
2. Próbuje kliknąć "Generuj"

**Oczekiwany rezultat**: Przycisk "Generuj" jest nieaktywny, system wyświetla podpowiedź zachęcającą do wpisania tematu

#### TC-GEN-008: Walidacja bardzo długiego promptu
**Priorytet**: Niski  
**Warunki wstępne**: Użytkownik jest w generatorze  
**Kroki**:
1. Użytkownik wpisuje prompt dłuższy niż 500 znaków
2. System blokuje dalsze wpisywanie

**Oczekiwany rezultat**: System wyświetla komunikat o maksymalnej długości, licznik znaków pokazuje limit

### 4.3 Biblioteka Osobista

#### TC-LIB-001: Zapisywanie kolorowanki do biblioteki
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik wygenerował kolorowankę  
**Kroki**:
1. Użytkownik widzi wygenerowaną kolorowankę
2. Klika "Zapisz do biblioteki"
3. System zapisuje kolorowankę do tabeli `user_library`

**Oczekiwany rezultat**: Kolorowanka jest zapisana, pojawia się w bibliotece użytkownika

#### TC-LIB-002: Przeglądanie biblioteki
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik ma zapisane kolorowanki w bibliotece  
**Kroki**:
1. Użytkownik przechodzi do biblioteki
2. System wyświetla listę zapisanych kolorowanek
3. Kolorowanki są posortowane od najnowszych

**Oczekiwany rezultat**: Użytkownik widzi wszystkie swoje kolorowanki z miniaturami i podstawowymi informacjami

#### TC-LIB-003: Podgląd szczegółów kolorowanki
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik ma kolorowanki w bibliotece  
**Kroki**:
1. Użytkownik klika na kolorowankę w bibliotece
2. System wyświetla szczegóły: prompt, tagi, data utworzenia, grupa wiekowa, styl

**Oczekiwany rezultat**: Użytkownik widzi pełne szczegóły kolorowanki wraz z obrazkiem w dużym rozmiarze

#### TC-LIB-004: Usuwanie kolorowanki z biblioteki
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik ma kolorowanki w bibliotece  
**Kroki**:
1. Użytkownik otwiera szczegóły kolorowanki
2. Klika "Usuń"
3. System wyświetla potwierdzenie
4. Użytkownik potwierdza usunięcie
5. System usuwa kolorowankę z biblioteki użytkownika

**Oczekiwany rezultat**: Kolorowanka jest usunięta z biblioteki użytkownika, ale pozostaje w galerii publicznej (anonimowa)

#### TC-LIB-005: Oznaczanie jako ulubionej
**Priorytet**: Średni  
**Warunki wstępne**: Użytkownik ma kolorowanki w bibliotece  
**Kroki**:
1. Użytkownik klika ikonę serca przy kolorowance
2. System oznacza kolorowankę jako ulubioną
3. Ikona serca jest wypełniona

**Oczekiwany rezultat**: Kolorowanka jest oznaczona jako ulubiona, można filtrować bibliotekę po ulubionych

#### TC-LIB-006: Pusta biblioteka
**Priorytet**: Średni  
**Warunki wstępne**: Użytkownik nie ma zapisanych kolorowanek  
**Kroki**:
1. Użytkownik przechodzi do biblioteki
2. Biblioteka jest pusta

**Oczekiwany rezultat**: System wyświetla przyjazny komunikat z zachętą do wygenerowania pierwszej kolorowanki i linkiem do generatora

### 4.4 Moduł Drukowania

#### TC-PRINT-001: Eksport do PDF
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik ma kolorowankę w bibliotece  
**Kroki**:
1. Użytkownik otwiera szczegóły kolorowanki
2. Klika "Drukuj"
3. Wybiera orientację (pionowa/pozioma)
4. Klika "Pobierz PDF"
5. System generuje plik PDF w formacie A4

**Oczekiwany rezultat**: Plik PDF jest pobierany, zawiera kolorowankę w wybranej orientacji, jest zoptymalizowany do druku

#### TC-PRINT-002: Bezpośredni wydruk z przeglądarki
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik ma kolorowankę w bibliotece  
**Kroki**:
1. Użytkownik otwiera szczegóły kolorowanki
2. Klika "Drukuj"
3. Wybiera orientację
4. Klika "Drukuj"
5. System otwiera okno drukowania przeglądarki

**Oczekiwany rezultat**: Okno drukowania jest otwarte z podglądem kolorowanki w formacie A4

#### TC-PRINT-003: Drukowanie bezpośrednio po wygenerowaniu
**Priorytet**: Średni  
**Warunki wstępne**: Użytkownik wygenerował kolorowankę  
**Kroki**:
1. Użytkownik widzi wygenerowaną kolorowankę
2. Klika "Drukuj" bez zapisywania do biblioteki
3. System umożliwia drukowanie

**Oczekiwany rezultat**: Kolorowanka może być wydrukowana bez konieczności zapisywania do biblioteki

### 4.5 Galeria Publiczna

#### TC-GAL-001: Przeglądanie galerii
**Priorytet**: Wysoki  
**Warunki wstępne**: Galeria zawiera kolorowanki  
**Kroki**:
1. Użytkownik (zalogowany lub nie) przechodzi do galerii
2. System wyświetla miniatury kolorowanek w formie siatki
3. Każda miniatura pokazuje prompt i tagi

**Oczekiwany rezultat**: Użytkownik widzi publiczne kolorowanki, są one anonimowe (bez informacji o autorze)

#### TC-GAL-002: Wyszukiwanie w galerii
**Priorytet**: Wysoki  
**Warunki wstępne**: Galeria zawiera kolorowanki  
**Kroki**:
1. Użytkownik wpisuje w wyszukiwarkę "zwierzęta"
2. System wyszukuje po promptach i tagach
3. Wyświetla wyniki w czasie rzeczywistym

**Oczekiwany rezultat**: Użytkownik widzi tylko kolorowanki pasujące do wyszukiwania

#### TC-GAL-003: Filtrowanie po grupie wiekowej
**Priorytet**: Wysoki  
**Warunki wstępne**: Galeria zawiera kolorowanki z różnymi grupami wiekowymi  
**Kroki**:
1. Użytkownik wybiera filtr "4-8 lat"
2. System filtruje kolorowanki

**Oczekiwany rezultat**: Użytkownik widzi tylko kolorowanki dla grupy wiekowej 4-8 lat

#### TC-GAL-004: Sortowanie galerii
**Priorytet**: Średni  
**Warunki wstępne**: Galeria zawiera kolorowanki  
**Kroki**:
1. Użytkownik wybiera sortowanie "Najpopularniejsze"
2. System sortuje kolorowanki według liczby polubień

**Oczekiwany rezultat**: Kolorowanki są posortowane od najpopularniejszych do najmniej popularnych

#### TC-GAL-005: Dodawanie do ulubionych z galerii
**Priorytet**: Średni  
**Warunki wstępne**: Użytkownik jest zalogowany, przegląda galerię  
**Kroki**:
1. Użytkownik klika ikonę serca przy kolorowance w galerii
2. System dodaje kolorowankę do ulubionych użytkownika

**Oczekiwany rezultat**: Kolorowanka jest dodana do ulubionych, jest widoczna w sekcji ulubione w bibliotece

#### TC-GAL-006: Drukowanie z galerii
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik przegląda galerię  
**Kroki**:
1. Użytkownik otwiera szczegóły kolorowanki z galerii
2. Klika "Drukuj"
3. System umożliwia drukowanie

**Oczekiwany rezultat**: Kolorowanka może być wydrukowana lub pobrana jako PDF, dostępna dla zalogowanych i niezalogowanych

#### TC-GAL-007: Puste wyniki wyszukiwania
**Priorytet**: Niski  
**Warunki wstępne**: Użytkownik wyszukuje nietypowego tematu  
**Kroki**:
1. Użytkownik wpisuje wyszukiwanie, które nie zwraca wyników
2. System wyświetla komunikat

**Oczekiwany rezultat**: System wyświetla przyjazny komunikat o braku wyników z sugestią modyfikacji wyszukiwania lub wygenerowania własnej kolorowanki

### 4.6 System Limitów

#### TC-LIMIT-001: Sprawdzanie pozostałego limitu
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Użytkownik przechodzi do generatora
2. System wyświetla licznik pozostałych generowań

**Oczekiwany rezultat**: Użytkownik widzi aktualną liczbę pozostałych generowań (np. "Pozostało: 85/100")

#### TC-LIMIT-002: Reset limitu o północy
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik wykorzystał limit danego dnia  
**Kroki**:
1. System czeka do północy
2. System resetuje licznik generowań

**Oczekiwany rezultat**: Po północy limit jest zresetowany, użytkownik ma ponownie 100 generowań dostępnych

#### TC-LIMIT-003: Race condition w limitach
**Priorytet**: Krytyczny  
**Warunki wstępne**: Użytkownik ma 1 pozostałe generowanie  
**Kroki**:
1. Użytkownik wysyła 2 równoczesne żądania generowania
2. System sprawdza i rezerwuje limit atomowo

**Oczekiwany rezultat**: Tylko jedno żądanie jest zrealizowane, drugie otrzymuje błąd o przekroczeniu limitu. Limit nie może być przekroczony przez race condition.

## 5. Środowisko Testowe

### 5.1 Środowiska Testowe

#### 5.1.1 Środowisko Development
- **Cel**: Lokalne testowanie podczas rozwoju
- **Lokalizacja**: Lokalne maszyny deweloperów
- **Konfiguracja**:
  - Next.js dev server (localhost:3000)
  - Lokalna instancja Supabase (Supabase CLI)
  - Mockowane API OpenAI (MSW)
  - Testowa baza danych PostgreSQL

#### 5.1.2 Środowisko Testowe (Staging)
- **Cel**: Testy integracyjne i E2E przed produkcją
- **Lokalizacja**: Vercel Preview/Staging
- **Konfiguracja**:
  - Deploy na Vercel Preview
  - Testowa instancja Supabase
  - Testowe klucze API OpenAI (ograniczone)
  - Testowa baza danych

#### 5.1.3 Środowisko Produkcyjne (Production)
- **Cel**: Testy smoke test przed i po deploymencie
- **Lokalizacja**: Vercel Production
- **Konfiguracja**:
  - Produkcyjna instancja Supabase
  - Produkcyjne klucze API OpenAI
  - Produkcyjna baza danych

### 5.2 Dane Testowe

#### 5.2.1 Użytkownicy Testowi
- **test-user-1@example.com**: Użytkownik z pełnym limitem generowań
- **test-user-2@example.com**: Użytkownik z wykorzystanym limitem
- **test-user-3@example.com**: Użytkownik z pustą biblioteką
- **test-user-4@example.com**: Użytkownik z wieloma kolorowankami w bibliotece

#### 5.2.2 Kolorowanki Testowe
- Różne grupy wiekowe (0-3, 4-8, 9-12)
- Różne style (prosty, klasyczny, szczegółowy, mandala)
- Różne tagi dla testów wyszukiwania
- Kolorowanki z różną liczbą polubień dla testów sortowania

#### 5.2.3 Prompty Testowe
- **Bezpieczne prompty**: "kot grający na gitarze", "samochód wyścigowy", "zamek księżniczki"
- **Niebezpieczne prompty**: "przemoc", "horror", "narkotyki" (dla testów walidacji)
- **Graniczne przypadki**: "walka" (może być akceptowane w kontekście sportowym)

### 5.3 Konfiguracja Zmiennych Środowiskowych

```env
# Test Environment
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_anon_key
SUPABASE_SERVICE_ROLE_KEY=test_service_role_key
OPENAI_API_KEY=test_openai_key
NEXT_PUBLIC_APP_URL=https://test-app.vercel.app
```

## 6. Narzędzia do Testowania

### 6.1 Testy Jednostkowe i Integracyjne

- **Vitest**: Framework testowy JavaScript
  - Konfiguracja: `vitest.config.ts`
  - Pokrycie kodu: `--coverage`
  - Szybki i zoptymalizowany dla projektów Next.js
  
- **React Testing Library**: Testowanie komponentów React
  - Best practices: testowanie zachowania, nie implementacji
  
- **MSW (Mock Service Worker)**: Mockowanie API
  - Mockowanie odpowiedzi Supabase
  - Mockowanie odpowiedzi OpenAI API

### 6.2 Testy End-to-End

- **Playwright**: Główny framework E2E
  - Wsparcie dla wielu przeglądarek
  - Automatyczne screenshoty przy błędach
  - Video recording testów
  
- **Cypress**: Alternatywny framework E2E
  - Lepsze dla testów interaktywnych
  - Time-travel debugging

### 6.3 Testy Wydajnościowe

- **k6**: Narzędzie do testów obciążeniowych
  - Skrypty testowe w JavaScript
  - Metryki: RPS, czas odpowiedzi, błędy
  
- **Lighthouse**: Audyt wydajności
  - Performance score
  - Best practices
  - SEO
  
- **WebPageTest**: Testy wydajności z różnych lokalizacji
  - Waterfall charts
  - Filmstrip view

### 6.4 Testy Kompatybilności

- **BrowserStack**: Testowanie na różnych przeglądarkach i urządzeniach
  - Desktop i mobile
  - Różne wersje przeglądarek
  
- **Playwright**: Automatyczne testy w różnych przeglądarkach
  - Chrome, Firefox, Safari, Edge

### 6.5 Narzędzia Pomocnicze

- **ESLint**: Linting kodu
- **Prettier**: Formatowanie kodu
- **TypeScript**: Type checking
- **GitHub Actions**: CI/CD pipeline

---

**Wersja dokumentu**: 1.0  
**Data utworzenia**: 2025-01-05  
**Ostatnia aktualizacja**: 2025-01-05  
**Autor**: Zespół QA  
**Status**: Wersja robocza
