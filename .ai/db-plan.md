# Schemat bazy danych - Malowanko

## 1. Tabele

### 1.1 profiles

Tabela rozszerzająca Supabase Auth o dane aplikacyjne użytkownika.

| Kolumna              | Typ         | Ograniczenia                                             | Opis                                           |
| -------------------- | ----------- | -------------------------------------------------------- | ---------------------------------------------- |
| id                   | UUID        | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | ID użytkownika z Supabase Auth                 |
| email                | TEXT        | NOT NULL                                                 | Adres e-mail użytkownika                       |
| created_at           | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                                  | Data rejestracji                               |
| generations_today    | INTEGER     | NOT NULL, DEFAULT 0                                      | Liczba wygenerowanych obrazków dzisiaj         |
| last_generation_date | DATE        | NULL                                                     | Data ostatniego generowania (do resetu limitu) |

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generations_today INTEGER NOT NULL DEFAULT 0,
    last_generation_date DATE
);
```

### 1.2 colorings

Tabela przechowująca wszystkie wygenerowane kolorowanki.

| Kolumna         | Typ         | Ograniczenia                                        | Opis                                                  |
| --------------- | ----------- | --------------------------------------------------- | ----------------------------------------------------- |
| id              | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()              | Unikalny identyfikator kolorowanki                    |
| user_id         | UUID        | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | Twórca/właściciel kolorowanki                         |
| image_url       | TEXT        | NOT NULL                                            | URL obrazka w Supabase Storage                        |
| prompt          | TEXT        | NOT NULL                                            | Prompt użyty do wygenerowania                         |
| tags            | TEXT[]      | NOT NULL, DEFAULT '{}'                              | Tagi kolorowanki (3-5 tagów)                          |
| age_group       | TEXT        | NOT NULL                                            | Grupa wiekowa: '3-5', '6-8', '9-12'                   |
| style           | TEXT        | NOT NULL                                            | Styl: 'prosty', 'klasyczny', 'szczegolowy', 'mandala' |
| created_at      | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                             | Data utworzenia                                       |
| favorites_count | INTEGER     | NOT NULL, DEFAULT 0                                 | Liczba polubień (denormalizowana)                     |

```sql
CREATE TABLE colorings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    age_group TEXT NOT NULL,
    style TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    favorites_count INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT valid_age_group CHECK (age_group IN ('0-3', '4-8', '9-12')),
    CONSTRAINT valid_style CHECK (style IN ('prosty', 'klasyczny', 'szczegolowy', 'mandala')),
    CONSTRAINT valid_prompt_length CHECK (char_length(prompt) <= 500)
);
```

### 1.3 user_library

Tabela łącząca - biblioteka osobista użytkownika.

| Kolumna     | Typ         | Ograniczenia                                         | Opis                                     |
| ----------- | ----------- | ---------------------------------------------------- | ---------------------------------------- |
| user_id     | UUID        | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE  | ID użytkownika                           |
| coloring_id | UUID        | NOT NULL, REFERENCES colorings(id) ON DELETE CASCADE | ID kolorowanki                           |
| added_at    | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                              | Data dodania do biblioteki               |
| is_favorite | BOOLEAN     | NOT NULL, DEFAULT FALSE                              | Czy oznaczona jako ulubiona w bibliotece |

```sql
CREATE TABLE user_library (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    coloring_id UUID NOT NULL REFERENCES colorings(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (user_id, coloring_id)
);
```

### 1.4 favorites

Tabela przechowująca polubienia kolorowanek (z biblioteki własnej lub galerii publicznej).

| Kolumna     | Typ         | Ograniczenia                                         | Opis                       |
| ----------- | ----------- | ---------------------------------------------------- | -------------------------- |
| user_id     | UUID        | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE  | ID użytkownika             |
| coloring_id | UUID        | NOT NULL, REFERENCES colorings(id) ON DELETE CASCADE | ID kolorowanki             |
| created_at  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                              | Data dodania do ulubionych |

```sql
CREATE TABLE favorites (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    coloring_id UUID NOT NULL REFERENCES colorings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, coloring_id)
);
```

## 2. Relacje między tabelami

```
┌─────────────────┐           ┌──────────────────┐           ┌─────────────────┐
│    profiles     │           │    colorings     │           │    favorites    │
├─────────────────┤           ├──────────────────┤           ├─────────────────┤
│ id (PK)         │◄──────────│ user_id (FK)     │◄──────────│ coloring_id(FK) │
│ email           │     1:N   │ id (PK)          │     N:M   │ user_id (FK)    │
│ created_at      │           │ image_url        │           │ created_at      │
│ generations     │           │ prompt           │           └─────────────────┘
│ _today          │           │ tags[]           │                    │
│ last_generation │           │ age_group        │                    │
│ _date           │           │ style            │                    │
└─────────────────┘           │ created_at       │                    │
        │                     │ favorites_count  │                    │
        │                     └──────────────────┘                    │
        │                              │                              │
        │                              │                              │
        │     ┌────────────────────────┴──────────────────────────────┘
        │     │
        │     ▼
        │   ┌──────────────────┐
        └──►│   user_library   │
      1:N   ├──────────────────┤
            │ user_id (FK, PK) │
            │ coloring_id(FK,PK)│
            │ added_at         │
            │ is_favorite      │
            └──────────────────┘
