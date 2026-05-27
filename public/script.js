let currentUser = null;
let isPulling = false;
let currentMode = 'shopping';
let clickCount = 0;

const api = async (url, options = {}) => {
    const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
};

function showAuthError(msg) {
    const err = document.getElementById('authError');
    err.textContent = msg;
    err.classList.add('show');
    setTimeout(() => err.classList.remove('show'), 3000);
}

// Переключение табов авторизации
document.getElementById('showLoginBtn')?.addEventListener('click', () => {
    document.getElementById('showLoginBtn').classList.add('active');
    document.getElementById('showRegisterBtn').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
});
document.getElementById('showRegisterBtn')?.addEventListener('click', () => {
    document.getElementById('showRegisterBtn').classList.add('active');
    document.getElementById('showLoginBtn').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
});

// Регистрация
document.getElementById('regSubmitBtn')?.addEventListener('click', async () => {
    const username = document.getElementById('regUser').value.trim();
    const password = document.getElementById('regPass').value.trim();
    if (!username || !password) return showAuthError('Заполните поля');
    const data = await api('/api/register', { method: 'POST', body: JSON.stringify({ username, password }) });
    if (data.success) {
        showAuthError('✅ Регистрация успешна! Теперь войдите.');
        document.getElementById('showLoginBtn').click();
        document.getElementById('loginUser').value = username;
    } else showAuthError(data.error || 'Ошибка');
});

// Вход
document.getElementById('loginSubmitBtn')?.addEventListener('click', async () => {
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value.trim();
    if (!username || !password) return showAuthError('Заполните поля');
    const data = await api('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    if (data.success) {
        currentUser = data.user;
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        updateUI();
        loadAllData();
    } else showAuthError('Неверный логин или пароль');
});

// Выход
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    currentUser = null;
    document.getElementById('authOverlay').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
});

function updateUI() {
    if (currentUser) {
        document.getElementById('usernameDisplay').innerHTML = `👤 ${currentUser.username}`;
        document.getElementById('rublesDisplay').innerText = currentUser.rubles;
        document.getElementById('bonusDisplay').innerText = currentUser.bonus_points;
    }
}

async function loadUserData() {
    const res = await api('/api/user');
    if (res.success) currentUser = res.user;
    updateUI();
}

async function loadAllData() {
    await loadUserData();
    await loadMyCharacters();
    await loadArchive();
    await loadHistory();
    await loadShopRoutes();
    if (document.getElementById('adminCharList')) loadAdminChars();
    
    renderBannerChars();
    renderShop();
}

// Получение картинки (единая функция для всех картинок)
function getCharacterImage(char) {
    if (char.image_url && char.image_url !== '' && char.image_url !== null) {
        return char.image_url;
    }
    
    const images = {
        'Казахстан': '/images/kazakhstan.png',
        'Китай': '/images/china.png',
        'Москва': '/images/moscow.png',
        'Владивосток': '/images/vladivostok.png',
        'Минск': '/images/minsk.png',
        'Санкт-Петербург': '/images/spb.png',
        'Самара': '/images/samara.png',
        'Ростов': '/images/rostov.png',
        'Астрахань': '/images/astrakhan.png',
        'Казань': '/images/kazan.png',
        'Воронеж': '/images/voronezh.png',
        'Рязань': '/images/ryazan.png',
        'Курск': '/images/kursk.png',
        'Волгоград': '/images/volgograd.png',
        'Саратов': '/images/saratov.png'
    };
    
    if (images[char.name]) {
        return images[char.name];
    }
    
    const colors = {
        'legendary': 'f5b042',
        'epic': 'a855f7',
        'common': '3b82f6'
    };
    const color = colors[char.rarity] || '6b7280';
    const text = char.name ? char.name.substring(0, 2) : '??';
    return `https://placehold.co/200x200/${color}/1a1a2e?text=${encodeURIComponent(text)}&font=montserrat`;
}

