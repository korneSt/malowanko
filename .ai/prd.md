# Dokument wymagań produktu (PRD) - Malowanko

## 1. Przegląd produktu

Malowanko to aplikacja webowa umożliwiająca rodzicom i opiekunom generowanie spersonalizowanych kolorowanek dla dzieci. Aplikacja wykorzystuje sztuczną inteligencję (OpenAI API) do tworzenia unikalnych obrazków line art na podstawie tekstowych opisów użytkownika, dostosowanych do wieku dziecka i wybranego stylu graficznego.

Główne funkcjonalności produktu obejmują:

- Generator kolorowanek z wyborem grupy wiekowej i stylu rysunku
- Bibliotekę osobistą do przechowywania wygenerowanych kolorowanek
- Moduł drukowania z eksportem do PDF w formacie A4
- Publiczną galerię anonimowych kolorowanek innych użytkowników
- System autoryzacji oparty na magic linkach (Supabase Auth)

Aplikacja jest responsywna i działa zarówno na urządzeniach mobilnych, jak i desktopowych. Stos technologiczny obejmuje Next.js (frontend), Supabase (backend, autoryzacja, baza danych, storage) oraz OpenAI API (generowanie obrazków i walidacja bezpieczeństwa).

Harmonogram rozwoju zakłada iteracyjne podejście:

- Faza 1: Generator + autoryzacja (4-6 tygodni)
- Faza 2: Biblioteka + drukowanie (2-3 tygodnie)
- Faza 3: Galeria publiczna (2 tygodnie)

## 2. Problem użytkownika

Rodzice i opiekunowie napotykają na następujące problemy przy poszukiwaniu kolorowanek dla swoich dzieci:

1. Generyczne treści - dostępne kolorowanki są masowo produkowane i nie odpowiadają indywidualnym zainteresowaniom dziecka (np. ulubione zwierzątko, postać z bajki, hobby)

2. Niedopasowanie do wieku - trudno znaleźć kolorowanki o odpowiednim poziomie szczegółowości dla konkretnego przedziału wiekowego dziecka

3. Brak umiejętności graficznych - stworzenie własnej kolorowanki wymaga znajomości programów graficznych i umiejętności rysowania

4. Czas i wysiłek - wyszukiwanie odpowiednich kolorowanek w internecie jest czasochłonne i często kończy się kompromisem

5. Kwestie bezpieczeństwa - wyszukując kolorowanki online, rodzice muszą weryfikować czy treści są odpowiednie dla dzieci

Malowanko rozwiązuje te problemy poprzez:

- Personalizację treści na podstawie opisu tekstowego rodzica
- Predefiniowane style dostosowane do grup wiekowych
- Intuicyjny interfejs niewymagający umiejętności graficznych
- Automatyczną walidację bezpieczeństwa treści przez AI
- Publiczną galerię z gotowymi inspiracjami

## 3. Wymagania funkcjonalne

### 3.1 System autoryzacji

- FR-001: System umożliwia rejestrację nowego użytkownika poprzez podanie adresu e-mail
- FR-002: System wysyła magic link na podany adres e-mail w celu weryfikacji i logowania
- FR-003: System zarządza sesją użytkownika (automatyczne wylogowanie po wygaśnięciu sesji)
- FR-004: System przechowuje podstawowy profil użytkownika (e-mail, data rejestracji)
- FR-005: System umożliwia wylogowanie z aplikacji

### 3.2 Generator kolorowanek

- FR-006: Użytkownik może wprowadzić tekstowy opis (prompt) kolorowanki
- FR-007: Użytkownik może wybrać grupę wiekową: 3-5 lat, 6-8 lat, 9-12 lat
- FR-008: Użytkownik może wybrać styl rysunku: Prosty, Klasyczny, Szczegółowy, Mandala
- FR-009: System waliduje bezpieczeństwo promptu przez AI przed rozpoczęciem generowania
- FR-010: System wyświetla przyjazny komunikat gdy prompt zawiera nieodpowiednie treści
- FR-011: System generuje czarno-biały obrazek line art na podstawie promptu
- FR-012: System automatycznie generuje 3-5 tagów dla wygenerowanej kolorowanki
- FR-013: System ogranicza liczbę generowań do 10 dziennie z resetem o północy
- FR-014: System wyświetla licznik pozostałych generowań w interfejsie użytkownika
- FR-015: Czas generowania kolorowanki nie przekracza 30 sekund

