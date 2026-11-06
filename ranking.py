import csv
import os
import math
import json
import hashlib
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

VIDEO_FLAG_FILE = os.path.join(
    DATA_DIR,
    "video_update.flag"
)

# 試合データの前回比較用スナップショット
MATCH_SNAPSHOT_FILE = os.path.join(
    DATA_DIR,
    "match_data_snapshot.json"
)

# ランキング計算に影響する試合情報だけを比較する
MATCH_COMPARE_FIELDS = [
    "game_id",
    "tournament",
    "date",
    "home",
    "away",
    "home_score",
    "away_score",
    "status"
]

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

    tournament_lower = tournament.lower()

    for key, value in importance.items():

        # OR条件
        patterns = key.split("|")

        for pattern in patterns:

            # AND条件
            words = pattern.split("&")

            if all(
                word.lower() in tournament_lower
                for word in words
            ):
                base = value
                break
        else:
            continue

        break

    for key, value in age_factor.items():

        if key.lower() in tournament_lower:
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

    if diff >= 10:
        return 1.5

    return 1.0 + (
        diff * 0.05
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
    unknown_teams,
    normalized_teams=None
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

    if normalized_teams is None:
        home = normalize_team(
            game["home"],
            alias
        )

        away = normalize_team(
            game["away"],
            alias
        )
    else:
        home, away = normalized_teams

# =========================
# 未登録チームチェック
# =========================

    if home not in ratings or away not in ratings:
        missing_teams = []

        if home not in ratings:
            missing_teams.append(home)

        if away not in ratings:
            missing_teams.append(away)

        unknown_teams.update(missing_teams)

        print(
            f"除外理由: ランキング未登録チーム（クラブ等の可能性） "
            f"{home} vs {away}"
        )
        print(
            "  未登録: "
            + ", ".join(missing_teams)
        )
        return False

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

    home_result = result_text(
        home_score,
        away_score
    )

    away_result = result_text(
        away_score,
        home_score
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
        home_result,
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
        away_result,
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

    return True

# =====================================
# 新規試合処理
# =====================================

def update_ranking():

    ratings = load_ratings()
    alias = load_alias()
    importance, age_factor = load_config()
    processed_games = load_processed_games()
    unknown_teams.clear()

    print(
        f"計算済み試合数（履歴ファイル内）: {len(processed_games)}"
    )

    history_file, history_writer = prepare_history()

    new_games = 0

    # 除外・処理理由ごとの件数
    counts = {
        "already_processed": 0,
        "unfinished": 0,
        "unregistered_team": 0,
        "calculated": 0
    }

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
        key=lambda x: x.get("date", "")
    )

    total = len(results)
    current_date = None
    last_saved_date = None

    for index, game in enumerate(
        results,
        start=1
    ):

        game_id = str(
            game.get("game_id", "")
        ).strip()

        # 1. 過去の実行ですでに計算済みの試合
        if game_id in processed_games:
            counts["already_processed"] += 1
            continue

        # 2. 未終了・予定試合
        if game.get("status", "finished").strip().lower() != "finished":
            counts["unfinished"] += 1
            continue

        # 3. ランキング対象チームか確認
        # ratingsにはランキング対象の国・地域だけを登録しておき、
        # 片方でも未登録ならクラブ戦等として計算対象外にする。
        home = normalize_team(
            game.get("home", ""),
            alias
        )
        away = normalize_team(
            game.get("away", ""),
            alias
        )

        missing_teams = []

        if home not in ratings:
            missing_teams.append(home)

        if away not in ratings:
            missing_teams.append(away)

        if missing_teams:
            counts["unregistered_team"] += 1
            unknown_teams.update(missing_teams)

            print(
                f"\n[{index}/{total}] 除外: ランキング未登録チーム "
                f"{home} vs {away}"
            )
            print(
                "  未登録チーム: "
                + ", ".join(missing_teams)
            )
            continue

        # 日付が変わったら、直前の日付のランキングを保存。
        # 未登録チームや予定試合だけの日付では保存しない。
        if current_date is not None and game["date"] != current_date:

            save_daily_ranking(
                ratings,
                current_date
            )

            last_saved_date = current_date

        current_date = game["date"]

        print(
            f"\n[{index}/{total}] 新規試合"
        )

        processed = process_game(
            game,
            ratings,
            alias,
            importance,
            age_factor,
            history_writer,
            unknown_teams,
            normalized_teams=(home, away)
        )

        if processed:
            processed_games.add(game_id)
            new_games += 1
            counts["calculated"] += 1

    # 最後に処理した日付分を保存
    if current_date is not None and current_date != last_saved_date:

        save_daily_ranking(
            ratings,
            current_date
        )

    history_file.close()

    print("\n===== 試合処理結果 =====")
    print(f"読み込んだ試合レコード数: {total}")
    print(f"除外（計算済み）: {counts['already_processed']}")
    print(f"除外（未終了・予定試合）: {counts['unfinished']}")
    print(f"除外（ランキング未登録チーム／クラブ等の可能性）: {counts['unregistered_team']}")
    print(f"新規計算成功: {counts['calculated']}")

    if unknown_teams:
        print("\nランキング未登録チーム一覧（表記ゆれ・別名の可能性もあります）:")
        for team in sorted(unknown_teams):
            print("-", team)

    print(
        f"\n新規計算試合: {new_games}"
    )

    if new_games > 0:
        # ランキングに影響する新規試合があった場合のみ動画更新フラグを作成
        with open(
            VIDEO_FLAG_FILE,
            "w",
            encoding="utf-8"
        ) as f:
            f.write("update")

        print("動画更新フラグを作成しました")

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

# 試合結果判定
def result_text(my_score, opponent_score):

    if my_score > opponent_score:
        return "W"

    elif my_score < opponent_score:
        return "L"

    return "D"

# =====================================
# メイン処理
# =====================================

# =====================================
# 試合データ変更検知
# =====================================

def create_match_data_snapshot():

    records = []

    for result_file in RESULT_FILES:

        source_name = os.path.basename(result_file)

        if not os.path.exists(result_file):
            records.append({
                "source": source_name,
                "exists": False,
                "games": []
            })
            continue

        games = []

        with open(
            result_file,
            encoding="utf-8-sig",
            newline=""
        ) as f:

            reader = csv.DictReader(f)

            for row in reader:

                game = {
                    field: (row.get(field) or "").strip()
                    for field in MATCH_COMPARE_FIELDS
                }

                games.append(game)

        # CSVの行順が変わっただけでは変更扱いにしない
        games.sort(
            key=lambda game: (
                game["game_id"],
                game["date"],
                game["home"],
                game["away"]
            )
        )

        records.append({
            "source": source_name,
            "exists": True,
            "games": games
        })

    snapshot_text = json.dumps(
        records,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":")
    )

    return hashlib.sha256(
        snapshot_text.encode("utf-8")
    ).hexdigest()