```

### Opis relacji:

| Relacja                             | Kardynalność | Opis                                                |
| ----------------------------------- | ------------ | --------------------------------------------------- |
| profiles → colorings                | 1:N          | Użytkownik może wygenerować wiele kolorowanek       |
| profiles → user_library → colorings | N:M          | Użytkownik może mieć wiele kolorowanek w bibliotece |
| profiles → favorites → colorings    | N:M          | Użytkownik może polubić wiele kolorowanek           |

## 3. Indeksy

```sql
-- Indeksy dla tabeli colorings

-- Sortowanie po dacie utworzenia (Najnowsze)
CREATE INDEX idx_colorings_created_at ON colorings(created_at DESC);

-- Sortowanie po popularności (Najpopularniejsze)
CREATE INDEX idx_colorings_favorites_count ON colorings(favorites_count DESC);

-- Filtrowanie po grupie wiekowej
CREATE INDEX idx_colorings_age_group ON colorings(age_group);

-- Wyszukiwanie po tagach (GIN dla tablicy)
CREATE INDEX idx_colorings_tags ON colorings USING GIN(tags);

-- Full-text search po promptach
CREATE INDEX idx_colorings_prompt_search ON colorings USING GIN(to_tsvector('polish', prompt));

-- Composite index dla typowych zapytań galerii (filtr + sortowanie)
CREATE INDEX idx_colorings_age_group_created_at ON colorings(age_group, created_at DESC);

-- Indeks dla pobierania kolorowanek użytkownika
CREATE INDEX idx_colorings_user_id ON colorings(user_id);

-- Indeksy dla tabeli user_library

-- Szybkie pobieranie biblioteki użytkownika
CREATE INDEX idx_user_library_user_id ON user_library(user_id);

-- Sortowanie biblioteki po dacie dodania
CREATE INDEX idx_user_library_added_at ON user_library(user_id, added_at DESC);

-- Filtrowanie ulubionych w bibliotece
CREATE INDEX idx_user_library_favorites ON user_library(user_id) WHERE is_favorite = TRUE;

-- Indeksy dla tabeli favorites

-- Szybkie pobieranie ulubionych użytkownika
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- Sortowanie ulubionych po dacie
CREATE INDEX idx_favorites_created_at ON favorites(user_id, created_at DESC);
```

## 4. Triggery

### 4.1 Automatyczna aktualizacja favorites_count

```sql
-- Funkcja aktualizująca licznik polubień
CREATE OR REPLACE FUNCTION update_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE colorings
        SET favorites_count = favorites_count + 1
        WHERE id = NEW.coloring_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE colorings
        SET favorites_count = favorites_count - 1
        WHERE id = OLD.coloring_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger dla tabeli favorites
