// =====================================
// グローバル変数
// =====================================

let currentDate = "";
let parentRegionMap = {};

// =====================================
// データ読み込み
// =====================================

Promise.all([

    fetch("data/ranking.csv").then(r=>r.text()),

    fetch("data/ranking_daily.csv").then(r=>r.text()),

    fetch("data/team_name_ja.csv").then(r=>r.text()),

    fetch("js/region_parent.js").then(r=>r.json())

])
.then(([rankingCsv,dailyCsv,nameCsv,parentRegionJson])=>{

    loadNames(nameCsv);

    loadDailyRanking(dailyCsv);

    parentRegionMap = parentRegionJson;

    showLastUpdate();

    showLatestRanking(rankingCsv);

    // 世界ランキングマップを初期化
    if(typeof initWorldMap === "function"){
        initWorldMap();
    }

});

function showLastUpdate(){

    if(dailyData.length==0){
        return;
    }

    const latest =
        dailyData
        .map(x=>x.date)
        .sort()
        .pop();

    document.getElementById(
        "lastUpdate"
    ).textContent =
        "最終更新：" + latest.substring(0,10);

}

// =====================================
// 指定日以前の最新ランキング取得
// =====================================

function getRanking(date){

    let result = dailyData.filter(x => x.date <= date);

    if(result.length == 0){
        return [];
    }

    let latest = result
        .map(x => x.date)
        .sort()
        .pop();

    return result
        .filter(x => x.date == latest)
        .sort((a,b)=>a.rank-b.rank);

}

// 最新ランキング読み込み
function showLatestRanking(){

    let latest = dailyData
        .map(x=>x.date)
        .sort()
        .pop();

    currentDate = latest;

    document.getElementById("dateSelect").value = latest;

    // ランキングニュースを生成
    showRankingNews(latest);

    displayRanking(
        getRanking(latest)
    );

}

// 日付指定ランキング読み込み
function showDateRanking(){

    let date =
        document.getElementById(
            "dateSelect"
        ).value;

    // 日付が空なら現在表示中の日付を使う
    if(date==""){
        date = currentDate;
    }

    currentDate = date;

    // 選択日付時点のランキングニュースを生成
    showRankingNews(date);

    // ランキング表示
    displayRanking(
        getRanking(date)
    );

}

// =====================================
// 比較日取得
// =====================================

function getCompareDate(date){

    let d = new Date(date);

    let period =
        document.getElementById(
            "comparePeriod"
        ).value;

    if(period=="month"){
        d.setMonth(
            d.getMonth()-1
        );
    }

    else if(period=="year"){
        d.setFullYear(
            d.getFullYear()-1
        );
    }

    else{
        d.setFullYear(
            d.getFullYear()-4
        );
    }

    return d
        .toISOString()
        .substring(0,10);
}

// =====================================
// ランキング表示
// =====================================

