// =====================================
// 共通データ
// =====================================

let nameMap = {};
let tournamentMap = {};
let dailyData = [];
let aliasMap = {};


// =====================================
// 日本語チーム名
// =====================================

function loadNames(csv){

    const lines = csv.trim().split("\n");

    for(let i=1;i<lines.length;i++){

        const c = parseCSVLine(lines[i]);

        nameMap[c[0].trim()] = c[1].trim();
    }
}


// =====================================
// ランキング日次データ
// =====================================

function loadDailyRanking(csv){

    const lines = csv.trim().split("\n");

    dailyData = [];

    for(let i=1;i<lines.length;i++){

        const c = parseCSVLine(lines[i]);

        dailyData.push({

            date:c[0],

            rank:Number(c[1]),

            team:c[2],

            point:Number(c[3])

        });

    }

}


// =====================================
// 最新日付取得
// =====================================

function getLatestDate(){

    return dailyData
        .map(x=>x.date)
        .sort()
        .pop();

}


// =====================================
// 大会日本語名
// =====================================

function loadTournamentNames(csv){

    tournamentMap = {};

    const lines = csv.trim().split("\n");

    for(let i=1;i<lines.length;i++){

        const c = parseCSVLine(lines[i]);

        tournamentMap[c[1].trim()] =
            c[3].trim();

    }

}


// =====================================
// 大会名取得
// =====================================

function getTournamentName(name){

    for(const keyword in tournamentMap){

        // AND条件
        if(keyword.includes("&")){

            const keys = keyword.split("&");

            if(keys.every(key => name.includes(key.trim()))){
                return tournamentMap[keyword];
            }

        }

        // OR条件
        else if(keyword.includes("|")){

            const keys = keyword.split("|");

            if(keys.some(key => name.includes(key.trim()))){
                return tournamentMap[keyword];
            }

        }

        // 単独文字列
        else{

            if(name.includes(keyword)){
                return tournamentMap[keyword];
            }

        }

    }

    return name;

}


// =====================================
// 年齢カテゴリ取得
// =====================================

function getAgeCategory(name){

    if(name.includes("U-23") || name.includes("U23"))
        return "U-23";

    if(name.includes("U-18") || name.includes("U18"))
        return "U-18";

    if(name.includes("U-15") || name.includes("U15"))
        return "U-15";

    if(name.includes("U-12") || name.includes("U12"))
        return "U-12";

    if(name.includes("U-10") || name.includes("U10"))
        return "U-10";

    if(
        name.includes("Youth") ||
        name.includes("Juventud")
    )
        return "ユース";

    return "制限なし";

}


// =====================================
// ハンバーガーメニュー
// =====================================

function toggleMenu(){

    const menu =
        document.getElementById("menu");

    if(!menu) return;

    menu.style.display =
        menu.style.display=="block"
        ? "none"
        : "block";

}

function parseCSVLine(line){

    const result = [];
    let current = "";
    let inQuotes = false;

    for(let i=0;i<line.length;i++){

        const ch = line[i];

        if(ch === '"'){
            inQuotes = !inQuotes;
        }
        else if(ch === "," && !inQuotes){
            result.push(current);
            current = "";
        }
        else{
            current += ch;
        }
    }

    result.push(current);

    return result;
}

function loadAlias(csv){

    const lines = csv.trim().split("\n");

    for(let i=1;i<lines.length;i++){

        const c = parseCSVLine(lines[i]);

        aliasMap[c[0].trim()] = c[1].trim();

    }

}