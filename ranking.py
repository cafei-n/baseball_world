import csv
import os
import math
from datetime import datetime


# =====================================
# パス設定
# =====================================

DATA_DIR = "data"

RESULT_FILES = [
    os.path.join(
        DATA_DIR,
        "wbsc_results.csv"
    ),
    os.path.join(
        DATA_DIR,
        "wbc_results.csv"
    )
]

INITIAL_FILE = os.path.join(
    DATA_DIR,
    "initial_ranking.csv"
)

RANKING_FILE = os.path.join(
    DATA_DIR,
    "ranking.csv"
)

HISTORY_FILE = os.path.join(
    DATA_DIR,
    "ranking_history.csv"
)

ALIAS_FILE = os.path.join(
    DATA_DIR,
    "country_alias.csv"
)

CONFIG_FILE = os.path.join(
    DATA_DIR,
    "ranking_config.csv"
)

DAILY_HISTORY_FILE = os.path.join(
    DATA_DIR,
    "ranking_daily.csv"
)


# =====================================
# CSV読み込み
# =====================================

def read_csv(filename):

    with open(
        filename,
        encoding="utf-8-sig"
    ) as f:

        return list(csv.DictReader(f))



# =====================================
# 現在ランキング読み込み
# =====================================

unknown_teams = set()
def load_ratings():

    ratings = {}


    # 2回目以降
    if os.path.exists(RANKING_FILE):

        rows = read_csv(
            RANKING_FILE
        )

        for row in rows:

            ratings[
                row["team"].strip()
            ] = float(
                row["point"]
            )

        print(
            "ranking.csvから現在ポイントを読み込みました"
        )


    # 初回
    else:

        rows = read_csv(
            INITIAL_FILE
        )

        for row in rows:

            ratings[
                row["team"].strip()
            ] = float(
                row["point"]
            )   

        print(
            "initial_ranking.csvから初期ポイントを読み込みました"
        )


    return ratings



# =====================================
# 国名変換
# =====================================

def load_alias():

    alias = {}

    if not os.path.exists(ALIAS_FILE):
        return alias

    rows = read_csv(
        ALIAS_FILE
    )

    for row in rows:

        alias[
            row["alias"].strip()
        ] = row["team"].strip()

    return alias

def normalize_team(
    name,
    alias
):

    original = name

    name = " ".join(
        name.split()
    )

    if name in alias:
        name = alias[name]

    name = name.strip()

    if original != name:
        print(
            f"alias変換: [{original}] → [{name}]"
        )

    return name

# =====================================
# 設定読み込み
# =====================================

def load_config():

    importance = {}
    age_factor = {}

    rows = read_csv(
        CONFIG_FILE
    )

    for row in rows:

        if row["type"] == "importance":

            importance[
                row["keyword"]
            ] = float(
                row["value"]
            )

        elif row["type"] == "age":

            age_factor[
                row["keyword"]
            ] = float(
                row["value"]
            )

    return importance, age_factor

# =====================================
# 大会重要度取得
# =====================================

def get_importance(
    tournament,
    importance,
    age_factor
):

    base = 5
    age = 1.0

    for key,value in importance.items():

        keywords = key.split("|")

        for keyword in keywords:

            if keyword.lower() in tournament.lower():

                base = value
                break

    for key,value in age_factor.items():

        if key.lower() in tournament.lower():

            age = value
            break

    return base * age

# =====================================
# 期待値計算
# =====================================

def expected(
    my_point,
    opponent_point
):

    d = opponent_point - my_point

    return 1 / (
        math.pow(
            10,
            d / 600
        )
        +
        1
    )

# =====================================
# 勝敗係数
# =====================================

def result_value(
    my_score,
    opponent_score
):

    if my_score > opponent_score:
        return 1

    elif my_score == opponent_score:
        return 0.5

    else:
        return 0

# =====================================
# 点差係数
# =====================================

def margin_factor(
    diff
):

    if diff <= 0:
        return 1.0

    if diff >= 5:
        return 1.5

    return 1.0 + (
        diff * 0.1
    )

# =====================================
# 計算済み試合取得
# =====================================

def load_processed_games():

    processed = set()

    if not os.path.exists(
        HISTORY_FILE
    ):

        return processed

    rows = read_csv(
        HISTORY_FILE
    )

    for row in rows:

        if "game_id" in row:

            processed.add(
                row["game_id"]
            )

    return processed