### 3.3 Biblioteka kolorowanek

- FR-016: Użytkownik może zapisać wygenerowaną kolorowankę do biblioteki
- FR-017: System ogranicza pojemność biblioteki do 100 kolorowanek
- FR-018: System wyświetla ostrzeżenie gdy biblioteka osiąga 80% pojemności (80 kolorowanek)
- FR-019: Użytkownik może przeglądać zapisane kolorowanki w bibliotece
- FR-020: Użytkownik może usunąć kolorowankę z biblioteki
- FR-021: Użytkownik może oznaczyć kolorowankę jako ulubioną (prywatne polubienie)
- FR-023: System przechowuje metadane kolorowanki: prompt, tagi, data utworzenia, grupa wiekowa, styl

### 3.4 Moduł drukowania

- FR-024: Użytkownik może wybrać kolorowankę do wydruku z biblioteki lub bezpośrednio po wygenerowaniu
- FR-025: Użytkownik może wybrać orientację wydruku: pozioma lub pionowa
- FR-026: System wyświetla podgląd wydruku przed finalizacją
- FR-027: System umożliwia eksport kolorowanki do pliku PDF w formacie A4
- FR-028: System umożliwia bezpośredni wydruk kolorowanki z przeglądarki

### 3.5 Galeria publiczna

- FR-029: System publikuje wszystkie wygenerowane kolorowanki w galerii publicznej jako anonimowe
- FR-030: Użytkownik może przeglądać kolorowanki w galerii publicznej
- FR-031: Użytkownik może wyszukiwać kolorowanki po promptach i tagach
- FR-032: Użytkownik może filtrować kolorowanki po grupie wiekowej
- FR-033: Użytkownik może sortować galerię: Najnowsze lub Najpopularniejsze
- FR-034: Użytkownik może dodać kolorowankę z galerii do swoich ulubionych
- FR-035: Użytkownik może wydrukować lub pobrać kolorowankę z galerii publicznej

### 3.6 Interfejs użytkownika

- FR-036: Aplikacja jest w pełni responsywna (mobile i desktop)
- FR-037: Interfejs jest dostępny w języku polskim
- FR-038: System wyświetla komunikaty o błędach w przyjazny sposób
- FR-039: System informuje użytkownika o stanie operacji (ładowanie, sukces, błąd)

## 4. Granice produktu

### 4.1 W zakresie MVP

- Autoryzacja wyłącznie przez magic link (e-mail)
- Generator kolorowanek z 4 stylami i 3 grupami wiekowymi
- Biblioteka osobista z limitem 100 kolorowanek
- Drukowanie i eksport do PDF w formacie A4
- Galeria publiczna z wyszukiwaniem i filtrowaniem
- Limit 10 generowań dziennie
- Wszystkie kolorowanki domyślnie publiczne i anonimowe
- Responsywny interfejs web (mobile i desktop)

### 4.2 Poza zakresem MVP

- Logowanie przez media społecznościowe (Google, Facebook)
- Logowanie przez SMS
- Rejestracja i logowanie hasłem
- Możliwość oznaczenia kolorowanki jako prywatnej
- Publiczny system ocen i rankingów
- Kategorie tematyczne w filtrach galerii
- Onboarding dla nowych użytkowników
- Profile dzieci z preferencjami
- Edycja wygenerowanych kolorowanek
- Kolorowanie online w aplikacji
- Udostępnianie kolorowanek przez link
- Subskrypcje i płatności
- Aplikacje natywne (iOS, Android)
- Wielojęzyczność (inne języki niż polski)
- API dla zewnętrznych integracji
- Panel administracyjny
- Zaawansowana analityka użycia
- Integracja z drukarniami
- System powiadomień

## 5. Historyjki użytkowników

