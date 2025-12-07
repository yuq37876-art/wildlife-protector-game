// --- 1. 遊戲核心數據與懲罰係數 ---
const SCORE_BONUS_ON_QUIZ_CORRECT = 5; // 答對分數獎勵
const PUNISHMENT_HEALTH_LOSS = 15;
const PUNISHMENT_SUPPLY_INCREASE = 20; // 答錯增加供給量
const HUNTER_SUPPLY_INCREASE = 10; // 放跑盜獵者增加供給量
const MAX_GAME_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 天時長上限 (毫秒)

// 定義稀有度標籤
const RARITY_LEVELS = {
    5: '常見 (Common)',
    4: '不常見 (Uncommon)',
    3: '稀有 (Rare)',
    2: '極稀有 (Epic)',
    1: '傳說 (Legendary)'
};


const ANIMAL_DATA = [
    // 稀有度：Common (weight: 5)
    { id: 'macaca', name_zh: "食蟹獼猴", is_illegal: true, reason: "實驗動物需求高 (出現次數: 49)", weight: 5, image: 'assets/macaque.png', prompt: "海關截獲一批標註「觀賞用」的活體猴子。它們的數量極多，且運送環境惡劣，疑似是高頻率走私的物種。", correct_info: "正確！食蟹獼猴常因『實驗動物需求』而遭非法捕捉和運送，是高風險物種。", incorrect_info: "錯誤！食蟹獼猴在全球實驗動物黑市中需求極高，常被假冒名義走私。請勿購買！" },
    { id: 'eureel', name_zh: "歐洲鰻", is_illegal: true, reason: "極高風險的玻璃鰻走私 (CITES附錄II)", weight: 5, image: 'assets/eel.png', prompt: "碼頭查獲大量用塑膠袋裝著的透明魚苗。這些魚苗被稱為「玻璃鰻」，在東亞市場有極高價值。", correct_info: "正確！歐洲鰻幼體玻璃鰻走私利潤巨大。", incorrect_info: "錯誤！歐洲鰻是非法貿易機率『極高』的物種！請務必攔截！" },
    { id: 'rhesusmacaque', name_zh: "恆河猴", is_illegal: true, reason: "實驗動物需求高", weight: 5, image: 'assets/rhesus_macaque.png', prompt: "海關查獲一批從南亞地區運來的猴子，數量龐大且文件顯示它們將被用於『醫學研究』。由於需求量極大，其捕捉來源極為可疑。", correct_info: "正確！ 恆河猴在全球實驗動物市場需求極大，是高頻率非法走私物種。", incorrect_info: "錯誤！ 恆河猴是實驗動物黑市的常客，非法捕捉和走私極為頻繁，必須攔截。" },
    { id: 'beluga', name_zh: "歐洲白鱘 (Beluga)", is_illegal: true, reason: "Beluga 魚子醬 (CITES 嚴格管制)", weight: 5, image: 'assets/beluga_sturgeon.png', prompt: "查獲一小批標註為『頂級 Beluga 魚子醬』的貨物，但包裝無 CITES 標籤。這是全球最昂貴的魚子醬，高利潤導致盜捕嚴重。", correct_info: "正確！歐洲白鱘（Beluga）受到 CITES 嚴格管制，無標籤的 Beluga 幾乎可以斷定為非法走私。", incorrect_info: "錯誤！頂級 Beluga 魚子醬是黑市重點。必須確認 CITES 標籤，否則應視為非法。" },
    // 稀有度：Uncommon (weight: 4)
    { id: 'siberiansturgeon', name_zh: "西伯利亞鱘", is_illegal: true, reason: "魚子醬加工鏈存在大規模黑市", weight: 4, image: 'assets/siberian_sturgeon.png', prompt: "發現一批標籤為『合法養殖西伯利亞鱘魚子醬』的貨物。雖然有文件，但魚子醬加工鏈存在大規模黑市偽標的風險。", correct_info: "正確！儘管有文件，但西伯利亞鱘常被偽造標示或混種，是黑市『洗白』貨物的常見方式。應攔截深入調查。", incorrect_info: "錯誤！鱘魚家族是走私高風險物種，黑市常利用偽造標籤，不應輕易放行。" },
    { id: 'russiansturgeon', name_zh: "俄羅斯鱘", is_illegal: true, reason: "高價魚子醬走私 (出現次數: 34)", weight: 4, image: 'assets/sturgeon.png', prompt: "機場貨運站發現未經檢疫的大量魚卵，標籤模糊不清。這種魚卵是國際上最昂貴的食材之一。", correct_info: "正確！鱘魚家族因魚子醬高價是走私重點。", incorrect_info: "錯誤！鱘魚是黑市一大宗，該物種高度瀕危，誤判扣分！" },
    // 稀有度：Rare (weight: 3)
    { id: 'vicuna', name_zh: "小羊駝 (毛料)", is_illegal: true, reason: "極高價值的Vicuna Wool", weight: 3, image: 'assets/vicuna.png', prompt: "查獲一批極其柔軟、昂貴的毛料。業者聲稱是合法採集，但其價值高到令人懷疑來源。", correct_info: "正確！小羊駝毛料雖有合法養殖，但常有非法狩獵的毛料流入黑市。", incorrect_info: "錯誤！小羊駝因其毛料稀有，任何可疑毛料都應檢查！" },
    { id: 'greenmonkey', name_zh: "非洲綠猴", is_illegal: true, reason: "非法實驗/寵物市場", weight: 3, image: 'assets/greenmonkey.png', prompt: "寵物貿易商聲稱他們進口的一批『異國寵物』非洲綠猴擁有合法文件。但其運送環境擁擠，且該品種近年來常被用於非法實驗。", correct_info: "正確！ 非洲綠猴常在非法寵物或實驗動物市場流通，需嚴查。", incorrect_info: "錯誤！ 這些猴子雖可能用於合法實驗，但因非法寵物市場猖獗，任何可疑運輸都應被截獲。" },
    // 稀有度：Epic (weight: 2)
    { id: 'croc', name_zh: "咸水鱷", is_illegal: false, reason: "皮革 (多為養殖)", weight: 2, image: 'assets/crocodile.png', prompt: "查獲一批聲稱來自合法養殖場的咸水鱷皮革。文件齊全，但品質極佳，懷疑可能混雜了部分野外非法獵捕的皮革。", correct_info: "正確！咸水鱷多數為養殖，文件齊全時屬於合法貿易。", incorrect_info: "錯誤！咸水鱷皮革是合法貿易的重要商品，如果文件齊全，誤判會影響經濟。" },
    { id: 'hybridsturgeon', name_zh: "混種鱘魚", is_illegal: false, reason: "魚子醬偽標走私 (低風險陷阱)", weight: 2, image: 'assets/hybrid_sturgeon.png', prompt: "查獲一批混種鱘魚（Huso × Acipenser）的魚子醬。混種主要用於養殖，但黑市中常利用此類魚子醬偽標走私。", correct_info: "正確！混種鱘魚通常為養殖，但若文件有瑕疵則應攔截，否則應放行。", incorrect_info: "錯誤！這是黑市偽裝的常見手法之一，通常是合法養殖，但若文件有瑕疵，則可能是非法交易。" },
    { id: 'whitesturgeon', name_zh: "白鱱", is_illegal: false, reason: "價格高但多為人工養殖", weight: 2, image: 'assets/whitesturgeon.png', prompt: "這是養殖場出售的鱱魚，用於合法魚子醬產業。業者有完整的養殖記錄。", correct_info: "正確！多數白鱱是人工養殖且有記錄，與走私魚子醬有區別。放行！", incorrect_info: "錯誤！並非所有鱱魚都非法。誤判會影響合法經濟！" },
    { id: 'peacock', name_zh: "孔雀", is_illegal: false, reason: "寵物鳥/羽毛交易 (低風險)", weight: 2, image: 'assets/peacock.png', prompt: "查獲一批進口『觀賞用』孔雀，附帶有販賣羽毛的許可證。雖然數量不多，但該地區過去曾出現偷獵羽毛的紀錄。", correct_info: "正確！ 孔雀通常屬於合法養殖觀賞鳥。非法交易主要集中在稀有羽毛或偷獵，這屬於低風險陷阱。", incorrect_info: "錯誤！ 這是孔雀，雖然有非法案例，但多數為合法養殖和交易。應放行。" },
    // 稀有度：Legendary (weight: 1)
    { id: 'weasel', name_zh: "黃鼬", is_illegal: false, reason: "區域性獵捕，非跨國黑市重點", weight: 1, image: 'assets/weasel.png', prompt: "這是國內常見的小型動物毛皮。經查核，捕獵區域性且有許可證。", correct_info: "正確！黃鼬主要為區域性獵捕，屬於低風險物種。放行！", incorrect_info: "錯誤！黃鼬多為區域性或合法養殖，與跨國非法犯罪不同。不應誤判。" },
];

