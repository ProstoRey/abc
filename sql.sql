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

update users set rubles = 100000 where username = 'ыыы'

delete from characters where id = 21
delete from user_characters where character_id = 21
delete from pull_history where character_id = 21