// Мои персонажи
async function loadMyCharacters() {
    const res = await api('/api/my-characters');
    const container = document.getElementById('myCharacters');
    if (res.success && container) {
        if (!res.characters.length) {
            container.innerHTML = '<div>У вас пока нет маршрутов. Совершите крутку!</div>';
        } else {
            container.innerHTML = res.characters.map(c => `
                <div class="char-card">
                    <img src="${getCharacterImage(c)}" class="char-avatar" onerror="this.src='https://placehold.co/200x200/334155/f5b042?text=🚆'">
                    <div class="char-name">${c.name}</div>
                    <div class="char-rarity">${c.rarity === 'legendary' ? '🌟 Легендарный' : c.rarity === 'epic' ? '⭐ Эпический' : '📍 Редкий'}</div>
                    <div class="const-progress">Посадочных мест: ${c.constellation}/8</div>
                    ${c.constellation >= 8 ? '<div class="badge">✨ Бизнес класс</div>' : ''}
                </div>
            `).join('');
        }
    }
}

// Архив
async function loadArchive() {
    const res = await api('/api/archive');
    const container = document.getElementById('archiveList');
    if (res.success && container) {
        if (!res.characters.length) {
            container.innerHTML = '<div>🎉 У вас есть все маршруты!</div>';
        } else {
            container.innerHTML = res.characters.slice(0, 8).map(c => `
                <div class="char-card archive-card">
                    <img src="${getCharacterImage(c)}" class="char-avatar" onerror="this.src='https://placehold.co/200x200/334155/f5b042?text=❓'">
                    <div class="char-name">${c.name}</div>
                    <div class="char-rarity">${c.rarity === 'legendary' ? '🌟' : c.rarity === 'epic' ? '⭐' : '📍'} ${c.rarity}</div>
                    <button class="shop-btn" onclick="buyCharacter(${c.id})" style="margin-top: 8px;">Купить за 200 бонусов</button>
                </div>
            `).join('');
        }
    }
}

// История
async function loadHistory() {
    const res = await api('/api/history');
    const container = document.getElementById('historyList');
    if (res.success && container) {
        if (!res.history.length) {
            container.innerHTML = '<div class="history-item">История круток пуста</div>';
        } else {
            container.innerHTML = res.history.map(h => `
                <div class="history-item">🎫 Крутка #${h.pull_number} — ${h.name} — ${new Date(h.pulled_at).toLocaleString()}</div>
            `).join('');
        }
    }
}

window.buyCharacter = async (id) => {
    const res = await api('/api/buy', { method: 'POST', body: JSON.stringify({ type: 'character', characterId: id }) });
    if (res.success) { alert('✅ Куплено!'); loadAllData(); }
    else alert('❌ Не хватает 200 Доп баллов');
};

// Прямая покупка маршрута
window.buyRouteDirect = async (characterId, characterName, price) => {
    if (!currentUser) {
        alert('Сначала войдите в систему');
        return;
    }
    
    if (currentUser.rubles < price) {
        alert(`❌ Не хватает рублей! Нужно ${price} руб. Пополните баланс через кликер (+)`);
        return;
    }
    
    const res = await api('/api/buy', { method: 'POST', body: JSON.stringify({ type: 'character', characterId: characterId }) });
    if (res.success) {
        alert(`✅ Маршрут "${characterName}" куплен за ${price} рублей!`);
        await loadAllData();
    } else {
        alert('❌ Ошибка при покупке');
    }
};

// Загрузка магазина для прямой покупки
async function loadShopRoutes() {
    const res = await api('/api/admin/characters');
    const characters = res;
    const container = document.getElementById('shopRoutesGrid');
    
    if (container) {
        const prices = {
            'common': 250,
            'epic': 500,
            'legendary': 1000
        };
        
        container.innerHTML = characters.map(char => `
            <div class="shop-route-card">
                <img src="${getCharacterImage(char)}" onerror="this.src='https://placehold.co/200x200/334155/f5b042?text=🚆'">
                <div class="char-name">${char.name}</div>
                <div class="char-rarity">${char.rarity === 'legendary' ? '🌟' : char.rarity === 'epic' ? '⭐' : '📍'} ${char.rarity}</div>
                <div class="shop-route-price">${prices[char.rarity]} <span>руб</span></div>
                <button class="buy-route-btn" onclick="buyRouteDirect(${char.id}, '${char.name}', ${prices[char.rarity]})">💰 Купить билет</button>
            </div>
        `).join('');
    }
}

