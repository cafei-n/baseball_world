// =====================================
// 世界ランキングマップ
// Plotly.jsを使用。ranking_daily.csv の各年最終データを表示する。
// =====================================

let worldMapYearData = {};

const worldMapIso3 = {
    "Afghanistan":"AFG", "Albania":"ALB", "Algeria":"DZA",
    "American Samoa":"ASM", "Andorra":"AND", "Angola":"AGO",
    "Antigua and Barbuda":"ATG", "Argentina":"ARG", "Armenia":"ARM",
    "Aruba":"ABW", "Australia":"AUS", "Austria":"AUT",
    "Azerbaijan":"AZE", "Bahamas":"BHS", "Bahrain":"BHR",
    "Bangladesh":"BGD", "Barbados":"BRB", "Belarus":"BLR",
    "Belgium":"BEL", "Belize":"BLZ", "Benin":"BEN",
    "Bermuda":"BMU", "Bhutan":"BTN", "Bolivia":"BOL",
    "Bosnia and Herzegovina":"BIH", "Botswana":"BWA", "Brazil":"BRA",
    "British Virgin Islands":"VGB", "Brunei":"BRN", "Bulgaria":"BGR",
    "Burkina Faso":"BFA", "Burundi":"BDI", "Cambodia":"KHM",
    "Cameroon":"CMR", "Canada":"CAN", "Cape Verde":"CPV",
    "Cayman Islands":"CYM", "Central African Republic":"CAF",
    "Chad":"TCD", "Chile":"CHL", "China":"CHN",
    "Colombia":"COL", "Comoros":"COM", "Congo":"COG",
    "Cook Islands":"COK", "Costa Rica":"CRI", "Croatia":"HRV",
    "Cuba":"CUB", "Curacao":"CUW", "Curaçao":"CUW",
    "Cyprus":"CYP", "Czech Republic":"CZE", "Czechia":"CZE",
    "Democratic Republic of the Congo":"COD", "Denmark":"DNK",
    "Djibouti":"DJI", "Dominica":"DMA", "Dominican Republic":"DOM",
    "Ecuador":"ECU", "Egypt":"EGY", "El Salvador":"SLV",
    "Equatorial Guinea":"GNQ", "Eritrea":"ERI", "Estonia":"EST",
    "Eswatini":"SWZ", "Ethiopia":"ETH", "Federated States of Micronesia":"FSM", "Fiji":"FJI",
    "Finland":"FIN", "France":"FRA", "French Guiana":"GUF",
    "Gabon":"GAB", "Gambia":"GMB", "Georgia":"GEO",
    "Germany":"DEU", "Ghana":"GHA", "Greece":"GRC",
    "Greenland":"GRL", "Grenada":"GRD", "Guadeloupe":"GLP",
    "Guam":"GUM", "Guatemala":"GTM", "Guinea":"GIN",
    "Guyana":"GUY", "Haiti":"HTI", "Honduras":"HND",
    "Hong Kong":"HKG", "Hong Kong, China":"HKG",
    "Hungary":"HUN", "Iceland":"ISL", "India":"IND",
    "Indonesia":"IDN", "Iran":"IRN", "Iraq":"IRQ",
    "Ireland":"IRL", "Israel":"ISR", "Italy":"ITA",
    "Ivory Coast":"CIV", "Côte d'Ivoire":"CIV", "Jamaica":"JAM",
    "Japan":"JPN", "Jordan":"JOR", "Kazakhstan":"KAZ",
    "Kenya":"KEN", "Kiribati":"KIR", "Kosovo":"XKX",
    "Kuwait":"KWT", "Kyrgyzstan":"KGZ", "Laos":"LAO",
    "Latvia":"LVA", "Lebanon":"LBN", "Lesotho":"LSO",
    "Liberia":"LBR", "Libya":"LBY", "Liechtenstein":"LIE",
    "Lithuania":"LTU", "Luxembourg":"LUX", "Macau":"MAC",
    "Madagascar":"MDG", "Malawi":"MWI", "Malaysia":"MYS",
    "Maldives":"MDV", "Mali":"MLI", "Malta":"MLT",
    "Marshall Islands":"MHL", "Martinique":"MTQ", "Mauritania":"MRT",
    "Mauritius":"MUS", "Mexico":"MEX", "Micronesia":"FSM",
    "Moldova":"MDA", "Monaco":"MCO", "Mongolia":"MNG",
    "Montenegro":"MNE", "Morocco":"MAR", "Mozambique":"MOZ",
    "Myanmar":"MMR", "Namibia":"NAM", "Nauru":"NRU",
    "Nepal":"NPL", "Netherlands":"NLD", "New Caledonia":"NCL",
    "New Zealand":"NZL", "Nicaragua":"NIC", "Niger":"NER",
    "Nigeria":"NGA", "North Korea":"PRK", "North Macedonia":"MKD",
    "Northern Mariana Islands":"MNP", "Norway":"NOR", "Oman":"OMN",
    "Pakistan":"PAK", "Palau":"PLW", "Palestine":"PSE",
    "Panama":"PAN", "Papua New Guinea":"PNG", "Paraguay":"PRY",
    "Peru":"PER", "Philippines":"PHL", "Poland":"POL",
    "Portugal":"PRT", "Puerto Rico":"PRI", "Qatar":"QAT",
    "Romania":"ROU", "Russia":"RUS", "Rwanda":"RWA",
    "Saint Kitts and Nevis":"KNA", "Saint Lucia":"LCA",
    "Saint Vincent and the Grenadines":"VCT", "Samoa":"WSM",
    "San Marino":"SMR", "Sao Tome and Principe":"STP",
    "Saudi Arabia":"SAU", "Senegal":"SEN", "Serbia":"SRB",
    "Seychelles":"SYC", "Sierra Leone":"SLE", "Singapore":"SGP",
    "Slovakia":"SVK", "Slovenia":"SVN", "Solomon Islands":"SLB",
    "Somalia":"SOM", "South Africa":"ZAF", "South Korea":"KOR",
    "Korea":"KOR", "Korea, Republic of":"KOR", "Spain":"ESP",
    "Sri Lanka":"LKA", "Sudan":"SDN", "Suriname":"SUR",
    "Sweden":"SWE", "Switzerland":"CHE", "Syria":"SYR",
    "Taiwan":"TWN", "Chinese Taipei":"TWN", "Taipei":"TWN",
    "Tajikistan":"TJK", "Tanzania":"TZA", "Thailand":"THA",
    "Timor-Leste":"TLS", "Togo":"TGO", "Tonga":"TON",
    "Trinidad and Tobago":"TTO", "Tunisia":"TUN", "Turkey":"TUR",
    "Türkiye":"TUR", "Turkmenistan":"TKM", "Tuvalu":"TUV",
    "Uganda":"UGA", "Ukraine":"UKR", "United Arab Emirates":"ARE",
    "United Kingdom":"GBR", "England":"GBR", "Scotland":"GBR",
    "Wales":"GBR", "Northern Ireland":"GBR",
    "United States":"USA", "United States of America":"USA",
    "USA":"USA", "US":"USA", "Uruguay":"URY", "Uzbekistan":"UZB",
    "Vanuatu":"VUT", "Venezuela":"VEN", "Vietnam":"VNM",
    "Virgin Islands":"VIR", "U.S. Virgin Islands":"VIR",
    "Zambia":"ZMB", "Zimbabwe":"ZWE",
    "Netherlands Antilles":"ANT", "Yugoslavia":"YUG"
};

