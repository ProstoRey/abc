const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'hsr_railway',
    password: 'Matvey', // ЗАМЕНИТЕ НА ВАШ ПАРОЛЬ!
    port: 5432,
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(session({ secret: 'hsr_secret', resave: false, saveUninitialized: true }));
app.use(express.static('public'));

// ИНИЦИАЛИЗАЦИЯ БД
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                rubles INTEGER DEFAULT 1000,
                bonus_points INTEGER DEFAULT 0
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.characters (
                id SERIAL PRIMARY KEY,
                name TEXT,
                rarity TEXT,
                type TEXT,
                description TEXT DEFAULT '',
                image_url TEXT DEFAULT ''
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.user_characters (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES public.users(id),
                character_id INTEGER REFERENCES public.characters(id),
                constellation INTEGER DEFAULT 1
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.pull_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES public.users(id),
                character_id INTEGER REFERENCES public.characters(id),
                pull_number INTEGER,
                pulled_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        await pool.query(`ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT ''`);
        await pool.query(`ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`);
        
        const check = await pool.query('SELECT COUNT(*) FROM public.characters');
        if (parseInt(check.rows[0].count) === 0) {
            await pool.query(`
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
                ('Саратов', 'common', 'none', 'Поволжский путь.', '')
            `);
            console.log('✅ Персонажи добавлены');
        }
        
        console.log('✅ База данных готова');
    } catch (err) {
        console.error('❌ Ошибка БД:', err.message);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('🔧 ПРОВЕРЬТЕ:');
        console.error('   1. Запущен ли PostgreSQL?');
        console.error('   2. Правильный ли пароль в server.js?');
        console.error('   3. Существует ли база hsr_railway?');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        process.exit(1);
    }
}

// API РЕГИСТРАЦИЯ
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        await pool.query('INSERT INTO public.users (username, password) VALUES ($1, $2)', [username, password]);
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: 'Логин занят' });
    }
});

// API ЛОГИН
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await pool.query('SELECT * FROM public.users WHERE username=$1 AND password=$2', [username, password]);
    if (user.rows.length) {
        req.session.userId = user.rows[0].id;
        res.json({ success: true, user: user.rows[0] });
    } else {
        res.json({ success: false });
    }
});

// API ПОЛУЧИТЬ ПОЛЬЗОВАТЕЛЯ
app.get('/api/user', async (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    const user = await pool.query('SELECT id, username, rubles, bonus_points FROM public.users WHERE id=$1', [req.session.userId]);
    res.json({ success: true, user: user.rows[0] });
});

// API ДОБАВЛЕНИЕ ДЕНЕГ (КЛИКЕР)
app.post('/api/add-money', async (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    const { amount } = req.body;
    const user = await pool.query('SELECT rubles FROM public.users WHERE id=$1', [req.session.userId]);
    const newRubles = user.rows[0].rubles + amount;
    await pool.query('UPDATE public.users SET rubles=$1 WHERE id=$2', [newRubles, req.session.userId]);
    res.json({ success: true, newRubles });
});

// API КРУТКА
app.post('/api/pull', async (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    const userId = req.session.userId;
    
    const user = await pool.query('SELECT rubles, bonus_points FROM public.users WHERE id=$1', [userId]);
    if (user.rows[0].rubles < 100) {
        return res.json({ success: false, error: 'Не хватает рублей (нужно 100)' });
    }
    
    let rubles = user.rows[0].rubles - 100;
    
    const pullCount = await pool.query('SELECT COUNT(*) FROM public.pull_history WHERE user_id=$1', [userId]);
    const pullNumber = parseInt(pullCount.rows[0].count) + 1;
    
    let rarity = 'common';
    if (pullNumber % 10 === 0) rarity = 'legendary';
    else if (pullNumber % 3 === 0) rarity = 'epic';
    else {
        const r = Math.random();
        if (r < 0.06) rarity = 'legendary';
        else if (r < 0.3) rarity = 'epic';
    }
    
    const chars = await pool.query('SELECT * FROM public.characters WHERE rarity=$1', [rarity]);
    if (chars.rows.length === 0) {
        return res.json({ success: false, error: 'Нет персонажей' });
    }
    const character = chars.rows[Math.floor(Math.random() * chars.rows.length)];
    
    const existing = await pool.query('SELECT * FROM public.user_characters WHERE user_id=$1 AND character_id=$2', [userId, character.id]);
    let newConst = 1;
    if (existing.rows.length) {
        newConst = existing.rows[0].constellation + 1;
        if (newConst > 8) newConst = 8;
        await pool.query('UPDATE public.user_characters SET constellation=$1 WHERE id=$2', [newConst, existing.rows[0].id]);
    } else {
        await pool.query('INSERT INTO public.user_characters (user_id, character_id, constellation) VALUES ($1,$2,1)', [userId, character.id]);
    }
    
    let newBonus = user.rows[0].bonus_points + 10;
    if (newConst >= 8) {
        rubles += 100;
        newBonus += 20;
    }
    
    await pool.query('UPDATE public.users SET rubles=$1, bonus_points=$2 WHERE id=$3', [rubles, newBonus, userId]);
    await pool.query('INSERT INTO public.pull_history (user_id, character_id, pull_number) VALUES ($1,$2,$3)', [userId, character.id, pullNumber]);
    
    res.json({ success: true, character, constellation: newConst, rubles, bonusPoints: newBonus });
});

// API ПОКУПКА ЗА БОНУСЫ
app.post('/api/buy', async (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    const { type, characterId } = req.body;
    const user = await pool.query('SELECT bonus_points, rubles FROM public.users WHERE id=$1', [req.session.userId]);
    let points = user.rows[0].bonus_points;
    
    if (type === 'pull' && points >= 50) {
        points -= 50;
        await pool.query('UPDATE public.users SET rubles=rubles+100, bonus_points=$1 WHERE id=$2', [points, req.session.userId]);
        const upd = await pool.query('SELECT rubles, bonus_points FROM public.users WHERE id=$1', [req.session.userId]);
        res.json({ success: true, rubles: upd.rows[0].rubles, bonusPoints: upd.rows[0].bonus_points });
    } else if (type === 'character' && characterId && points >= 200) {
        points -= 200;
        const existing = await pool.query('SELECT * FROM public.user_characters WHERE user_id=$1 AND character_id=$2', [req.session.userId, characterId]);
        if (!existing.rows.length) {
            await pool.query('INSERT INTO public.user_characters (user_id, character_id, constellation) VALUES ($1,$2,1)', [req.session.userId, characterId]);
        }
        await pool.query('UPDATE public.users SET bonus_points=$1 WHERE id=$2', [points, req.session.userId]);
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// API МОИ ПЕРСОНАЖИ
app.get('/api/my-characters', async (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    const chars = await pool.query(`