// Переключение режимов Shopping/Gambling
document.getElementById('shoppingModeBtn')?.addEventListener('click', () => {
    currentMode = 'shopping';
    document.getElementById('shoppingModeBtn').classList.add('active');
    document.getElementById('gamblingModeBtn').classList.remove('active');
    document.getElementById('shoppingMode').classList.add('active');
    document.getElementById('gamblingMode').classList.remove('active');
});

document.getElementById('gamblingModeBtn')?.addEventListener('click', () => {
    currentMode = 'gambling';
    document.getElementById('gamblingModeBtn').classList.add('active');
    document.getElementById('shoppingModeBtn').classList.remove('active');
    document.getElementById('gamblingMode').classList.add('active');
    document.getElementById('shoppingMode').classList.remove('active');
    
    renderBannerChars();
    renderShop();
});

// Рендер баннера
function renderBannerChars() {
    const container = document.getElementById('bannerChars');
    if (container) {
        const chinaChar = { name: 'Китай', rarity: 'legendary', image_url: null };
        const kazakhChar = { name: 'Казахстан', rarity: 'legendary', image_url: null };
        
        container.innerHTML = `
            <div class="char-card">
                <img src="${getCharacterImage(chinaChar)}" class="char-avatar" onerror="this.src='https://placehold.co/200x200/f5b042/1a1a2e?text=🇨🇳'">
                <div class="char-name">Китай</div>
                <div class="char-rarity">🌟 Ивент</div>
            </div>
            <div class="char-card">
                <img src="${getCharacterImage(kazakhChar)}" class="char-avatar" onerror="this.src='https://placehold.co/200x200/f5b042/1a1a2e?text=🇰🇿'">
                <div class="char-name">Казахстан</div>
                <div class="char-rarity">🌟 Ивент</div>
            </div>
        `;
    }
}

function renderShop() {
    const container = document.getElementById('shopCharacters');
    if (container) {
        container.innerHTML = `
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                <button class="shop-btn" onclick="buyCharacter(1)">🇰🇿 Казахстан (200 бонусов)</button>
                <button class="shop-btn" onclick="buyCharacter(2)">🇨🇳 Китай (200 бонусов)</button>
            </div>
        `;
    }
}

