# Podsumowanie planowania PRD - Malowanko

## Decisions

1. **Autoryzacja**: Supabase Auth z magic linkiem wysyłanym na e-mail (bez SMS, bez logowania społecznościowego)
2. **Model AI**: OpenAI API jako silnik do generowania kolorowanek
3. **Publikacja kolorowanek**: Domyślnie wszystkie kolorowanki są publiczne i anonimowe (bez widocznego autora); brak opcji oznaczenia jako prywatne w MVP
4. **Bezpieczeństwo promptów**: AI analizuje prompt przed generowaniem; przy nieodpowiedniej treści wyświetla łagodny, przyjazny komunikat z sugestią alternatywy
5. **Style rysunku**: 4 predefiniowane style - "Prosty" (3-5 lat), "Klasyczny" (średnia szczegółowość), "Szczegółowy" (9-12 lat), "Mandala" (geometryczne wzory)
6. **Automatyczne tagowanie**: AI generuje 3-5 tagów podczas tworzenia kolorowanki dla lepszej wyszukiwalności
7. **Wyszukiwanie w galerii**: Po promptach, tagach i grupie wiekowej; filtry tylko po grupie wiekowej (bez kategorii tematycznych)
8. **Limit generowania**: 10 kolorowanek dziennie z resetem o północy; licznik pozostałych generowań widoczny w UI
9. **Limit biblioteki**: Maksymalnie 100 zapisanych kolorowanek; ostrzeżenie przy 80% pojemności; ręczne usuwanie przez użytkownika; opcja pobrania jako ZIP
10. **System ocen**: Tylko prywatne polubienia przez użytkownika który wygenerował obrazek (nie publiczny ranking)
11. **Onboarding**: Brak - użytkownik od razu trafia do aplikacji po rejestracji
12. **Grupa docelowa**: Rodzice jako główna persona
13. **Harmonogram**: Iteracyjne podejście - (1) Generator + autoryzacja 4-6 tyg., (2) Biblioteka + drukowanie 2-3 tyg., (3) Galeria publiczna 2 tyg.
14. **UI**: Responsywna aplikacja mobilna i desktopowa

---

## Matched Recommendations

1. **Magic link przez e-mail** jako główna metoda autoryzacji - niższe koszty niż SMS, wygodne dla rodziców, bez konieczności zapamiętywania haseł
2. **Łagodne komunikaty bezpieczeństwa** - przyjazny ton typu "Ups! Ten temat nie nadaje się do kolorowanki. Spróbuj czegoś innego" zamiast surowych blokad
3. **4 predefiniowane style** z nazwami sugerującymi poziom trudności: Prosty, Klasyczny, Szczegółowy, Mandala
4. **Automatyczne tagowanie przez AI** (3-5 tagów) podczas generowania dla poprawy odkrywalności w galerii
5. **Limit 100 kolorowanek** z ostrzeżeniem przy 80% i opcją eksportu ZIP przed czyszczeniem
6. **10 generowań dziennie** z resetem o północy i widocznym licznikiem - kontrola kosztów API przy zachowaniu użyteczności
7. **Iteracyjny harmonogram rozwoju** z możliwością przesunięcia galerii publicznej poza MVP jeśli czas będzie ograniczony

---

## PRD Planning Summary

### Główne wymagania funkcjonalne

#### 1. System autoryzacji (Supabase Auth)

- Rejestracja i logowanie przez magic link (e-mail)
- Zarządzanie sesją użytkownika
- Profil użytkownika z podstawowymi ustawieniami

#### 2. Generator kolorowanek (OpenAI API)

- Pole tekstowe do wpisania promptu
- Wybór grupy wiekowej: 3-5 lat, 6-8 lat, 9-12 lat
- Wybór stylu: Prosty, Klasyczny, Szczegółowy, Mandala
- Walidacja bezpieczeństwa promptu przez AI przed generowaniem
- Generowanie obrazka line art (czarno-biały)
- Automatyczne generowanie 3-5 tagów przez AI
- Limit 10 generowań dziennie z licznikiem w UI