const HABITAT_ITEMS = [
    { type: 'hunter', name: '盜獵者', score_penalty: 5, supply_increase: HUNTER_SUPPLY_INCREASE, image: 'assets/hunter.png' },
    { type: 'logger', name: '伐木工', score_penalty: 10, supply_increase: 0, image: 'assets/logger.png' },
    { type: 'animal', name: '黃鼬', score_penalty: 15, supply_increase: 0, image: 'assets/weasel_item.png' },
    { type: 'animal', name: '穿山甲', score_penalty: 15, supply_increase: 0, image: 'assets/pangolin.png' },
];


// --- 2. 遊戲狀態變量 ---
let healthScore = 100;
let demandValue = 0;
let supplyValue = 0;
let currentScore = 0;

let gameRunning = false;
let isPaused = false;
let spawnerInterval;
let timerInterval;
let gameStartTime;
let totalTimeElapsed = 0;
let currentQuizAnimal;
let unlockedPokedex = new Set(JSON.parse(localStorage.getItem('pokedex')) || []);
let gameHistory = JSON.parse(localStorage.getItem('gameHistory')) || [];


// --- 3. DOM 元素獲取 ---
const habitatGrid = document.getElementById('habitat-grid');
const healthScoreDisplay = document.getElementById('health-score');
const demandDisplay = document.getElementById('demand-value');
const supplyDisplay = document.getElementById('supply-value');
const gameTimerDisplay = document.getElementById('game-timer');