// Крутка с быстрым стартом и плавным замедлением
document.getElementById('pullBtn')?.addEventListener('click', async () => {
    if (!currentUser) return;
    if (isPulling) {
        alert('⏳ Подождите, крутка уже выполняется!');
        return;
    }
    
    isPulling = true;
    const pullBtn = document.getElementById('pullBtn');
    const originalBtnText = pullBtn.textContent;
    pullBtn.textContent = '⏳ КРУТИМ...';
    pullBtn.disabled = true;
    pullBtn.style.opacity = '0.6';
    pullBtn.style.cursor = 'not-allowed';
    
    // Очищаем предыдущий результат
    document.getElementById('pullResult').innerHTML = '';
    
    // Получаем всех персонажей
    const allCharsRes = await api('/api/admin/characters');
    const allCharacters = allCharsRes;
    
    if (!allCharacters.length) {
        alert('Нет доступных маршрутов');
        isPulling = false;
        pullBtn.textContent = originalBtnText;
        pullBtn.disabled = false;
        pullBtn.style.opacity = '1';
        pullBtn.style.cursor = 'pointer';
        return;
    }
    
    // Делаем запрос на крутку
    const pullResult = await api('/api/pull', { method: 'POST', body: JSON.stringify({}) });
    
    if (!pullResult.success) {
        alert(pullResult.error || 'Ошибка при крутке');
        isPulling = false;
        pullBtn.textContent = originalBtnText;
        pullBtn.disabled = false;
        pullBtn.style.opacity = '1';
        pullBtn.style.cursor = 'pointer';
        return;
    }
    
    // Показываем контейнер рулетки
    const rouletteContainer = document.getElementById('rouletteContainer');
    const rouletteItemsDiv = document.getElementById('rouletteItems');
    rouletteContainer.style.display = 'block';
    
    // Создаём массив для анимации (дублируем много раз)
    let rouletteItemsArray = [];
    for (let i = 0; i < 25; i++) {
        rouletteItemsArray.push(...allCharacters);
    }
    
    // Перемешиваем
    for (let i = rouletteItemsArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rouletteItemsArray[i], rouletteItemsArray[j]] = [rouletteItemsArray[j], rouletteItemsArray[i]];
    }
    
    // Заполняем контейнер
    rouletteItemsDiv.innerHTML = '';
    rouletteItemsArray.forEach(char => {
        const item = document.createElement('div');
        item.className = 'roulette-item-inline';
        item.innerHTML = `
            <img src="${getCharacterImage(char)}" onerror="this.src='https://placehold.co/150x100/334155/f5b042?text=🚆'">
            <div class="roulette-item-name-inline">${char.name}</div>
            <div class="roulette-item-rarity-inline">${char.rarity === 'legendary' ? '🌟' : char.rarity === 'epic' ? '⭐' : '📍'}</div>
        `;
        rouletteItemsDiv.appendChild(item);
    });
    
    // Находим индекс выпавшего персонажа
    let targetIndex = -1;
    for (let i = 0; i < rouletteItemsArray.length; i++) {
        if (rouletteItemsArray[i].name === pullResult.character.name) {
            targetIndex = i;
            break;
        }
    }
    
    // Принудительно пересчитываем layout
    rouletteItemsDiv.offsetHeight;
    
    const scrollContainer = rouletteItemsDiv;
    const itemWidth = 162;
    const containerWidth = scrollContainer.clientWidth;
    const centerOffset = (containerWidth / 2) - (itemWidth / 2);
    
    // Начинаем с позиции 0
    scrollContainer.scrollLeft = 0;
    
    // Целевая позиция
    let targetPosition = targetIndex * itemWidth - centerOffset;
    if (targetPosition < 0) targetPosition = 0;
    
    // Параметры анимации
    const startPosition = 0;
    const distance = targetPosition - startPosition;
    const duration = 2200; // 2.2 секунды
    const startTime = performance.now();
    
    // Функция замедления: быстрый старт, плавная остановка
    function easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }
    
    function animateScroll(now) {
        const elapsed = now - startTime;
        let progress = Math.min(1, elapsed / duration);
        
        // Применяем замедление
        const easedProgress = easeOutCubic(progress);
        const currentPosition = startPosition + distance * easedProgress;
        scrollContainer.scrollLeft = currentPosition;
        
        if (progress < 1) {
            requestAnimationFrame(animateScroll);
        } else {
            // Финальная доводка для точности
            scrollContainer.scrollLeft = targetPosition;
            
            setTimeout(() => {
                rouletteContainer.style.display = 'none';
                document.getElementById('pullResult').innerHTML = `
                    🎉 <strong>Вам выпал маршрут!</strong><br>
                    <img src="${getCharacterImage(pullResult.character)}" style="width: 100px; border-radius: 20px; margin: 15px 0; border: 2px solid #f5b042;"><br>
                    <strong style="font-size: 1.5rem;">${pullResult.character.name}</strong><br>
                    💺 Посадочных мест: ${pullResult.constellation}/8<br>
                    ⭐ +10 Доп баллов
                `;
                loadAllData();
                
                isPulling = false;
                pullBtn.textContent = originalBtnText;
                pullBtn.disabled = false;
                pullBtn.style.opacity = '1';
                pullBtn.style.cursor = 'pointer';
            }, 100);
        }
    }
    
    // Запускаем анимацию
    requestAnimationFrame(animateScroll);
});

// Покупка крутки за бонусы
document.getElementById('buyPullBtn')?.addEventListener('click', async () => {
    const res = await api('/api/buy', { method: 'POST', body: JSON.stringify({ type: 'pull' }) });
    if (res.success) { 
        alert('✅ Куплена крутка за 50 баллов! +100 рублей');
        loadAllData();
    } else {
        alert('❌ Не хватает 50 Доп баллов');
    }
});

// Переход на крутки с главной
document.getElementById('gotoPullBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.nav-btn[data-tab="banner"]').classList.add('active');
    document.getElementById('banner').classList.add('active');
});