# =====================================
# デイリーランキング保存
# =====================================
def save_daily_ranking(ratings, date):

    file_exists = os.path.exists(
        DAILY_HISTORY_FILE
    )

    # ⬇️【高速化修正】全行読み込みをやめ、末尾だけをピンポイントで読む
    if file_exists and os.path.getsize(DAILY_HISTORY_FILE) > 0:
        try:
            with open(DAILY_HISTORY_FILE, "rb") as f:  # バイナリモードで開く
                # ファイルの末尾から100バイト程度手前にシーク（移動）する
                f.seek(0, os.SEEK_END)
                file_size = f.tell()
                seek_pos = max(0, file_size - 100)
                f.seek(seek_pos)
                
                # 最後の行を切り出す
                last_line = f.readlines()[-1].decode("utf-8-sig").strip()
                if last_line:
                    # カンマで区切って最初の要素（date）を取得
                    latest_recorded_date = last_line.split(",")[0]
                    
                    # 既に記録されている日付と同じか古ければスキップ
                    if latest_recorded_date and date <= latest_recorded_date:
                        return
        except Exception:
            pass  # 万が一のエラー時は安全のため処理を続行

    with open(
        DAILY_HISTORY_FILE,
        "a",
        newline="",
        encoding="utf-8-sig"
    ) as f:

        writer = csv.writer(
            f
        )

        if not file_exists:
            writer.writerow(
                [
                    "date",
                    "rank",
                    "country",
                    "points"
                ]
            )

        ranking = sorted(
            ratings.items(),
            key=lambda x: x[1],
            reverse=True
        )

        for rank, (country, points) in enumerate(
            ranking,
            start=1
        ):

            writer.writerow(
                [
                    date,
                    rank,
                    country,
                    round(points,2)
                ]
            )

# =====================================
# 履歴ファイル準備
# =====================================

def prepare_history():

    exists = os.path.exists(
        HISTORY_FILE
    )

    f = open(
        HISTORY_FILE,
        "a",
        newline="",
        encoding="utf-8-sig"
    )

    writer = csv.writer(
        f
    )

    if not exists:

        writer.writerow([
            "date",
            "game_id",
            "team",
            "before_rank",
            "before",
            "after",
            "change",
            "opponent",
            "opponent_before",
            "result",
            "my_score",
            "opponent_score",
            "tournament",
            "importance",
            "expected"
        ])

    return f, writer

# =====================================
# 1試合計算
# =====================================

def process_game(
    game,
    ratings,
    alias,
    importance,
    age_factor,
    history_writer,
    unknown_teams
):

    game_id = str(
        game["game_id"]
    )

    tournament = game["tournament"]

    A = get_importance(
        tournament,
        importance,
        age_factor
    )

    home = normalize_team(
        game["home"],
        alias
    )

    away = normalize_team(
        game["away"],
        alias
    )

# =========================
# 未登録チームチェック
# =========================

    if home not in ratings or away not in ratings:
        print(
            f"スキップ: 未登録チーム {repr(home)} vs {repr(away)}"
        )
        print("-----")
        print(repr(home))
        print(repr(away))
        print(home in ratings)
        print(away in ratings)
        return

    home_before = ratings[home]

    away_before = ratings[away]


    # 試合前順位取得
    sorted_ratings = sorted(
        ratings.items(),
        key=lambda x: x[1],
        reverse=True
    )

    home_before_rank = next(
        i + 1
        for i, x in enumerate(sorted_ratings)
        if x[0] == home
    )

    away_before_rank = next(
        i + 1
        for i, x in enumerate(sorted_ratings)
        if x[0] == away
    )

    home_score = int(
        game["home_score"]
    )

    away_score = int(
        game["away_score"]
    )

    diff = abs(
        home_score - away_score
    )

    M = margin_factor(
        diff
    )

    # ホーム
    home_C = expected(
        home_before,
        away_before
    )

    home_B = result_value(
        home_score,
        away_score
    )

    home_change = (
        A
        *
        (home_B - home_C)
        *
        M
    )

    # アウェイ
    away_C = expected(
        away_before,
        home_before
    )

    away_B = result_value(
        away_score,
        home_score
    )

    away_change = (
        A
        *
        (away_B - away_C)
        *
        M
    )

    ratings[home] += home_change
    ratings[away] += away_change

    # 履歴保存
    history_writer.writerow([
        game["date"],
        game_id,
        home,
        home_before_rank,
        round(home_before,2),
        round(ratings[home],2),
        round(home_change,2),
        away,
        round(away_before,2),
        "W" if home_score > away_score else "L",
        home_score,
        away_score,
        tournament,
        A,
        round(home_C,4)
    ])

    history_writer.writerow([
        game["date"],
        game_id,
        away,
        away_before_rank,
        round(away_before,2),
        round(ratings[away],2),
        round(away_change,2),
        home,
        round(home_before,2),
        "W" if away_score > home_score else "L",
        away_score,
        home_score,
        tournament,
        A,
        round(away_C,4)
    ])

    print(
        f"{home} {home_score}-{away_score} {away}"
    )

    print(
        f"  {home}: "
        f"{home_before:.2f}"
        f" → "
        f"{ratings[home]:.2f}"
        f" ({home_change:+.2f})"
    )

    print(
        f"  {away}: "
        f"{away_before:.2f}"
        f" → "
        f"{ratings[away]:.2f}"
        f" ({away_change:+.2f})"
    )