### Autoryzacja i zarządzanie kontem

---

ID: US-001
Tytuł: Rejestracja nowego użytkownika

Opis: Jako nowy użytkownik, chcę zarejestrować się w aplikacji podając swój adres e-mail, aby móc korzystać z funkcji generowania i zapisywania kolorowanek.

Kryteria akceptacji:

- Na stronie głównej widoczny jest przycisk/link "Zarejestruj się"
- Formularz rejestracji zawiera pole na adres e-mail
- System waliduje poprawność formatu adresu e-mail
- System wyświetla komunikat o błędzie dla nieprawidłowego formatu e-mail
- Po podaniu prawidłowego e-maila system wysyła magic link
- System wyświetla komunikat potwierdzający wysłanie e-maila z linkiem
- Magic link jest ważny przez określony czas (np. 1 godzina)
- Kliknięcie magic linka tworzy konto i loguje użytkownika

---

ID: US-002
Tytuł: Logowanie istniejącego użytkownika

Opis: Jako zarejestrowany użytkownik, chcę zalogować się do aplikacji używając magic linka, aby uzyskać dostęp do mojej biblioteki i generować nowe kolorowanki.

Kryteria akceptacji:

- Na stronie głównej widoczny jest przycisk/link "Zaloguj się"
- Formularz logowania zawiera pole na adres e-mail
- System rozpoznaje istniejące konto i wysyła magic link
- System wyświetla komunikat potwierdzający wysłanie e-maila
- Kliknięcie magic linka loguje użytkownika i przekierowuje do aplikacji
- Użytkownik ma dostęp do swojej biblioteki po zalogowaniu
- Sesja użytkownika jest utrzymywana między wizytami

---

ID: US-003
Tytuł: Wylogowanie z aplikacji

Opis: Jako zalogowany użytkownik, chcę móc się wylogować z aplikacji, aby zabezpieczyć swoje konto na współdzielonym urządzeniu.

Kryteria akceptacji:

- Przycisk wylogowania jest widoczny w interfejsie dla zalogowanego użytkownika
- Kliknięcie przycisku wylogowuje użytkownika
- Po wylogowaniu użytkownik jest przekierowywany na stronę główną
- Po wylogowaniu użytkownik nie ma dostępu do biblioteki bez ponownego zalogowania
- Sesja jest poprawnie zamykana po stronie serwera

---

ID: US-004
Tytuł: Obsługa wygasłego magic linka

Opis: Jako użytkownik, który otrzymał magic link ale nie użył go w czasie, chcę otrzymać jasną informację o wygaśnięciu i możliwość wysłania nowego linka.

Kryteria akceptacji:

- System wykrywa wygasły magic link
- System wyświetla przyjazny komunikat informujący o wygaśnięciu linka
- System oferuje opcję wysłania nowego magic linka
- Użytkownik może poprosić o nowy link bez powrotu do formularza rejestracji/logowania

---

ID: US-005
Tytuł: Obsługa nieistniejącego konta przy logowaniu

Opis: Jako użytkownik próbujący się zalogować z e-mailem bez konta, chcę otrzymać informację o braku konta i możliwość rejestracji.

Kryteria akceptacji:

- System sprawdza czy podany e-mail istnieje w bazie
- System wyświetla komunikat że konto nie istnieje
- System oferuje opcję rejestracji z podanym adresem e-mail
- Użytkownik może łatwo przejść do formularza rejestracji

---

### Generowanie kolorowanek

---

ID: US-006
Tytuł: Generowanie kolorowanki z promptem

Opis: Jako rodzic, chcę wpisać temat kolorowanki, wybrać wiek dziecka i styl rysunku, aby otrzymać spersonalizowany obrazek gotowy do wydruku.

Kryteria akceptacji:

- Interfejs generatora zawiera pole tekstowe na prompt
- Interfejs zawiera wybór grupy wiekowej: 3-5 lat, 6-8 lat, 9-12 lat
- Interfejs zawiera wybór stylu: Prosty, Klasyczny, Szczegółowy, Mandala
- Przycisk "Generuj" jest aktywny gdy wszystkie pola są wypełnione
- System wyświetla wskaźnik postępu podczas generowania
- Wygenerowany obrazek jest wyświetlany jako podgląd
- Obrazek jest w formacie line art (czarno-biały)
- Czas generowania nie przekracza 30 sekund