// === КЛИКЕР ===
document.getElementById('moneyPlusBtn')?.addEventListener('click', () => {
    clickCount = 0;
    document.getElementById('clickCount').textContent = '0';
    document.getElementById('clickerModal').style.display = 'flex';
});

document.getElementById('clickerCloseBtn')?.addEventListener('click', () => {
    document.getElementById('clickerModal').style.display = 'none';
});

document.getElementById('clickerModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('clickerModal')) {
        document.getElementById('clickerModal').style.display = 'none';
    }
});

document.getElementById('moneyImage')?.addEventListener('click', async () => {
    if (!currentUser) {
        alert('Сначала войдите в систему');
        return;
    }
    
    clickCount++;
    document.getElementById('clickCount').textContent = clickCount;
    
    const res = await api('/api/add-money', { method: 'POST', body: JSON.stringify({ amount: 50 }) });
    if (res.success) {
        currentUser.rubles = res.newRubles;
        updateUI();
        const img = document.getElementById('moneyImage');
        img.style.transform = 'scale(0.9)';
        setTimeout(() => { img.style.transform = 'scale(1)'; }, 100);
    }
});

// === РЕДАКТОР ===
let currentImagePreview = null;

document.getElementById('charImage')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
        alert('Файл слишком большой! Максимум 2 МБ');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        currentImagePreview = event.target.result;
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = `<img src="${currentImagePreview}" alt="Превью">`;
        }
    };
    reader.readAsDataURL(file);
});

document.getElementById('addCharBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('charName').value.trim();
    const rarity = document.getElementById('charRarity').value;
    const type = document.getElementById('charType').value;
    
    if (!name) {
        alert('Введите название маршрута');
        return;
    }
    
    const addBtn = document.getElementById('addCharBtn');
    const originalText = addBtn.textContent;
    addBtn.textContent = '⏳ Сохранение...';
    addBtn.disabled = true;
    
    try {
        const response = await fetch('/api/admin/characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name, 
                rarity, 
                type, 
                image_url: currentImagePreview || '' 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ Маршрут "${name}" добавлен!`);
            document.getElementById('charName').value = '';
            document.getElementById('charRarity').value = 'common';
            document.getElementById('charType').value = 'none';
            document.getElementById('charImage').value = '';
            document.getElementById('imagePreview').innerHTML = '';
            currentImagePreview = null;
            await loadAdminChars();
            await loadAllData();
        } else {
            alert('❌ Ошибка при добавлении');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Ошибка сервера');
    } finally {
        addBtn.textContent = originalText;
        addBtn.disabled = false;
    }
});

async function loadAdminChars() {
    const response = await fetch('/api/admin/characters');
    const chars = await response.json();
    const container = document.getElementById('adminCharList');
    
    if (container) {
        if (chars.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px;">Нет маршрутов</div>';
        } else {
            container.innerHTML = chars.map(c => `
                <div class="char-item">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${c.image_url || getCharacterImage(c)}" 
                             onerror="this.src='https://placehold.co/50x50/334155/f5b042?text=🚆'">
                        <div>
                            <strong>${c.name}</strong><br>
                            <span style="font-size: 0.8rem; color: #f5b042;">
                                ${c.rarity === 'legendary' ? '🌟' : c.rarity === 'epic' ? '⭐' : '📍'} ${c.rarity}
                                ${c.type === 'event' ? ' | Ивент' : c.type === 'standard' ? ' | Стандарт' : ''}
                            </span>
                        </div>
                    </div>
                    <button class="delete-char-btn" onclick="deleteChar(${c.id})">🗑️ Удалить</button>
                </div>
            `).join('');
        }
    }
}

window.deleteChar = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот маршрут? Это удалит его у всех игроков!')) return;
    
    try {
        const response = await fetch(`/api/admin/characters/${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Маршрут и все связанные данные удалены');
            await loadAdminChars();
            await loadAllData();
        } else {
            alert('❌ Ошибка удаления: ' + (result.error || 'неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Ошибка сервера при удалении');
    }
};

// Переключение вкладок
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'editor' && currentUser) loadAdminChars();
    });
});

// Проверка сессии
window.onload = async () => {
    const res = await api('/api/user');
    if (res.success && res.user) {
        currentUser = res.user;
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        updateUI();
        loadAllData();
    }
};