// --- 1. 遊戲核心數據與懲罰係數 ---
const SCORE_BONUS_ON_QUIZ_CORRECT = 5; // 答對分數獎勵
const PUNISHMENT_HEALTH_LOSS = 15;
const PUNISHMENT_SUPPLY_INCREASE = 20; // 答錯增加供給量
const HUNTER_SUPPLY_INCREASE = 10; // 放跑盜獵者增加供給量
const MAX_GAME_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 天時長上限 (毫秒)

// 定義稀有度標籤
const RARITY_LEVELS = {
    5: '常見 (COMMON)',
    4: '不常見 (UNCOMMON)',
    3: '稀有 (RARE)',
    2: '極稀有 (EPIC)',
    1: '傳說 (LEGENDARY)'
};


// *** 主數據結構：用於圖鑑展示 (單一物種 ID) ***
const ANIMAL_DATA_MASTER = [
    // 1. 食蟹獼猴 (Macaca fascicularis) - 統一權重 5
    { 
        id: 'macaca', name_zh: "食蟹獼猴", weight: 5, rarity_tag: RARITY_LEVELS[5], image: 'assets/macaque.png',
        illegal_case: { is_illegal: true, prompt: "海關截獲一批標註『觀賞用』的食蟹獼猴，數量極多，疑似是高頻率走私的實驗動物。", correct_info: "正確！食蟹獼猴是高頻率走私的實驗動物，運送條件可疑。", incorrect_info: "錯誤！非法貿易常將實驗動物偽裝成寵物，需嚴查。", reason: "實驗動物需求高" },
        legal_case: { is_illegal: false, prompt: "某國內實驗室文件顯示他們從合規養殖場訂購了少量食蟹獼猴，用於國內研究，且有 DNA 追溯紀錄。", correct_info: "正確！合規的國內實驗動物交易，文件齊全應放行。", incorrect_info: "錯誤！雖然食蟹獼猴風險高，但合規交易屬於合法貿易，誤判影響科研。", reason: "國內合規實驗交易 (陷阱)" }
    },
    // 2. 歐洲鰻 (Anguilla anguilla) - 統一權重 5
    {
        id: 'eureel', name_zh: "歐洲鰻", weight: 5, rarity_tag: RARITY_LEVELS[5], image: 'assets/eel.png',
        illegal_case: { is_illegal: true, prompt: "碼頭查獲大量用塑膠袋裝著的透明魚苗，運送目標是東亞黑市，其真實身份是極高價值的玻璃鰻。", correct_info: "正確！玻璃鰻是極高風險的走私物種，東亞黑市是主要目標。", incorrect_info: "錯誤！歐洲鰻是非法貿易機率『極高』的物種！請務必攔截！", reason: "極高風險的玻璃鰻走私" },
        legal_case: { is_illegal: false, prompt: "某水產養殖場進口少量歐洲鰻魚苗，具有官方頒發的年度配額捕撈證明及檢疫證明。", correct_info: "正確！在配額制度下的合法捕撈，應放行。", incorrect_info: "錯誤！該批貨物符合年度配額制度，應放行。", reason: "年度配額內合法捕撈 (陷阱)" }
    },
    // 3. 恆河猴 (Macaca mulatta) - 統一權重 5
    { id: 'rhesusmacaque', name_zh: "恆河猴", weight: 5, rarity_tag: RARITY_LEVELS[5], image: 'assets/rhesus_macaque.png',
        illegal_case: { is_illegal: true, prompt: "查獲一批恆河猴，文件顯示用於『教育展示』，但運單流向是歐洲某大型私人實驗動物設施。", correct_info: "正確！恆河猴是全球實驗動物黑市重點，其高風險目的地和模糊的用途應視為走私。", incorrect_info: "錯誤！恆河猴是實驗動物黑市常客，此運單流向極度可疑。", reason: "全球實驗動物需求大 (高風險)" },
        legal_case: { is_illegal: false, prompt: "某國家動物園聲稱從國際認證機構訂購了兩隻用於遺傳多樣性保育的恆河猴，具備完整的 CITES 轉讓證明。", correct_info: "正確！瀕危物種在官方保育機構間的轉讓是合法的。", incorrect_info: "錯誤！ CITES 規範下的官方保育轉讓屬於合法貿易。", reason: "官方保育轉讓 (陷阱)" }
    },
    // 4. 歐洲白鱘 (Huso huso) - 統一權重 5
    { id: 'beluga', name_zh: "歐洲白鱘 (Beluga)", weight: 5, rarity_tag: RARITY_LEVELS[5], image: 'assets/beluga_sturgeon.png',
        illegal_case: { is_illegal: true, prompt: "查獲一小批標註為『頂級 Beluga 魚子醬』的貨物，但包裝無 CITES 標籤。這是全球最昂貴的魚子醬，高利潤導致盜捕嚴重。", correct_info: "正確！歐洲白鱘（Beluga）受到 CITES 嚴格管制，無標籤的 Beluga 幾乎可以斷定為非法走私。", incorrect_info: "錯誤！頂級 Beluga 魚子醬是黑市重點。必須確認 CITES 標籤，否則應視為非法。", reason: "Beluga 魚子醬 (無 CITES 標籤)" },
        legal_case: { is_illegal: false, prompt: "某大型水產養殖公司進口了一批人工養殖的 Beluga 魚子醬，具有清晰可驗證的 CITES 養殖許可證。", correct_info: "正確！人工養殖的 Beluga 魚子醬是合法貿易，有許可證應放行。", incorrect_info: "錯誤！雖然高風險，但這是有 CITES 許可的合法養殖產品。", reason: "人工養殖且有 CITES 許可 (陷阱)" }
    },
    
    // 5. 施氏鱘 (Acipenser schrenckii) - 統一權重 4
    { id: 'schrenckiisturgeon', name_zh: "施氏鱘", weight: 4, rarity_tag: RARITY_LEVELS[4], image: 'assets/schrenckii_sturgeon.png',
        illegal_case: { is_illegal: true, prompt: "邊境查獲施氏鱘魚子醬。來源地區過去有大規模非法捕撈記錄，且缺乏現代 DNA 追溯報告。", correct_info: "正確！施氏鱘是中俄交界重點保護物種。缺乏追溯報告應視為非法洗白。", incorrect_info: "錯誤！鱘魚走私風險高，來源有爭議，必須攔截。", reason: "中俄非法捕撈 (無追溯報告)" },
        legal_case: { is_illegal: false, prompt: "某高檔餐廳進口少量施氏鱘魚子醬，文件顯示來源於遠離爭議地區的歐洲水產養殖場，並附有官方檢疫證明。", correct_info: "正確！來自乾淨、有檢疫證明的養殖場，屬於合法貿易。", incorrect_info: "錯誤！應避免誤判合法且有良好記錄的貿易。", reason: "遠離爭議地區養殖 (陷阱)" }
    },
    // 6. 西伯利亞鱘 (Acipenser baerii) - 統一權重 4
    { id: 'siberiansturgeon', name_zh: "西伯利亞鱘", weight: 4, rarity_tag: RARITY_LEVELS[4], image: 'assets/siberian_sturgeon.png',
        illegal_case: { is_illegal: true, prompt: "發現一批標籤為『合法養殖西伯利亞鱘魚子醬』的貨物。但數量和運單細節與養殖場的申報不符，疑似利用偽標洗白黑市貨。", correct_info: "正確！數量與申報不符，是典型的偽標走私行為。", incorrect_info: "錯誤！鱘魚家族是走私高風險物種，黑市常利用偽造標籤，不應輕易放行。", reason: "利用偽標洗白黑市貨" },
        legal_case: { is_illegal: false, prompt: "某進口商進口少量西伯利亞鱘魚子醬，所有文件和數量都與出口國的官方電子追蹤系統數據完全吻合。", correct_info: "正確！數據吻合且有官方追蹤，屬於低風險合法貿易。", incorrect_info: "錯誤！官方數據吻合，應放行。", reason: "官方電子追蹤系統吻合 (陷阱)" }
    },
    // 7. 俄羅斯鱘 (Acipenser gueldenstaedtii) - 統一權重 4
    { id: 'russiansturgeon', name_zh: "俄羅斯鱘", weight: 4, rarity_tag: RARITY_LEVELS[4], image: 'assets/sturgeon.png',
        illegal_case: { is_illegal: true, prompt: "查獲俄羅斯鱘魚子醬，其標籤顯示生產日期為數年前。魚子醬若長時間儲存仍被高價販售，通常是盜捕後等待市場價格上漲的貨物。", correct_info: "正確！盜捕者常儲存貨物，生產日期異常可疑，應攔截。", incorrect_info: "錯誤！長時間儲存的高價魚子醬極有可能是黑市囤積的贓物。", reason: "盜捕後囤貨 (生產日期異常)" },
        legal_case: { is_illegal: false, prompt: "某進口商進口大量俄羅斯鱘，但所有魚子醬都帶有二維碼，掃描後能追溯到獨立的養殖魚塘和生產批次。", correct_info: "正確！具備現代追溯技術的產品，屬於可靠的合法貿易。", incorrect_info: "錯誤！追溯系統完善，屬於合法貿易。", reason: "具備現代追溯技術 (陷阱)" }
    },

    // 8. 小羊駝 (Vicugna vicugna) - 統一權重 3
    { id: 'vicuna', name_zh: "小羊駝 (毛料)", weight: 3, rarity_tag: RARITY_LEVELS[3], image: 'assets/vicuna.png',
        illegal_case: { is_illegal: true, prompt: "查獲一批極其柔軟的 Vicuña 毛料。雖然有『合法來源』文件，但該文件是過期且手寫的舊文件，無法通過現代系統驗證。", correct_info: "正確！舊式且無法驗證的文件可能是掩護非法狩獵的手段。", incorrect_info: "錯誤！無法驗證的文件是走私的危險訊號。", reason: "毛料價值高 (過期文件)" },
        legal_case: { is_illegal: false, prompt: "查獲 Vicuña 毛料，文件顯示該批毛料是透過合法剪毛取得，並由國際組織頒發了綠色認證標籤。", correct_info: "正確！具備國際認證的合法剪毛產品，應放行。", incorrect_info: "錯誤！應放行。", reason: "合法剪毛認證 (陷阱)" }
    },
    // 9. 非洲綠猴 (Chlorocebus aethiops) - 統一權重 3
    { id: 'greenmonkey', name_zh: "非洲綠猴", weight: 3, rarity_tag: RARITY_LEVELS[3], image: 'assets/greenmonkey.png',
        illegal_case: { is_illegal: true, prompt: "查獲一批非洲綠猴，被藏在一般貨運中，無任何活體動物標籤。該品種常被用於非法實驗或異國寵物交易。", correct_info: "正確！非洲綠猴無標籤走私，是典型的非法寵物/實驗動物貿易。", incorrect_info: "錯誤！任何無標籤、非法藏匿的活體動物皆屬違法走私。", reason: "無標籤走私 (非法寵物)" },
        legal_case: { is_illegal: false, prompt: "某野生動物救援中心接收了一隻受傷的非洲綠猴，正進行跨國轉運到另一個康復設施，具備官方動物健康證明。", correct_info: "正確！動物救援和康復設施間的轉運，屬於合法人道主義行為。", incorrect_info: "錯誤！ 這是救援行為，有官方證明，應放行。", reason: "官方救援轉運 (陷阱)" }
    },
    // 10. 咸水鱷 (Crocodylus porosus) - 統一權重 3 (此處將咸水鱷權重調高至 3, 與綠猴/小羊駝一致)
    { id: 'croc', name_zh: "咸水鱷", weight: 3, rarity_tag: RARITY_LEVELS[3], image: 'assets/crocodile.png',
        illegal_case: { is_illegal: true, prompt: "查獲一批咸水鱷皮革，雖然文件顯示為養殖，但皮革上發現明顯的野外捕撈痕跡，懷疑將非法皮革混入。", correct_info: "正確！皮革物理特徵與文件不符，是典型的混貨走私。", incorrect_info: "錯誤！皮革上若有野外捕撈痕跡，應視為非法。", reason: "皮革混貨 (野外捕撈痕跡)" },
        legal_case: { is_illegal: false, prompt: "查獲一批咸水鱷皮革，文件顯示來自某知名全球認證的養殖場，並附有完整的批次編號。", correct_info: "正確！來自知名認證養殖場，且批次編號完整，屬於低風險合法貿易。", incorrect_info: "錯誤！應放行。", reason: "全球認證養殖場 (陷阱)" }
    },

    // 11. 混種鱘魚 (Huso dauricus × Acipenser schrenckii) - 統一權重 2
    { id: 'hybridsturgeon', name_zh: "混種鱘魚", weight: 2, rarity_tag: RARITY_LEVELS[2], image: 'assets/hybrid_sturgeon.png',
        illegal_case: { is_illegal: true, prompt: "查獲混種鱘魚魚子醬，經 DNA 檢測後發現純種鱘魚 DNA 混雜比例過高，疑似將非法野生純種魚子醬混入養殖混種魚子醬中販售。", correct_info: "正確！混雜野生純種 DNA 是典型的洗白走私手段。", incorrect_info: "錯誤！這是利用混種掩護純種非法交易的行為，必須攔截。", reason: "混雜純種 DNA 走私" },
        legal_case: { is_illegal: false, prompt: "查獲少量混種鱘魚魚子醬，所有文件和產品都符合 CITES 對於混種產品的規範，且有官方質檢報告。", correct_info: "正確！遵守 CITES 規範的混種產品是合法的。", incorrect_info: "錯誤！該批貨物符合所有規範，應放行。", reason: "符合 CITES 規範 (陷阱)" }
    },
    // 12. 白鱘 (Acipenser transmontanus) - 統一權重 2
    { id: 'whitesturgeon', name_zh: "白鱱", weight: 2, rarity_tag: RARITY_LEVELS[2], image: 'assets/whitesturgeon.png',
        illegal_case: { is_illegal: true, prompt: "查獲白鱱魚子醬，文件顯示其來自人工養殖，但包裝標籤上的物種名稱模糊不清，疑似為高價 Beluga 的偽裝品。", correct_info: "正確！標籤模糊是偽裝高價產品的常見手段，應攔截。", incorrect_info: "錯誤！該批貨物標籤可疑，不能放行。", reason: "標籤模糊 (偽裝高價品)" },
        legal_case: { is_illegal: false, prompt: "某魚子醬專賣店進口白鱱魚子醬，其文件顯示來自國內註冊養殖場，並有檢疫部門的合格證明。", correct_info: "正確！國內註冊養殖場且有合格證明，屬於合法貿易。", incorrect_info: "錯誤！應放行。", reason: "國內註冊養殖場 (陷阱)" }
    },
    // 13. 孔雀 (Pavo cristatus) - 統一權重 2
    { id: 'peacock', name_zh: "孔雀", weight: 2, rarity_tag: RARITY_LEVELS[2], image: 'assets/peacock.png',
        illegal_case: { is_illegal: true, prompt: "查獲大批量活體孔雀和羽毛，文件顯示用於『觀賞用』，但該物種大批量跨國運輸極為罕見，懷疑涉及非法寵物交易。", correct_info: "正確！大批量、異常的運輸行為可能是非法寵物貿易的訊號。", incorrect_info: "錯誤！數量異常和跨國流向是走私的危險訊號。", reason: "大批量跨國走私 (異常)" },
        legal_case: { is_illegal: false, prompt: "查獲少量孔雀羽毛，附帶有販賣羽毛的許可證。數量與價格符合常規的藝術品交易。", correct_info: "正確！ 孔雀通常屬於合法養殖觀賞鳥，此為低風險合法交易。", incorrect_info: "錯誤！ 應放行。", reason: "合法羽毛交易 (陷阱)" }
    },

    // 14. 黃鼬 (Mustela sibirica) - 統一權重 1
    { id: 'weasel', name_zh: "黃鼬", weight: 1, rarity_tag: RARITY_LEVELS[1], image: 'assets/weasel.png',
        illegal_case: { is_illegal: true, prompt: "查獲一批黃鼬毛皮，文件顯示來源於跨國貿易，但該物種的國際交易非常少見，且數量極大，懷疑是走私到海外加工。", correct_info: "正確！ 黃鼬國際貿易風險低，大批量和跨國運輸的異常行為應視為走私。", incorrect_info: "錯誤！ 異常的數量和跨國流向是走私的危險訊號。", reason: "國際大批量走私 (異常)" },
        legal_case: { is_illegal: false, prompt: "某國內皮草商進口少量黃鼬毛皮，文件顯示來源於國內合法定點養殖場，數量和價格符合國內法規。", correct_info: "正確！國內合法養殖場的交易，屬於低風險。", incorrect_info: "錯誤！應放行。", reason: "國內合法定點養殖 (陷阱)" }
    },
];