---

ID: US-007
Tytuł: Wybór odpowiedniego stylu dla wieku dziecka

Opis: Jako rodzic, chcę aby nazwy stylów sugerowały poziom trudności, abym mógł łatwo wybrać odpowiedni styl dla mojego dziecka.

Kryteria akceptacji:

- Styl "Prosty" jest oznaczony jako odpowiedni dla najmłodszych (3-5 lat)
- Styl "Klasyczny" jest opisany jako średnia szczegółowość
- Styl "Szczegółowy" jest oznaczony jako odpowiedni dla dzieci 9-12 lat
- Styl "Mandala" jest opisany jako geometryczne wzory
- Każdy styl ma krótki opis lub ikonę ilustrującą jego charakter

---

ID: US-008
Tytuł: Walidacja bezpieczeństwa promptu

Opis: Jako rodzic, chcę mieć pewność że wygenerowane treści będą odpowiednie dla dzieci, nawet jeśli przypadkowo wprowadzę nieodpowiedni prompt.

Kryteria akceptacji:

- System analizuje prompt przed rozpoczęciem generowania
- Nieodpowiednie prompty są blokowane przed generowaniem
- System wyświetla łagodny, przyjazny komunikat (np. "Ups! Ten temat nie nadaje się do kolorowanki. Spróbuj czegoś innego")
- Komunikat zawiera sugestię alternatywnego tematu
- Brak surowych lub technicznych komunikatów o błędach
- Historia zablokowanych promptów nie jest przechowywana

---

ID: US-009
Tytuł: Automatyczne tagowanie kolorowanki

Opis: Jako użytkownik, chcę aby moje kolorowanki były automatycznie tagowane, aby były łatwiejsze do znalezienia w galerii.

Kryteria akceptacji:

- System generuje 3-5 tagów dla każdej kolorowanki
- Tagi są generowane na podstawie promptu i obrazka
- Tagi są wyświetlane przy kolorowance w bibliotece i galerii
- Tagi są w języku polskim
- Tagi są używane w wyszukiwaniu galerii publicznej

---

ID: US-010
Tytuł: Limit dzienny generowania

Opis: Jako użytkownik, chcę widzieć ile kolorowanek mogę jeszcze wygenerować danego dnia, aby móc planować korzystanie z aplikacji.

Kryteria akceptacji:

- Licznik pozostałych generowań jest widoczny w interfejsie generatora
- Limit wynosi 10 generowań dziennie
- Licznik aktualizuje się po każdym wygenerowaniu
- Limit resetuje się o północy
- Przy osiągnięciu limitu system wyświetla przyjazny komunikat
- Komunikat informuje o czasie do resetu limitu

---

ID: US-011
Tytuł: Obsługa przekroczonego limitu generowania

Opis: Jako użytkownik który wykorzystał dzienny limit, chcę otrzymać informację o czasie do resetu i alternatywnych opcjach.

Kryteria akceptacji:

- Przycisk "Generuj" jest nieaktywny po osiągnięciu limitu
- System wyświetla komunikat o przekroczeniu limitu
- Komunikat zawiera informację o czasie do resetu (ile godzin/minut)
- System sugeruje przeglądanie galerii publicznej jako alternatywę
- Użytkownik może dalej korzystać z biblioteki i drukowania

---

ID: US-012
Tytuł: Zapisanie wygenerowanej kolorowanki

Opis: Jako rodzic, chcę zapisać wygenerowaną kolorowankę do mojej biblioteki, aby móc ją później wydrukować lub pokazać dziecku.

Kryteria akceptacji:

- Po wygenerowaniu widoczny jest przycisk "Zapisz do biblioteki"
- Kliknięcie przycisku zapisuje kolorowankę z wszystkimi metadanymi
- System wyświetla potwierdzenie zapisania
- Kolorowanka pojawia się w bibliotece użytkownika
- Jeśli biblioteka jest pełna, system wyświetla stosowny komunikat