const quizPrompt = document.getElementById('quiz-prompt');
const choiceA = document.getElementById('choice-a');
const choiceB = document.getElementById('choice-b');
const resultMessageDisplay = document.getElementById('result-message');
const initialMessage = document.getElementById('initial-message');
const quizAnimalImage = document.getElementById('quiz-animal-image'); 

const currentScoreDisplay = document.getElementById('current-score');
const highScoreDisplay = document.getElementById('high-score');

const pokedexButton = document.getElementById('pokedex-button');
const pokedexModal = document.getElementById('pokedex-modal');
const closeButton = document.querySelector('.close-button');
const pokedexList = document.getElementById('pokedex-list');
const historyList = document.getElementById('history-list');

const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const tabPokedex = document.getElementById('tab-pokedex');
const tabHistory = document.getElementById('tab-history');
const tabContentPokedex = document.getElementById('tab-content-pokedex');
const tabContentHistory = document.getElementById('tab-content-history');


// --- 4. 遊戲初始化與控制 ---

function initializeGame() {
    if (gameRunning) return;

    // 重設狀態
    healthScore = 100;
    supplyValue = 0;
    currentScore = 0;
    demandValue = Math.floor(Math.random() * (100 - 50 + 1)) + 50; 
    gameStartTime = Date.now();
    totalTimeElapsed = 0;
    gameRunning = true;
    isPaused = false;
    
    // 更新介面
    healthScoreDisplay.textContent = healthScore;
    demandDisplay.textContent = demandValue;
    supplyDisplay.textContent = supplyValue;
    currentScoreDisplay.textContent = currentScore;
    gameTimerDisplay.textContent = formatTime(0);
    pauseButton.disabled = false;
    
    initialMessage.style.display = 'none';
    habitatGrid.innerHTML = ''; 
    
    // 啟動兩個區域
    startHabitatGame();
    loadNextQuiz();
    startTimer();

    startButton.textContent = '遊戲進行中...';
    startButton.disabled = true;
    
    resultMessageDisplay.className = 'feedback knowledge-point';
    resultMessageDisplay.textContent = '請仔細閱讀情境，選擇你的判斷。';
}