// *** 遊戲邏輯生成器：將雙情境結構展開為問答題 ***
const ANIMAL_QUIZ_DATA = [];
ANIMAL_DATA_MASTER.forEach(animal => {
    // 違法情境
    ANIMAL_QUIZ_DATA.push({
        ...animal.illegal_case,
        id: animal.id + '_illegal',
        master_id: animal.id, // 指向唯一的圖鑑 ID
        name_zh: animal.name_zh,
        image: animal.image,
        weight: animal.weight 
    });
    // 不違法情境 (陷阱)
    ANIMAL_QUIZ_DATA.push({
        ...animal.legal_case,
        id: animal.id + '_legal',
        master_id: animal.id, // 指向唯一的圖鑑 ID
        name_zh: animal.name_zh,
        image: animal.image,
        weight: animal.weight 
    });
});


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

    // 從 ANIMAL_QUIZ_DATA 中隨機選取問答題
    currentQuizAnimal = ANIMAL_QUIZ_DATA[Math.floor(Math.random() * ANIMAL_QUIZ_DATA.length)];
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

        // *** 核心修正：只要答對，就解鎖該動物 (使用 master_id) ***
        unlockAnimal(currentQuizAnimal.master_id); 
        
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
        setTimeout(() => { alert(`恭喜！你成功攔截『${ANIMAL_DATA_MASTER.find(a => a.id === id).name_zh}』並將其收錄入圖鑑！`); }, 100);
    }
}

function renderPokedex() {
    pokedexList.innerHTML = ''; 
    ANIMAL_DATA_MASTER.forEach(animal => { // *** 使用 ANIMAL_DATA_MASTER 渲染 ***
        const isUnlocked = unlockedPokedex.has(animal.id);
        
        const rarity = animal.rarity_tag; 
        
        const card = document.createElement('div');
        card.className = `pokedex-card ${isUnlocked ? 'unlocked' : 'locked'} rarity-${animal.weight}`;
        
        card.innerHTML = `
            <div class="rarity-tag">${rarity}</div> 
            <img src="${animal.image || 'assets/default.png'}" alt="${animal.name_zh}">
            <h4>${isUnlocked ? animal.name_zh : '???'}</h4>
            <p class="pokedex-reason">${isUnlocked ? `風險：${rarity.split(' ')[0]} / 原因：${animal.illegal_case.reason.split('(')[0]}` : '未解鎖'}</p>
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