---

ID: US-013
Tytuł: Ponowne generowanie kolorowanki

Opis: Jako rodzic niezadowolony z wygenerowanego obrazka, chcę móc wygenerować nową wersję bez zmiany parametrów.

Kryteria akceptacji:

- Przycisk "Generuj ponownie" jest dostępny po wygenerowaniu
- Kliknięcie generuje nowy obrazek z tymi samymi parametrami
- Poprzedni obrazek jest zastępowany nowym
- Generowanie zużywa 1 z dziennego limitu
- Użytkownik może edytować prompt przed ponownym generowaniem

---

### Biblioteka kolorowanek

---

ID: US-014
Tytuł: Przeglądanie biblioteki kolorowanek

Opis: Jako rodzic, chcę przeglądać moje zapisane kolorowanki w formie galerii, aby łatwo znaleźć tę którą chcę wydrukować.

Kryteria akceptacji:

- Biblioteka wyświetla miniatury zapisanych kolorowanek
- Każda miniatura pokazuje podstawowe informacje (prompt, data)
- Kolorowanki są posortowane od najnowszych
- Widoczna jest liczba zapisanych kolorowanek i limit (np. 45/100)
- Kliknięcie miniatury otwiera podgląd kolorowanki

---

ID: US-015
Tytuł: Podgląd kolorowanki z biblioteki

Opis: Jako rodzic, chcę zobaczyć kolorowankę w pełnym rozmiarze wraz z jej szczegółami.

Kryteria akceptacji:

- Kolorowanka jest wyświetlana w dużym rozmiarze
- Widoczne są metadane: prompt, tagi, data utworzenia, grupa wiekowa, styl
- Dostępne są przyciski akcji: Drukuj, Pobierz, Usuń, Dodaj/Usuń z ulubionych
- Można zamknąć podgląd i wrócić do biblioteki

---

ID: US-016
Tytuł: Usuwanie kolorowanki z biblioteki

Opis: Jako rodzic, chcę móc usunąć niechciane kolorowanki z biblioteki, aby zrobić miejsce na nowe.

Kryteria akceptacji:

- Przycisk usuwania jest dostępny w podglądzie kolorowanki
- System wyświetla potwierdzenie przed usunięciem
- Potwierdzenie zawiera miniaturę kolorowanki do usunięcia
- Po potwierdzeniu kolorowanka jest trwale usuwana
- Licznik biblioteki jest aktualizowany po usunięciu
- Kolorowanka pozostaje w galerii publicznej (jest anonimowa)

---

ID: US-017
Tytuł: Ostrzeżenie o zbliżającym się limicie biblioteki

Opis: Jako rodzic zbliżający się do limitu biblioteki, chcę otrzymać ostrzeżenie, abym mógł zarządzać swoją kolekcją.

Kryteria akceptacji:

- System wyświetla ostrzeżenie gdy biblioteka osiąga 80 kolorowanek (80%)
- Ostrzeżenie jest widoczne w widoku biblioteki
- Ostrzeżenie można zamknąć, ale pojawia się ponownie przy kolejnej wizycie
- Przy 100 kolorowankach zapisywanie nowych jest blokowane

---

ID: US-019
Tytuł: Oznaczanie kolorowanki jako ulubionej

Opis: Jako rodzic, chcę oznaczać najlepsze kolorowanki jako ulubione, aby łatwo je później znaleźć.

Kryteria akceptacji:

- Ikona serca/gwiazdki jest dostępna przy każdej kolorowance
- Kliknięcie ikony dodaje/usuwa kolorowankę z ulubionych
- Stan ulubionej jest widoczny wizualnie (wypełniona vs pusta ikona)
- Można filtrować bibliotekę pokazując tylko ulubione
- Polubienia są prywatne (niewidoczne dla innych użytkowników)

---

### Drukowanie kolorowanek

---

ID: US-020
Tytuł: Drukowanie kolorowanki z podglądem

