CREATE DATABASE hsr_railway;

\c hsr_railway;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    rubles INTEGER DEFAULT 1000,
    bonus_points INTEGER DEFAULT 0
);

CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    name TEXT,
    rarity TEXT CHECK (rarity IN ('common', 'epic', 'legendary')),
    type TEXT CHECK (type IN ('event', 'standard', 'none'))
);

CREATE TABLE user_characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    character_id INTEGER REFERENCES characters(id),
    constellation INTEGER DEFAULT 1
);

CREATE TABLE pull_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    character_id INTEGER REFERENCES characters(id),
    pull_number INTEGER,
    pulled_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO characters (name, rarity, type) VALUES
('🚆 Казахстан', 'legendary', 'event'),
('🚆 Китай', 'legendary', 'event'),
('🚂 Москва', 'legendary', 'standard'),
('🚂 Владивосток', 'legendary', 'standard'),
('🚂 Минск', 'legendary', 'standard'),
('🚂 Санкт-Петербург', 'legendary', 'standard'),
('⭐ Самара', 'epic', 'none'),
('⭐ Ростов', 'epic', 'none'),
('⭐ Астрахань', 'epic', 'none'),
('⭐ Казань', 'epic', 'none'),
('📍 Воронеж', 'common', 'none'),
('📍 Рязань', 'common', 'none'),
('📍 Курск', 'common', 'none'),
('📍 Волгоград', 'common', 'none'),
('📍 Саратов', 'common', 'none');

select * from users 
select * from characters
select * from user_characters
select * from pull_history

update users set rubles = 100000 where username = 'ы'

delete from pull_history where character_id = "айди персонажа"
delete from user_characters where character_id = "айди персонажа"
delete from characters where id = "айди персонажа"



-- Добавляем каскадное удаление для связанных таблиц
ALTER TABLE public.user_characters 
    DROP CONSTRAINT IF EXISTS user_characters_character_id_fkey,
    ADD CONSTRAINT user_characters_character_id_fkey 
    FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;

ALTER TABLE public.pull_history 
    DROP CONSTRAINT IF EXISTS pull_history_character_id_fkey,
    ADD CONSTRAINT pull_history_character_id_fkey 
    FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;

-- Проверяем
SELECT 
    tc.table_name, 
    tc.constraint_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'characters';




	-- Добавляем колонку description если её нет
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Добавляем каскадное удаление для связанных таблиц
ALTER TABLE public.user_characters 
    DROP CONSTRAINT IF EXISTS user_characters_character_id_fkey,
    ADD CONSTRAINT user_characters_character_id_fkey 
    FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;

ALTER TABLE public.pull_history 
    DROP CONSTRAINT IF EXISTS pull_history_character_id_fkey,
    ADD CONSTRAINT pull_history_character_id_fkey 
    FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;

SELECT id, name, LEFT(image_url, 100) FROM public.characters WHERE image_url != '';


-- Подключаемся к нужной БД
\c hsr_railway;

-- Очищаем таблицу (на всякий случай)
TRUNCATE TABLE public.characters RESTART IDENTITY CASCADE;

-- Вставляем персонажей
INSERT INTO public.characters (name, rarity, type, description, image_url) VALUES
('Казахстан', 'legendary', 'event', 'Живописный маршрут через бескрайние степи Казахстана.', ''),
('Китай', 'legendary', 'event', 'Скоростной экспресс через великую стену и шумные мегаполисы.', ''),
('Москва', 'legendary', 'standard', 'Главный железнодорожный узел России.', ''),
('Владивосток', 'legendary', 'standard', 'Конечная точка Транссиба.', ''),
('Минск', 'legendary', 'standard', 'Европейский маршрут через уютные города Беларуси.', ''),
('Санкт-Петербург', 'legendary', 'standard', 'Северная столица.', ''),
('Самара', 'epic', 'none', 'Космический маршрут.', ''),
('Ростов', 'epic', 'none', 'Южный экспресс с казачьим колоритом.', ''),
('Астрахань', 'epic', 'none', 'Волжский маршрут к Каспийскому морю.', ''),
('Казань', 'epic', 'none', 'Смешение культур.', ''),
('Воронеж', 'common', 'none', 'Центральный чернозёмный маршрут.', ''),
('Рязань', 'common', 'none', 'Грибной экспресс.', ''),
('Курск', 'common', 'none', 'Маршрут через соловьиные края.', ''),
('Волгоград', 'common', 'none', 'Патриотический маршрут на Волге.', ''),
('Саратов', 'common', 'none', 'Поволжский путь.', '');

-- Проверяем
SELECT id, name, rarity FROM public.characters;