CREATE TRIGGER trigger_update_favorites_count
AFTER INSERT OR DELETE ON favorites
FOR EACH ROW
EXECUTE FUNCTION update_favorites_count();
```

### 4.2 Automatyczne dodawanie do biblioteki po wygenerowaniu

```sql
-- Funkcja dodająca kolorowankę do biblioteki twórcy
CREATE OR REPLACE FUNCTION add_coloring_to_library()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_library (user_id, coloring_id, added_at)
    VALUES (NEW.user_id, NEW.id, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger dla tabeli colorings
CREATE TRIGGER trigger_add_to_library
AFTER INSERT ON colorings
FOR EACH ROW
EXECUTE FUNCTION add_coloring_to_library();
```

### 4.3 Automatyczne tworzenie profilu przy rejestracji

```sql
-- Funkcja tworząca profil dla nowego użytkownika
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, created_at)
    VALUES (NEW.id, NEW.email, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger na tabeli auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
```

## 5. Polityki Row Level Security (RLS)

### 5.1 Włączenie RLS dla wszystkich tabel

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE colorings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
```

### 5.2 Polityki dla tabeli profiles

```sql
-- Użytkownik może odczytać tylko swój profil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Użytkownik może aktualizować tylko swój profil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 5.3 Polityki dla tabeli colorings

```sql
-- Wszyscy (w tym anonimowi) mogą przeglądać kolorowanki w galerii
CREATE POLICY "Anyone can view colorings"
ON colorings FOR SELECT
TO anon, authenticated
USING (true);

-- Zalogowani użytkownicy mogą tworzyć kolorowanki
CREATE POLICY "Authenticated users can create colorings"
ON colorings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Użytkownicy mogą usuwać tylko swoje kolorowanki
CREATE POLICY "Users can delete own colorings"
ON colorings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### 5.4 Polityki dla tabeli user_library

```sql
-- Użytkownik może przeglądać tylko swoją bibliotekę
CREATE POLICY "Users can view own library"
ON user_library FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Użytkownik może dodawać do swojej biblioteki
CREATE POLICY "Users can add to own library"
ON user_library FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Użytkownik może aktualizować wpisy w swojej bibliotece (is_favorite)
CREATE POLICY "Users can update own library"
ON user_library FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Użytkownik może usuwać ze swojej biblioteki
CREATE POLICY "Users can delete from own library"
ON user_library FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### 5.5 Polityki dla tabeli favorites

```sql
-- Użytkownik może przeglądać tylko swoje ulubione
CREATE POLICY "Users can view own favorites"
ON favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Użytkownik może dodawać do ulubionych
CREATE POLICY "Users can add to favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Użytkownik może usuwać z ulubionych
CREATE POLICY "Users can delete from favorites"
ON favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

## 6. Widoki

### 6.1 Widok galerii publicznej (ukrywa user_id)

```sql
CREATE VIEW public_gallery AS
SELECT
    id,
    image_url,
    prompt,
    tags,
    age_group,
    style,
    created_at,
    favorites_count
FROM colorings;

-- Uwaga: RLS na tabeli colorings chroni dane, widok ukrywa user_id
```

### 6.2 Widok biblioteki użytkownika z metadanymi

```sql
CREATE VIEW user_library_view AS
SELECT
    ul.user_id,
    ul.added_at,
    ul.is_favorite AS library_favorite,
    c.id AS coloring_id,
    c.image_url,
    c.prompt,
    c.tags,
    c.age_group,
    c.style,
    c.created_at,
    c.favorites_count,
    EXISTS(SELECT 1 FROM favorites f WHERE f.user_id = ul.user_id AND f.coloring_id = c.id) AS is_global_favorite
FROM user_library ul
JOIN colorings c ON ul.coloring_id = c.id;
```

## 7. Funkcje pomocnicze

### 7.1 Sprawdzanie i aktualizacja limitu dziennego

```sql
CREATE OR REPLACE FUNCTION check_and_update_daily_limit(
    p_user_id UUID,
    p_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    v_generations_today INTEGER;
    v_last_date DATE;
    v_daily_limit CONSTANT INTEGER := 10;
BEGIN
    -- Pobierz aktualne wartości
    SELECT generations_today, last_generation_date
    INTO v_generations_today, v_last_date
    FROM profiles
    WHERE id = p_user_id;

    -- Reset jeśli nowy dzień
    IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
        v_generations_today := 0;
    END IF;

    -- Sprawdź limit
    IF v_generations_today + p_count > v_daily_limit THEN
        RETURN FALSE;
    END IF;

    -- Aktualizuj licznik
    UPDATE profiles
    SET
        generations_today = CASE
            WHEN last_generation_date IS NULL OR last_generation_date < CURRENT_DATE
            THEN p_count
            ELSE generations_today + p_count
        END,
        last_generation_date = CURRENT_DATE
    WHERE id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7.2 Pobieranie pozostałego limitu

```sql
CREATE OR REPLACE FUNCTION get_remaining_generations(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_generations_today INTEGER;
    v_last_date DATE;
    v_daily_limit CONSTANT INTEGER := 10;
BEGIN
    SELECT generations_today, last_generation_date
    INTO v_generations_today, v_last_date
    FROM profiles
    WHERE id = p_user_id;

    -- Reset jeśli nowy dzień
    IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
        RETURN v_daily_limit;
    END IF;

    RETURN GREATEST(0, v_daily_limit - v_generations_today);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 8. Konfiguracja Storage (Supabase)

### 8.1 Bucket dla kolorowanek

```sql
-- Utworzenie bucketa (wykonywane przez Supabase Dashboard lub CLI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('colorings', 'colorings', true);

-- Polityka: wszyscy mogą pobierać obrazki
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'colorings');

-- Polityka: zalogowani mogą uploadować
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'colorings');

-- Polityka: użytkownicy mogą usuwać swoje pliki
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'colorings' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 9. Dodatkowe uwagi i decyzje projektowe

### 9.1 Denormalizacja

- **favorites_count** w tabeli `colorings` - denormalizacja uzasadniona wydajnością przy sortowaniu "Najpopularniejsze". Aktualizowana przez trigger.

### 9.2 Walidacja na poziomie aplikacji vs bazy danych

- **age_group** i **style** - CHECK constraints w bazie dla bezpieczeństwa, ale główna walidacja w aplikacji (łatwiejsze modyfikacje)
- **prompt** - maksymalna długość 500 znaków (CHECK constraint)
- **Bezpieczeństwo promptów** - walidacja przez AI na poziomie aplikacji (nie w bazie)

### 9.3 Limity dzienne

- Przechowywane w `profiles` zamiast osobnej tabeli logów
- Reset przez porównanie daty (bez cron jobów)
- Funkcja `check_and_update_daily_limit` atomowo sprawdza i aktualizuje

### 9.4 Anonimowość galerii

- `user_id` przechowywany w `colorings` (potrzebny dla RLS i funkcjonalności właściciela)
- Widok `public_gallery` i funkcja `search_colorings` nie zwracają `user_id`
- Aplikacja nie eksponuje `user_id` w galerii publicznej

### 9.5 Polubienia w bibliotece vs globalnie

- `user_library.is_favorite` - szybkie oznaczanie w osobistej bibliotece
- `favorites` - globalne polubienia (wpływają na `favorites_count`)
- Jeden obrazek może być polubiony na oba sposoby niezależnie

### 9.6 Cascade Delete

- Usunięcie użytkownika (`profiles`) kaskadowo usuwa:
  - Wszystkie jego kolorowanki (`colorings`)
  - Wpisy w bibliotece (`user_library`)
  - Polubienia (`favorites`)
- Usunięcie kolorowanki kaskadowo usuwa:
  - Wpisy w bibliotekach użytkowników
  - Polubienia

### 9.7 Indeksy

- GIN dla `tags[]` - wydajne wyszukiwanie po tablicy
- GIN z `to_tsvector('polish', prompt)` - full-text search w języku polskim
- Composite index `(age_group, created_at DESC)` - optymalizacja typowych zapytań galerii