Opis: Jako rodzic, chcę wydrukować wybraną kolorowankę w formacie A4, aby moje dziecko mogło ją pokolorować.

Kryteria akceptacji:

- Przycisk "Drukuj" jest dostępny w podglądzie kolorowanki
- System wyświetla okno z opcjami drukowania
- Można wybrać orientację: pionowa lub pozioma
- System wyświetla podgląd jak będzie wyglądał wydruk
- Przycisk "Drukuj" otwiera systemowe okno drukowania
- Kolorowanka jest optymalizowana do formatu A4

---

ID: US-021
Tytuł: Eksport kolorowanki do PDF

Opis: Jako rodzic, chcę zapisać kolorowankę jako PDF, aby móc ją wydrukować później lub na innym urządzeniu.

Kryteria akceptacji:

- Przycisk "Pobierz PDF" jest dostępny w opcjach drukowania
- PDF jest generowany w formacie A4
- PDF zachowuje wybraną orientację (pionowa/pozioma)
- Nazwa pliku zawiera fragment promptu lub datę
- PDF jest zoptymalizowany do druku (wysoka jakość)

---

ID: US-022
Tytuł: Drukowanie bezpośrednio po wygenerowaniu

Opis: Jako rodzic, chcę móc wydrukować kolorowankę od razu po wygenerowaniu, bez konieczności zapisywania do biblioteki.

Kryteria akceptacji:

- Przycisk "Drukuj" jest dostępny obok "Zapisz" po wygenerowaniu
- Drukowanie nie wymaga wcześniejszego zapisania kolorowanki
- Proces drukowania jest taki sam jak z biblioteki
- Po wydrukowaniu można nadal zapisać kolorowankę

---

### Galeria publiczna

---

ID: US-023
Tytuł: Przeglądanie galerii publicznej

Opis: Jako rodzic, chcę przeglądać kolorowanki stworzone przez innych użytkowników, aby znaleźć inspiracje bez wymyślania własnych promptów.

Kryteria akceptacji:

- Galeria publiczna jest dostępna z głównego menu
- Galeria wyświetla miniatury kolorowanek w formie siatki
- Kolorowanki są anonimowe (bez informacji o autorze)
- Każda miniatura pokazuje prompt i tagi
- Można przewijać galerię aby zobaczyć więcej kolorowanek
- Galeria działa dla zalogowanych i niezalogowanych użytkowników

---

ID: US-024
Tytuł: Wyszukiwanie w galerii publicznej

Opis: Jako rodzic szukający konkretnego tematu, chcę wyszukać kolorowanki po słowach kluczowych.

Kryteria akceptacji:

- Pole wyszukiwania jest widoczne w galerii
- Wyszukiwanie działa po promptach i tagach
- Wyniki są wyświetlane w czasie rzeczywistym lub po naciśnięciu Enter
- Wyniki są posortowane według trafności
- Komunikat jest wyświetlany gdy brak wyników
- Można wyczyścić wyszukiwanie i wrócić do pełnej galerii

---

ID: US-025
Tytuł: Filtrowanie galerii po grupie wiekowej

Opis: Jako rodzic dziecka w określonym wieku, chcę filtrować galerię po grupie wiekowej, aby widzieć tylko odpowiednie kolorowanki.

Kryteria akceptacji:

- Filtry grup wiekowych są dostępne: 3-5 lat, 6-8 lat, 9-12 lat, Wszystkie
- Można wybrać jedną lub więcej grup wiekowych
- Wyniki aktualizują się po zmianie filtra
- Aktywne filtry są wizualnie oznaczone
- Filtry działają razem z wyszukiwaniem

---

ID: US-026
Tytuł: Sortowanie galerii

Opis: Jako użytkownik, chcę sortować galerię według różnych kryteriów, aby łatwiej znaleźć interesujące kolorowanki.

Kryteria akceptacji:

- Dostępne opcje sortowania: Najnowsze, Najpopularniejsze
- Domyślne sortowanie to Najnowsze
- Zmiana sortowania odświeża wyniki
- Wybrane sortowanie jest wizualnie oznaczone
- Sortowanie działa razem z filtrami i wyszukiwaniem