function endGame(win = false, reason = '未知原因') {
    if (!gameRunning) return;
    
    gameRunning = false;
    clearInterval(spawnerInterval);
    clearInterval(timerInterval);
    
    // 儲存本局遊戲紀錄
    saveGameRecord(currentScore, healthScore, demandValue, supplyValue, totalTimeElapsed, win, reason);
    
    habitatGrid.innerHTML = ''; 
    
    let finalMessage = `遊戲結束！得分: ${currentScore}，原因: ${reason}。`;
    resultMessageDisplay.className = win ? 'feedback knowledge-point result-win' : 'feedback knowledge-point result-lose';

    resultMessageDisplay.textContent = finalMessage;
    startButton.textContent = '重新開始';
    startButton.disabled = false;
    pauseButton.disabled = true;
    quizAnimalImage.src = '';
    
    updateScoreBoard();
}

function checkFailure() {
    if (!gameRunning) return true; 

    if (healthScore <= 0) {
        endGame(false, '棲地健康值歸零，棲地崩潰');
        return true;
    }
    if (supplyValue >= demandValue) {
        endGame(false, `盜獵供給量 (${supplyValue}) 已超過黑市需求量 (${demandValue})！`);
        return true;
    }
    if (totalTimeElapsed >= MAX_GAME_DURATION_MS) {
        endGame(true, '已達到 3 天時長上限，遊戲自動結算！');
        return true;
    }
    return false;
}

// --- 5. 遊戲計時器與暫停邏輯 ---

function startTimer() {
    let lastTime = Date.now();
    timerInterval = setInterval(() => {
        if (isPaused || !gameRunning) return;
        
        const now = Date.now();
        const delta = now - lastTime;
        totalTimeElapsed += delta;
        lastTime = now;
        
        gameTimerDisplay.textContent = formatTime(totalTimeElapsed);
        checkFailure();
    }, 1000);
}