def load_match_data_snapshot():

    if not os.path.exists(MATCH_SNAPSHOT_FILE):
        return None

    with open(
        MATCH_SNAPSHOT_FILE,
        encoding="utf-8"
    ) as f:

        data = json.load(f)

    return data.get("hash")


def save_match_data_snapshot(snapshot_hash):

    # 一時ファイルに書いてから置き換え、途中終了で壊れないようにする
    temp_file = MATCH_SNAPSHOT_FILE + ".tmp"

    with open(
        temp_file,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            {
                "hash": snapshot_hash,
                "updated_at": datetime.now().isoformat(timespec="seconds")
            },
            f,
            ensure_ascii=False,
            indent=2
        )

    os.replace(
        temp_file,
        MATCH_SNAPSHOT_FILE
    )


def reset_ranking_files():

    files_to_delete = [
        RANKING_FILE,
        HISTORY_FILE,
        DAILY_HISTORY_FILE
    ]

    for file_path in files_to_delete:

        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"初期化: {file_path}")


# =====================================
# メイン処理
# =====================================

if __name__ == "__main__":

    print("WBSC世界ランキング更新開始")

    # 今回の試合データを取得し、前回正常終了時の内容と比較
    current_snapshot = create_match_data_snapshot()
    previous_snapshot = load_match_data_snapshot()

    full_recalculation = False

    if previous_snapshot is None:

        print(
            "比較用スナップショットがありません。"
            "今回は既存ランキングを引き継いで処理します。"
        )

    elif current_snapshot != previous_snapshot:

        print("\n試合データの変更を検出しました")
        print("ランキングを最初から再計算します。")

        reset_ranking_files()
        full_recalculation = True

    else:

        print(
            "\n試合データに変更はありません。"
            "未計算の試合だけを追加計算します。"
        )

    # ランキング計算
    ratings = update_ranking()

    ranking = save_ranking(
        ratings
    )

    print_ranking(
        ranking
    )

    # 計算・ランキング保存が正常終了した場合だけ比較基準を更新
    save_match_data_snapshot(
        current_snapshot
    )

    if full_recalculation:
        print("\n変更された試合データを反映して全件再計算しました。")

    print(
        "\nランキング更新完了"
    )