// WBSC等のデータで使われる別表記を、地図上の国・地域に対応させる。
const worldMapAliases = {
    "Chinese Taipei":"Chinese Taipei",
    "Taiwan, China":"Chinese Taipei",
    "Taipei, Chinese":"Chinese Taipei",
    "Korea, South":"South Korea",
    "Republic of Korea":"South Korea",
    "Korea Republic":"South Korea",
    "USA Baseball":"USA",
    "United States of America":"United States",
    "Czech Republic":"Czechia",
    "Türkiye":"Turkey",
    "Curacao":"Curaçao",
    "Hong Kong, China":"Hong Kong",
    "Hong Kong China":"Hong Kong",
    "Great Britain":"United Kingdom",
    "British Virgin Islands":"British Virgin Islands",
    "U.S.A.":"USA"
};

function initWorldMap(){

    const yearSelect = document.getElementById("worldMapYear");
    const mapElement = document.getElementById("worldRankingMap");

    if(!yearSelect || !mapElement || typeof Plotly === "undefined"){
        const status = document.getElementById("worldMapStatus");
        if(status){
            status.textContent = "地図を読み込めませんでした。インターネット接続を確認してください。";
        }
        return;
    }

    // 年ごとに、その年に記録された最後の日付を探す。
    const years = [...new Set(
        dailyData
            .map(row => String(row.date).substring(0,4))
            .filter(year => /^\d{4}$/.test(year))
    )].sort((a,b)=>Number(b)-Number(a));

    worldMapYearData = {};

    years.forEach(year=>{

        const rowsInYear = dailyData.filter(row=>
            String(row.date).substring(0,4) === year
        );

        if(rowsInYear.length === 0){
            return;
        }

        const lastDate = rowsInYear
            .map(row=>String(row.date))
            .sort()
            .pop();

        worldMapYearData[year] = {
            date: lastDate,
            ranking: getRanking(lastDate)
        };

    });

    yearSelect.innerHTML = "";

    years.filter(year=>worldMapYearData[year]).forEach(year=>{

        const option = document.createElement("option");
        option.value = year;
        option.textContent = `${year}年`;
        yearSelect.appendChild(option);

    });

    if(years.length === 0){
        document.getElementById("worldMapStatus").textContent =
            "ランキングデータが見つかりませんでした。";
        return;
    }

    // 初期表示は最新の年
    yearSelect.value = years.find(year=>worldMapYearData[year]) || years[0];

    yearSelect.addEventListener("change", showWorldMapForSelectedYear);

    showWorldMapForSelectedYear();
}