---

ID: US-027
Tytuł: Dodawanie kolorowanki z galerii do ulubionych

Opis: Jako zalogowany użytkownik, chcę zapisać kolorowankę z galerii do moich ulubionych, aby móc ją później łatwo znaleźć.

Kryteria akceptacji:

- Ikona ulubione jest dostępna przy każdej kolorowance w galerii
- Funkcja wymaga zalogowania
- Dla niezalogowanych system wyświetla zachętę do logowania
- Dodane kolorowanki są widoczne w sekcji ulubione w bibliotece
- Można usunąć kolorowankę z ulubionych

---

ID: US-028
Tytuł: Drukowanie kolorowanki z galerii

Opis: Jako rodzic, chcę wydrukować kolorowankę znalezioną w galerii publicznej.

Kryteria akceptacji:

- Przycisk "Drukuj" jest dostępny w podglądzie kolorowanki z galerii
- Proces drukowania jest identyczny jak dla własnych kolorowanek
- Drukowanie jest dostępne dla zalogowanych i niezalogowanych użytkowników
- Można również pobrać kolorowankę jako PDF

---

### Obsługa błędów i przypadki brzegowe

---

ID: US-029
Tytuł: Obsługa błędu generowania

Opis: Jako użytkownik, chcę otrzymać jasną informację gdy generowanie kolorowanki się nie powiedzie.

Kryteria akceptacji:

- System wyświetla przyjazny komunikat o błędzie
- Komunikat nie zawiera technicznych szczegółów
- System oferuje opcję ponowienia próby
- Nieudane generowanie nie zużywa dziennego limitu
- System loguje błędy do celów diagnostycznych

---

ID: US-030
Tytuł: Obsługa braku połączenia internetowego

Opis: Jako użytkownik z niestabilnym internetem, chcę wiedzieć gdy aplikacja nie może się połączyć z serwerem.

Kryteria akceptacji:

- System wykrywa brak połączenia
- System wyświetla komunikat o problemach z połączeniem
- Zapisane kolorowanki w bibliotece są nadal widoczne (jeśli zcache'owane)
- System automatycznie ponawia połączenie
- Po przywróceniu połączenia funkcje działają normalnie

---

ID: US-031
Tytuł: Obsługa pustej biblioteki

Opis: Jako nowy użytkownik bez zapisanych kolorowanek, chcę widzieć zachętę do wygenerowania pierwszej kolorowanki.

Kryteria akceptacji:

- Pusta biblioteka wyświetla przyjazny komunikat
- Komunikat zawiera link/przycisk do generatora
- Sugerowane są przykładowe prompty
- Interfejs nie wygląda na "zepsuty" przy braku treści

---

ID: US-032
Tytuł: Obsługa pustych wyników wyszukiwania

Opis: Jako użytkownik szukający nietypowego tematu, chcę otrzymać pomocną informację gdy nic nie zostanie znalezione.

Kryteria akceptacji:

- System wyświetla przyjazny komunikat o braku wyników
- System sugeruje modyfikację wyszukiwania
- System proponuje wygenerowanie własnej kolorowanki na ten temat
- Wyświetlane są popularne tagi jako alternatywa

---

ID: US-033
Tytuł: Dostęp do aplikacji bez logowania

Opis: Jako niezalogowany użytkownik, chcę móc przeglądać galerię publiczną, aby ocenić aplikację przed rejestracją.

Kryteria akceptacji:

- Galeria publiczna jest dostępna bez logowania
- Wyszukiwanie i filtrowanie działają bez logowania
- Drukowanie/pobieranie z galerii działa bez logowania
- Generator wymaga zalogowania
- Biblioteka wymaga zalogowania
- System wyświetla zachęty do rejestracji w odpowiednich miejscach

---

ID: US-034
Tytuł: Timeout podczas generowania

Opis: Jako użytkownik, chcę być informowany gdy generowanie trwa dłużej niż zwykle.

Kryteria akceptacji:

- Po 15 sekundach system wyświetla komunikat że generowanie trwa dłużej
- Po 30 sekundach system oferuje anulowanie i ponowienie próby
- Anulowanie nie zużywa dziennego limitu
- System informuje że serwery mogą być przeciążone

---

ID: US-035
Tytuł: Walidacja pustego promptu

Opis: Jako użytkownik, chcę otrzymać podpowiedź gdy próbuję wygenerować kolorowankę bez opisu.

Kryteria akceptacji:

- Przycisk "Generuj" jest nieaktywny gdy prompt jest pusty
- System wyświetla podpowiedź zachęcającą do wpisania tematu
- Podpowiedź zawiera przykładowe prompty
- Po wpisaniu tekstu przycisk staje się aktywny

---

ID: US-036
Tytuł: Obsługa bardzo długiego promptu

Opis: Jako użytkownik wpisujący szczegółowy opis, chcę wiedzieć czy mój prompt nie jest za długi.

Kryteria akceptacji:

- System wyświetla licznik znaków przy polu promptu
- System ogranicza długość promptu do rozsądnego limitu (np. 500 znaków)
- Przy zbliżaniu się do limitu licznik zmienia kolor
- Po osiągnięciu limitu dalsze wpisywanie jest blokowane
- Komunikat informuje o maksymalnej długości

---

## 6. Metryki sukcesu

### 6.1 Metryki jakości generowania

| Metryka                  | Cel                      | Metoda pomiaru                                                                                                   |
| ------------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Zgodność z promptem      | >70% pozytywnych ocen    | System ocen plus/minus po każdym generowaniu; użytkownik może opcjonalnie ocenić czy obrazek odpowiada promptowi |
| Odpowiedniość dla dzieci | 100% bezpiecznych treści | Automatyczna walidacja AI przed generowaniem; brak raportów o nieodpowiednich treściach                          |
| Czytelność line art      | >80% pozytywnych ocen    | Feedback użytkowników; obrazki są wyraźne i nadają się do kolorowania                                            |

### 6.2 Metryki wydajności

| Metryka               | Cel         | Metoda pomiaru                                                        |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| Czas generowania      | <30 sekund  | Automatyczny pomiar czasu od wysłania żądania do wyświetlenia obrazka |
| Dostępność usługi     | >99% uptime | Monitoring serwera i API                                              |
| Czas ładowania strony | <3 sekundy  | Automatyczny pomiar First Contentful Paint                            |

### 6.3 Metryki użycia

| Metryka                         | Cel                                                 | Metoda pomiaru                          |
| ------------------------------- | --------------------------------------------------- | --------------------------------------- |
| Liczba generowań na użytkownika | >3 dziennie aktywni użytkownicy                     | Analityka użycia generatora             |
| Wskaźnik zapisywania            | >50% generowanych kolorowanek zapisanych            | Stosunek zapisanych do wygenerowanych   |
| Wskaźnik drukowania             | >30% zapisanych kolorowanek wydrukowanych/pobranych | Analityka akcji drukowania i pobierania |
| Retencja 7-dniowa               | >40% powracających użytkowników                     | Analityka logowań                       |

### 6.4 Metryki bezpieczeństwa

| Metryka                          | Cel                                           | Metoda pomiaru                                                    |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| Skuteczność filtrowania promptów | >99% zablokowanych nieodpowiednich treści     | Monitoring walidacji AI; testy z celowo nieodpowiednimi promptami |
| Fałszywe blokady                 | <5% poprawnych promptów błędnie zablokowanych | Feedback użytkowników; analiza zablokowanych promptów             |

### 6.5 Metryki galerii publicznej

| Metryka                    | Cel                                        | Metoda pomiaru                 |
| -------------------------- | ------------------------------------------ | ------------------------------ |
| Interakcje z galerią       | >20% użytkowników korzysta z galerii       | Analityka przeglądania galerii |
| Wykorzystanie wyszukiwania | >30% sesji galerii używa wyszukiwania      | Analityka wyszukiwań           |
| Drukowanie z galerii       | >10% przeglądanych kolorowanek drukowanych | Analityka akcji drukowania     |