#### 3. Biblioteka kolorowanek

- Zapisywanie wygenerowanych kolorowanek (limit 100 sztuk)
- Przeglądanie zapisanych kolorowanek
- Usuwanie kolorowanek
- Ostrzeżenie przy 80% pojemności
- Eksport wszystkich kolorowanek jako ZIP
- Prywatne polubienia własnych kolorowanek

#### 4. Moduł drukowania

- Wybór kolorowanek do wydruku
- Ustalenie layoutu (poziomy/pionowy)
- Podgląd wydruku
- Eksport do PDF w formacie A4
- Bezpośredni wydruk z przeglądarki

#### 5. Galeria publiczna

- Przeglądanie anonimowych kolorowanek innych użytkowników
- Wyszukiwanie po promptach i tagach
- Filtrowanie po grupie wiekowej
- Dodawanie do ulubionych
- Sortowanie: Najnowsze / Najpopularniejsze

### Kluczowe historie użytkownika

#### US1: Generowanie kolorowanki

> Jako rodzic, chcę wpisać temat kolorowanki i wybrać wiek dziecka, aby otrzymać spersonalizowany obrazek gotowy do wydruku.

Flow: Wpisz prompt → Wybierz wiek → Wybierz styl → Kliknij "Generuj" → Zobacz podgląd → Zapisz/Drukuj

#### US2: Drukowanie kolorowanki

> Jako rodzic, chcę wydrukować wygenerowaną kolorowankę w formacie A4, aby moje dziecko mogło ją pokolorować.

Flow: Otwórz kolorowankę → Kliknij "Drukuj" → Wybierz orientację → Podgląd → Drukuj/Eksportuj PDF

#### US3: Przeglądanie galerii

> Jako rodzic, chcę przeglądać kolorowanki stworzone przez innych, aby znaleźć inspiracje bez konieczności wymyślania promptów.

Flow: Otwórz galerię → Filtruj po wieku → Wyszukaj temat → Przeglądaj → Dodaj do ulubionych → Drukuj

#### US4: Zarządzanie biblioteką

> Jako rodzic, chcę zarządzać swoją kolekcją kolorowanek, aby mieć dostęp do ulubionych motywów.

Flow: Otwórz bibliotekę → Przeglądaj → Usuń niechciane → Pobierz ZIP przed czyszczeniem

### Kryteria sukcesu i sposób mierzenia

| Kryterium             | Cel                                                         | Sposób pomiaru                                                        |
| --------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------- |
| Jakość generowania    | >70% obrazków zgodnych z promptem i odpowiednich dla dzieci | System ocen plus/minus od użytkowników po każdym generowaniu          |
| Czas generowania      | <30 sekund                                                  | Automatyczny pomiar czasu od wysłania żądania do wyświetlenia obrazka |
| Bezpieczeństwo treści | 0% nieodpowiednich treści                                   | Walidacja AI przed generowaniem                                       |

### Stos technologiczny (wstępnie)

- **Frontend**: Next.js (już zainicjowany w projekcie)
- **Backend/Auth**: Supabase (Auth + Database + Storage)
- **AI**: OpenAI API (DALL-E lub GPT-4 Vision do walidacji + generowania)
- **Hosting**: Vercel (naturalne dla Next.js)

---

## Unresolved Issues

1. **Konkretny model OpenAI**: Który model będzie użyty do generowania (DALL-E 3? Inny?) i który do walidacji bezpieczeństwa promptów (GPT-4?)

2. **Koszty i budżet API**: Brak ustaleń dotyczących przewidywanego budżetu na API OpenAI i maksymalnej liczby użytkowników w MVP

3. **Format przechowywania obrazków**: Nie ustalono formatu (PNG/SVG/WebP) ani rozdzielczości generowanych kolorowanek

4. **RODO i prywatność**: Brak ustaleń dotyczących polityki prywatności, przechowywania danych i zgodności z RODO (szczególnie ważne przy produktach dla dzieci)