function togglePause() {
    if (!gameRunning && !isPaused) return;

    isPaused = !isPaused;
    
    if (isPaused) {
        clearInterval(spawnerInterval);
        pauseButton.textContent = '▶️ 繼續遊戲';
        habitatGrid.innerHTML = '<div id="initial-message" style="display:block;">遊戲已暫停</div>';
        showModal(); 
    } else {
        startHabitatGame();
        pauseButton.textContent = '⏸️ 暫停遊戲';
        habitatGrid.innerHTML = '';
        initialMessage.style.display = 'none';
        setTimeout(loadNextQuiz, 500);
    }

    choiceA.disabled = isPaused;
    choiceB.disabled = isPaused;
    startButton.disabled = true;
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// --- 6. 上方區域：棲地守護 (點擊遊戲) 邏輯 ---

function startHabitatGame() {
    spawnerInterval = setInterval(spawnHabitatItem, 2500); 
}

// 顯示懸浮文字提示
function showFloatingText(text, x, y, className) {
    const floatText = document.createElement('div');
    floatText.textContent = text;
    floatText.className = `floating-text ${className}`;
    
    const gridRect = habitatGrid.getBoundingClientRect();
    floatText.style.left = `${x - gridRect.left}px`;
    floatText.style.top = `${y - gridRect.top}px`;
    
    habitatGrid.appendChild(floatText);
    setTimeout(() => { floatText.remove(); }, 1000);
}

// 生成棲地項目
function spawnHabitatItem() {
    if (!gameRunning || isPaused || checkFailure()) return;
    
    const randomItem = HABITAT_ITEMS[Math.floor(Math.random() * HABITAT_ITEMS.length)];
    const itemElement = document.createElement('img');
    itemElement.src = randomItem.image;
    itemElement.alt = randomItem.name;
    itemElement.className = 'habitat-item ' + randomItem.type;
    
    const left = Math.random() * 80 + 10;
    const top = Math.random() * 80 + 10;
    itemElement.style.left = `${left}%`; 
    itemElement.style.top = `${top}%`; 
    
    const nameTag = document.createElement('span');
    nameTag.textContent = randomItem.name;
    nameTag.className = 'item-name-tag';
    itemElement.appendChild(nameTag);
    
    itemElement.addEventListener('click', (e) => {
        if (!gameRunning || isPaused) return;

        const rect = itemElement.getBoundingClientRect();
        
        if (randomItem.type === 'hunter' || randomItem.type === 'logger') {
            showFloatingText('✔ 驅逐成功!', rect.left, rect.top, 'success');
            itemElement.remove();
        } else if (randomItem.type === 'animal') {
            updateHealth(-randomItem.score_penalty, '誤傷野生動物');
            showFloatingText(`❌ 誤傷! -${randomItem.score_penalty}HP`, rect.left, rect.top, 'fail');
        } 
        e.stopPropagation(); 
    });
    
    habitatGrid.appendChild(itemElement);
    
    setTimeout(() => {
        if (!gameRunning || isPaused) return;
        
        if (itemElement.parentNode) {
            const rect = itemElement.getBoundingClientRect();
            
            if (randomItem.type === 'logger') {
                updateHealth(-randomItem.score_penalty, `放跑了 ${randomItem.name}`);
                showFloatingText(`伐木工! -${randomItem.score_penalty}HP`, rect.left, rect.top, 'fail');
            } else if (randomItem.type === 'hunter') {
                updateSupply(randomItem.supply_increase, `放跑了 ${randomItem.name}`);
                showFloatingText(`盜獵者! +${randomItem.supply_increase}供給`, rect.left, rect.top, 'supply');
            }
            
            itemElement.remove();
        }
    }, 5000); 
}

// 更新生命值/棲地健康值
function updateHealth(change, reason) {
    if (!gameRunning || isPaused) return;
    healthScore += change;
    healthScore = Math.min(100, Math.max(0, healthScore)); 
    healthScoreDisplay.textContent = healthScore;
    checkFailure();
}

// 更新盜獵供給量
function updateSupply(change, reason) {
    if (!gameRunning || isPaused) return;
    supplyValue += change;
    supplyDisplay.textContent = supplyValue;
    checkFailure();
}

// 更新累積得分
function updateScore(change) {
    currentScore += change;
    currentScoreDisplay.textContent = currentScore;
}


// --- 7. 下方區域：知識與需求 (SDG 15.7) 邏輯 ---

function loadNextQuiz() {
    if (!gameRunning || isPaused || checkFailure()) return;

    currentQuizAnimal = ANIMAL_DATA[Math.floor(Math.random() * ANIMAL_DATA.length)];
    const isIllegal = currentQuizAnimal.is_illegal;
    
    quizAnimalImage.src = currentQuizAnimal.image || "assets/logo.png";
    quizAnimalImage.alt = currentQuizAnimal.name_zh;
    quizPrompt.textContent = currentQuizAnimal.prompt;

    choiceA.textContent = '🚨 判斷：非法走私！';
    choiceB.textContent = '✅ 判斷：合法貿易';

    choiceA.onclick = () => handleQuizChoice(true, isIllegal);
    choiceB.onclick = () => handleQuizChoice(false, isIllegal);
    
    choiceA.disabled = false;
    choiceB.disabled = false;
    
    resultMessageDisplay.textContent = '請仔細閱讀情境，選擇你的判斷。';
}

function handleQuizChoice(playerIsIllegal, correctIsIllegal) {
    if (!gameRunning || isPaused) return;

    choiceA.disabled = true;
    choiceB.disabled = true;

    const isCorrect = (playerIsIllegal === correctIsIllegal);

    if (isCorrect) {
        // 答對獎勵：累積得分 +5
        updateScore(SCORE_BONUS_ON_QUIZ_CORRECT); 
        
        // 知識點反饋 (不回復健康值)
        resultMessageDisplay.className = 'feedback knowledge-point result-win';
        resultMessageDisplay.textContent = `✔ 判斷正確！得分 +${SCORE_BONUS_ON_QUIZ_CORRECT}。知識點：${currentQuizAnimal.correct_info}`;

        // 解鎖圖鑑
        if (playerIsIllegal && currentQuizAnimal.is_illegal) {
            unlockAnimal(currentQuizAnimal.id);
        }
    } else {
        // 答錯雙重懲罰：扣健康值 -15 AND 加供給量 +20
        updateHealth(-PUNISHMENT_HEALTH_LOSS, '錯誤判斷'); 
        updateSupply(PUNISHMENT_SUPPLY_INCREASE, '錯誤判斷');

        // 知識點反饋
        resultMessageDisplay.className = 'feedback knowledge-point result-lose';
        resultMessageDisplay.textContent = `❌ 判斷錯誤！HP -${PUNISHMENT_HEALTH_LOSS} & 供給 +${PUNISHMENT_SUPPLY_INCREASE}。知識點：${currentQuizAnimal.incorrect_info}`;
    }

    // 延遲載入下一題
    setTimeout(loadNextQuiz, 4000);
}


// --- 8. 圖鑑與歷史紀錄邏輯 ---

function saveGameRecord(score, finalHealth, initialDemand, finalSupply, duration, win, reason) {
    const record = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        score: score,
        initialDemand: initialDemand,
        finalSupply: finalSupply,
        finalHealth: finalHealth,
        duration: duration,
        durationFormatted: formatTime(duration),
        win: win,
        reason: reason
    };
    gameHistory.push(record);
    localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
}