function normalizeWorldMapTeam(team){

    let normalized = String(team ?? "").trim();

    if(worldMapAliases[normalized]){
        normalized = worldMapAliases[normalized];
    }

    return normalized;
}

function getWorldMapIso(team){

    const normalized = normalizeWorldMapTeam(team);

    if(worldMapIso3[normalized]){
        return worldMapIso3[normalized];
    }

    // 大文字小文字や前後の空白の違いを吸収
    const matchedKey = Object.keys(worldMapIso3).find(key=>
        key.toLowerCase() === normalized.toLowerCase()
    );

    return matchedKey ? worldMapIso3[matchedKey] : null;
}

function showWorldMapForSelectedYear(){

    const year = document.getElementById("worldMapYear").value;
    const mapData = worldMapYearData[year];

    if(!mapData){
        return;
    }

    const isoToTeam = {};
    const locations = [];
    const zValues = [];
    const hoverTexts = [];
    const customTeams = [];
    const unmappedTeams = [];

    const ranking = [...mapData.ranking].sort((a,b)=>a.rank-b.rank);
    const maxRank = ranking.reduce((max,row)=>Math.max(max,Number(row.rank)||0), 0) || 1;

    ranking.forEach(row=>{

        const iso = getWorldMapIso(row.team);

        if(!iso){
            unmappedTeams.push(row.team);
            return;
        }

        // 同一ISOコードに複数のチームが割り当たった場合は、上位のチームを優先。
        if(isoToTeam[iso]){
            return;
        }

        isoToTeam[iso] = row.team;
        locations.push(iso);
        zValues.push(maxRank - Number(row.rank) + 1);
        customTeams.push(row.team);

        const name = nameMap[row.team] ?? row.team;
        hoverTexts.push(`${name}<br>世界ランキング：${row.rank}位`);

    });

    const trace = {
        type: "choropleth",
        locationmode: "ISO-3",
        locations,
        z: zValues,
        text: hoverTexts,
        customdata: customTeams,
        zmin: 1,
        zmax: maxRank,
        colorscale: [
            [0, "#edf3f8"],
            [0.25, "#c6dbef"],
            [0.5, "#6baed6"],
            [0.75, "#2171b5"],
            [1, "#08306b"]
        ],
        marker: {
            line: {
                color: "#ffffff",
                width: 0.5
            }
        },
        showscale: false,
        hovertemplate: "%{text}<extra></extra>"
    };

    const layout = {
        autosize: true,
        margin: {t: 5, r: 5, b: 5, l: 5},
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        geo: {
            scope: "world",
            projection: {type: "natural earth"},
            showframe: false,
            showcoastlines: true,
            coastlinecolor: "#ffffff",
            showcountries: true,
            countrycolor: "#ffffff",
            showland: true,
            landcolor: "#e5e5e5",
            showocean: true,
            oceancolor: "#f7f9fb",
            bgcolor: "rgba(0,0,0,0)",
            lataxis: {range: [-60, 85]}
        }
    };

    Plotly.newPlot(
        "worldRankingMap",
        [trace],
        layout,
        {
            responsive: true,
            displayModeBar: false,
            scrollZoom: false
        }
    ).then(graph=>{

        graph.removeAllListeners("plotly_click");

        graph.on("plotly_click", event=>{

            const point = event.points && event.points[0];

            if(!point || !point.customdata){
                return;
            }

            window.location.href =
                `country.html?team=${encodeURIComponent(point.customdata)}`;

        });

    });

    document.getElementById("worldMapDate").textContent =
        `この年の最終ランキング日：${mapData.date.substring(0,10)}`;

    const status = document.getElementById("worldMapStatus");
    const mappedCount = locations.length;

    if(unmappedTeams.length > 0){
        status.textContent =
            `地図に表示できた国・地域：${mappedCount}。` +
            `地図上の表記に未対応のデータ：${unmappedTeams.length}件。` +
            `未対応：${unmappedTeams.join("、")}`;
    }
    else{
        status.textContent =
            `地図に表示できた国・地域：${mappedCount}`;
    }

}