# =====================================
# 新規試合処理
# =====================================

def update_ranking():

    ratings = load_ratings()
    alias = load_alias()
    importance, age_factor = load_config()
    processed_games = load_processed_games()

    print(
        f"計算済み試合数: {len(processed_games)}"
    )

    history_file, history_writer = prepare_history()

    new_games = 0

    results = []

    for result_file in RESULT_FILES:

        if not os.path.exists(result_file):
            print(
                f"ファイルなし: {result_file}"
            )
            continue

        results.extend(
            read_csv(
                result_file
            )
        )

# 試合日順に並べ替え
    results.sort(
        key=lambda x: x["date"]
    )

    #for game in results[-10:]:
    #    print(
    #        game["home"],
    #        "vs",
    #        game["away"]
    #    )

    total = len(results)
    current_date = None
    last_saved_date = None

    for index, game in enumerate(
        results,
        start=1
    ):

        game_id = str(
            game["game_id"]
        )

        if game_id in processed_games:
            continue

        # 日付が変わったら前日のランキング保存
        if current_date is not None and game["date"] != current_date:

            save_daily_ranking(
                ratings,
                current_date
            )

            last_saved_date = current_date

        current_date = game["date"]

        new_games += 1

        print(
            f"\n[{index}/{total}] 新規試合"
        )

        process_game(
            game,
            ratings,
            alias,
            importance,
            age_factor,
            history_writer,
            unknown_teams
        )

        processed_games.add(
            game_id
        )

    # 最後の日付分を保存
    if current_date is not None and current_date != last_saved_date:

        save_daily_ranking(
            ratings,
            current_date
        )

    history_file.close()

    if unknown_teams:
        print("\n未登録チーム一覧:")
        for team in sorted(unknown_teams):
            print("-", team)

    print(
        f"\n新規計算試合: {new_games}"
    )

    if new_games > 0:
        latest_date = max(
            game["date"]
            for game in results
        )

    return ratings

# =====================================
# ランキング保存
# =====================================

def save_ranking(
    ratings
):

    ranking = sorted(
        ratings.items(),
        key=lambda x: x[1],
        reverse=True
    )

    with open(
        RANKING_FILE,
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as f:

        writer = csv.writer(
            f
        )

        writer.writerow(
            [
                "rank",
                "team",
                "point"
            ]
        )

        for rank, (team, point) in enumerate(
            ranking,
            start=1
        ):

            writer.writerow(
                [
                    rank,
                    team,
                    round(point,2)
                ]
            )

    return ranking

# =====================================
# ランキング表示
# =====================================

def print_ranking(
    ranking,
    limit=20
):

    print("\n===== 最新ランキング =====")

    for rank, (team, point) in enumerate(
        ranking[:limit],
        start=1
    ):

        print(
            f"{rank:3d} "
            f"{team:30s} "
            f"{point:.2f}"
        )

# =====================================
# メイン処理
# =====================================

if __name__ == "__main__":

    # 1. ユーザーに処理モードを尋ねる
    mode = input("データを一から計算し直しますか？ (y/n): ").strip().lower()

    if mode == "y":
        print("\n--- 初期化処理を実行します ---")
        
        # 削除対象のファイル一覧
        files_to_delete = [
            RANKING_FILE,        # 現在のランキングファイル
            HISTORY_FILE,        # 試合計算済みの履歴ファイル
            DAILY_HISTORY_FILE   # 日々のランキング推移ファイル
        ]
        
        for file_path in files_to_delete:
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    print(f"削除しました: {file_path}")
                except Exception as e:
                    print(f"ファイル削除エラー ({file_path}): {e}")
        
        print("初期化が完了しました。一から計算を開始します。\n")
    else:
        print("\n既存のデータに追記します（計算済みの試合はスキップします）。\n")

    print(
        "WBSC世界ランキング更新開始"
    )

    ratings = update_ranking()
    
    ranking = save_ranking(
        ratings
    )

    print_ranking(
        ranking
    )

    print(
        "\nランキング更新完了"
    )