function updateScoreBoard() {
    const highestScore = gameHistory.reduce((max, record) => Math.max(max, record.score), 0);
    highScoreDisplay.textContent = highestScore;
}

function renderHistory() {
    historyList.innerHTML = '';
    if (gameHistory.length === 0) {
        historyList.innerHTML = '<p>尚無遊戲紀錄。</p>';
        return;
    }

    gameHistory.slice().reverse().forEach(record => {
        const item = document.createElement('div');
        item.className = 'history-record ' + (record.win ? 'record-win' : 'record-fail');
        item.innerHTML = `
            <strong>分數: ${record.score}</strong> (時長: ${record.durationFormatted})<br>
            日期: ${record.date}<br>
            初始需求/最終供給: ${record.initialDemand} / ${record.finalSupply}<br>
            結果: ${record.reason}
        `;
        historyList.appendChild(item);
    });
}

function unlockAnimal(id) {
    if (!unlockedPokedex.has(id)) {
        unlockedPokedex.add(id);
        localStorage.setItem('pokedex', JSON.stringify(Array.from(unlockedPokedex)));
        setTimeout(() => { alert(`恭喜！你成功攔截『${ANIMAL_DATA.find(a => a.id === id).name_zh}』並將其收錄入圖鑑！`); }, 100);
    }
}

function renderPokedex() {
    pokedexList.innerHTML = ''; 
    ANIMAL_DATA.forEach(animal => {
        const isUnlocked = unlockedPokedex.has(animal.id);
        
        const rarity = RARITY_LEVELS[animal.weight] || '未知'; 
        
        const card = document.createElement('div');
        card.className = `pokedex-card ${isUnlocked ? 'unlocked' : 'locked'} rarity-${animal.weight}`;
        
        card.innerHTML = `
            <div class="rarity-tag">${rarity}</div> 
            <img src="${animal.image || 'assets/default.png'}" alt="${animal.name_zh}">
            <h4>${isUnlocked ? animal.name_zh : '???'}</h4>
            <p class="pokedex-reason">${isUnlocked ? `走私原因: ${animal.reason.split('(')[0]}` : '未解鎖'}</p>
        `;
        pokedexList.appendChild(card);
    });
}


// --- 9. 事件監聽與初始設定 ---
startButton.addEventListener('click', initializeGame);
pauseButton.addEventListener('click', togglePause);
pokedexButton.addEventListener('click', showModal);

function showModal() {
    renderPokedex();
    renderHistory();
    
    // 預設顯示圖鑑
    tabContentHistory.classList.add('hidden');
    tabContentPokedex.classList.remove('hidden');
    tabPokedex.classList.add('active');
    tabHistory.classList.remove('active');
    
    pokedexModal.style.display = 'block';
}

// 模態框內 Tabs 切換
tabPokedex.addEventListener('click', () => {
    tabContentHistory.classList.add('hidden');
    tabContentPokedex.classList.remove('hidden');
    tabPokedex.classList.add('active');
    tabHistory.classList.remove('active');
});

tabHistory.addEventListener('click', () => {
    tabContentPokedex.classList.add('hidden');
    tabContentHistory.classList.remove('hidden');
    tabHistory.classList.add('active');
    tabPokedex.classList.remove('active');
});


closeButton.addEventListener('click', () => {
    pokedexModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == pokedexModal) {
        pokedexModal.style.display = 'none';
    }
});

// 網頁加載時的初始顯示
window.onload = function() {
    healthScoreDisplay.textContent = healthScore;
    demandDisplay.textContent = demandValue; 
    supplyDisplay.textContent = supplyValue;
    currentScoreDisplay.textContent = currentScore;
    gameTimerDisplay.textContent = formatTime(0);
    
    quizPrompt.textContent = "點擊開始遊戲，啟動棲地守護和黑市阻斷行動！";
    resultMessageDisplay.textContent = "目標：在棲地健康值或供給量達到極限前，持續累積知識並保護棲地。";
    
    quizAnimalImage.src = "assets/logo.png"; 
    
    updateScoreBoard();
    renderPokedex();
};