function displayRanking(data){

    const tbody =
        document.getElementById("ranking");

    tbody.innerHTML = "";

    const region =
    document.getElementById("regionFilter").value;
    // 地域順位計算用（全世界データ）
    const allData = [...data];

    // 表示用データだけ絞る
    if(region){
        data = data.filter(row=>{
            const tags =
                regionMap[row.team] ?? "";
            return tags.includes(region);
        });
    }

    const regionRanking = {};

    if(region){
        const parentRegion = getParentRegion(region);
        let rank = 1;
        allData
        .filter(row=>{
            const tags =
                regionMap[row.team] ?? "";
            return tags.includes(parentRegion);
        })
        .sort((a,b)=>a.rank-b.rank)
        .forEach(row=>{
            regionRanking[row.team]=rank++;
        });
    }

    document.getElementById("regionFilter")
        .addEventListener("change",()=>{

            const region =
                document.getElementById("regionFilter").value;

            document.getElementById("regionRankHeader")
            .style.display =
                region ? "" : "none";
            displayRanking(rankingData);

        });


    // 比較ランキング作成
    let compareRanking = {};

    if(currentDate!=""){

        let compareDate =
            getCompareDate(currentDate);

        let oldRanking =
            getRanking(compareDate);

        oldRanking.forEach(row=>{

            compareRanking[row.team]={
                rank: row.rank,
                point: Number(row.point)
            };
        });
    }

    // 表作成
    data
    .sort((a,b)=>a.rank-b.rank)
    .forEach(row=>{

        let rankChange="";
        let rankClass="";

        let pointChange="";
        let pointClass="";

        if(compareRanking[row.team] === undefined){

            rankChange="NEW";
            rankClass="change-new";

            pointChange="NEW";
            pointClass="point-same";
        }
        else{
            // 順位変化
            let rankDiff =
                compareRanking[row.team].rank
                -
                row.rank;

            if(rankDiff > 0){
                rankChange="▲"+rankDiff;
                rankClass="change-up";
            }
            else if(rankDiff < 0){
                rankChange="▼"+(-rankDiff);
                rankClass="change-down";
            }
            else{
                rankChange="-";
                rankClass="change-same";
            }

            // ポイント変化
            let pointDiff =
                Number(row.point)
                -
                compareRanking[row.team].point;

            pointDiff =
                Math.round(pointDiff*100)/100;

            if(pointDiff > 0){
                pointChange="▲"+pointDiff;
                pointClass="point-up";
            }
            else if(pointDiff < 0){
                pointChange="▼"+Math.abs(pointDiff);
                pointClass="point-down";
            }
            else{
                pointChange="-";
                pointClass="point-same";
            }
        }

        const tr =
            document.createElement("tr");

        tr.innerHTML = `
            <td class="rank">
                ${row.rank}
            </td>
                ${region?`
            <td>
                ${regionRanking[row.team] ?? "-"}
            </td>
            `:""
                }
            <td>
                <a href="country.html?team=${encodeURIComponent(row.team)}">
                ${nameMap[row.team] ?? row.team}
                </a>
            </td>
            <td>
                ${row.point}
            </td>
            <td class="${pointClass}">
                ${pointChange}
            </td>
            <td class="${rankClass}">
                ${rankChange}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function getParentRegion(region){

    return parentRegionMap[region] ?? region;

}


 // =====================================
 // ランキングニュース
 // =====================================

function showRankingNews(latestDate){

    const newsList =
        document.getElementById("rankingNewsList");

    newsList.innerHTML = "";

    // 日付一覧
    const dates = [...new Set(
        dailyData.map(x=>x.date)
    )].sort();

    // 前回のランキング日付
    const previousDate = dates
        .filter(date=>date < latestDate)
        .pop();

    const currentRanking = getRanking(latestDate);

    const previousRanking = previousDate
        ? getRanking(previousDate)
        : [];

    // 初回データなど、比較対象がない場合
    if(
        currentRanking.length == 0 ||
        previousRanking.length == 0
    ){
        newsList.innerHTML =
            "<li>現在、ランキングニュースはありません</li>";
        return;
    }

    // チーム別ランキング
    const currentMap = {};
    const previousMap = {};

    currentRanking.forEach(row=>{
        currentMap[row.team] = row;
    });

    previousRanking.forEach(row=>{
        previousMap[row.team] = row;
    });

    // 優先度の高いニュースを登録
    const candidates = [];

    function addNews(priority, team, title){

        candidates.push({
            priority,
            team,
            title
        });

    }

    // -------------------------------------
    // 1. 世界1位が交代
    // -------------------------------------

    const currentWorldFirst = currentRanking[0];
    const previousWorldFirst = previousRanking[0];

    if(
        currentWorldFirst.team !== previousWorldFirst.team
    ){

        const name =
            nameMap[currentWorldFirst.team] ??
            currentWorldFirst.team;

        const previousName =
            nameMap[previousWorldFirst.team] ??
            previousWorldFirst.team;

        addNews(
            1,
            currentWorldFirst.team,
            `${name}が世界一位へ。${previousName}から頂点を奪う`
        );

    }

    // -------------------------------------
    // 2・3. 過去最高順位の更新、初のTOP10入り
    // -------------------------------------

    currentRanking.forEach(row=>{

        const oldRankings = dailyData.filter(x=>
            x.team === row.team &&
            x.date < latestDate
        );

        if(oldRankings.length === 0){
            return;
        }

        const name =
            nameMap[row.team] ?? row.team;

        const bestRank = Math.min(
            ...oldRankings.map(x=>x.rank)
        );

        const wasTop10 = oldRankings.some(x=>
            x.rank <= 10
        );

        // 過去最高順位を更新
        if(row.rank < bestRank){

            addNews(
                2,
                row.team,
                `${name}が${row.rank}位に。過去最高だった${bestRank}位を上回り新記録となった`
            );

        }

        // 初のTOP10入り
        else if(row.rank <= 10 && !wasTop10){

            addNews(
                3,
                row.team,
                `${name}が${row.rank}位になり初の世界ランキングTOP10入り。上位に新たな顔ぶれが加わる`
            );

        }

    });

    // -------------------------------------
    // 4. 地域1位が交代
    // -------------------------------------

    const regionNames = {
        "Asia": "アジア",
        "East Asia": "東アジア",
        "Southeast Asia": "東南アジア",
        "South Asia": "南アジア",
        "West Asia": "西アジア",

        "Europe": "ヨーロッパ",
        "West Europe": "西ヨーロッパ",
        "East Europe": "東ヨーロッパ",
        "North Europe": "北ヨーロッパ",
        "South Europe": "南ヨーロッパ",

        "America": "アメリカ",
        "North America": "北米",
        "Central America": "中米",
        "Caribbean": "カリブ海",
        "South America": "南米",

        "Africa": "アフリカ",
        "East Africa": "東アフリカ",
        "South Africa": "南アフリカ",
        "West Africa": "西アフリカ",

        "Oceania": "オセアニア"
    };

    // team_name_ja.csvに登録されている地域を取得
    const allRegions = new Set();

    Object.values(regionMap).forEach(tags=>{

        String(tags ?? "")
            .split("|")
            .map(tag=>tag.trim())
            .filter(Boolean)
            .forEach(tag=>allRegions.add(tag));

    });

    function getRegionalLeader(ranking, region){

        return ranking
            .filter(row=>{

                const tags = String(
                    regionMap[row.team] ?? ""
                ).split("|").map(tag=>tag.trim());

                return tags.includes(region);

            })
            .sort((a,b)=>a.rank-b.rank)[0];

    }

    allRegions.forEach(region=>{

        const currentLeader =
            getRegionalLeader(currentRanking, region);

        const previousLeader =
            getRegionalLeader(previousRanking, region);

        if(
            !currentLeader ||
            !previousLeader ||
            currentLeader.team === previousLeader.team
        ){
            return;
        }

        const name =
            nameMap[currentLeader.team] ??
            currentLeader.team;

        const regionName =
            regionNames[region] ?? region;

        addNews(
            4,
            currentLeader.team,
            `${regionName}内ランキング1位が交代し${name}がトップへ。新たな地域の顔となる`
        );

    });

    // -------------------------------------
    // 5～7. 順位・ポイントの変動
    // -------------------------------------

    currentRanking.forEach(row=>{

        const oldRow = previousMap[row.team];

        if(!oldRow){
            return;
        }

        const name =
            nameMap[row.team] ?? row.team;

        const rankRise = oldRow.rank - row.rank;

        const pointRise =
            Number(row.point) - Number(oldRow.point);

        // 小数第1位に四捨五入
        const roundedPointRise =
            Math.round(pointRise * 10) / 10;

        // 5. 5ランク以上上昇
        if(rankRise >= 5){

            addNews(
                5,
                row.team,
                `順位急上昇！ ${name}が一気に${rankRise}ランクアップ`
            );

        }

        // 6. 1～4ランク上昇
        else if(rankRise >= 1){

            addNews(
                6,
                row.team,
                `${name}が順位を${rankRise}つ上げる`
            );

        }

        // 7. 10ポイント以上増加
        if(pointRise >= 10){

            addNews(
                7,
                row.team,
                `${name}が${roundedPointRise.toFixed(1)}ポイントを獲得し大きな上昇。順位アップを狙い弾みをつける`
            );

        }

    });

    // -------------------------------------
    // 優先度順に並べ、同じ国の重複を避ける
    // -------------------------------------

    candidates.sort((a,b)=>
        a.priority - b.priority
    );

    const shownTeams = new Set();

    const news = candidates.filter(item=>{

        if(shownTeams.has(item.team)){
            return false;
        }

        shownTeams.add(item.team);
        return true;

    }).slice(0,3);

    // -------------------------------------
    // ニュース表示
    // -------------------------------------

    if(news.length === 0){

        newsList.innerHTML =
            "<li>現在、ランキングニュースはありません</li>";

        return;

    }

    news.forEach(item=>{

        const li = document.createElement("li");
        li.textContent = item.title;

        newsList.appendChild(li);

    });

}
