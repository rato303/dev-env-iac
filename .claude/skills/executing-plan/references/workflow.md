# 作業計画実行ワークフロー詳細

このドキュメントは、executing-planスキルで使用するプランファイル解析方法とプロジェクト固有の規約を詳細に記述します。

## プランファイル解析

### メタデータ抽出

```bash
# プランファイルから実行メタデータを抽出
parse_metadata() {
  local plan_file="$1"
  
  # 状態を取得（メタデータセクションをフェーズチェックリストまで動的抽出）
  STATE=$(awk '/^## 実行メタデータ/,/^### フェーズチェックリスト/' "$plan_file" | grep "^\- \*\*状態\*\*:" | sed 's/.*状態\*\*:\s*//' | tr -d ' ')
  
  # 現在のフェーズを取得
  CURRENT_PHASE=$(awk '/^## 実行メタデータ/,/^### フェーズチェックリスト/' "$plan_file" | grep "^\- \*\*現在のフェーズ\*\*:" | sed 's/.*現在のフェーズ\*\*:\s*//' | tr -d ' ')
  
  # ブランチ名を取得
  BRANCH=$(awk '/^## 実行メタデータ/,/^### フェーズチェックリスト/' "$plan_file" | grep "^\- \*\*ブランチ\*\*:" | sed 's/.*ブランチ\*\*:\s*//' | tr -d ' ')
  
  # 変更ファイルを取得
  FILES_MODIFIED=$(awk '/^## 実行メタデータ/,/^### フェーズチェックリスト/' "$plan_file" | grep "^\- \*\*変更ファイル\*\*:" | sed 's/.*変更ファイル\*\*:\s*//')
  
  # コミットを取得
  COMMITS=$(awk '/^## 実行メタデータ/,/^### フェーズチェックリスト/' "$plan_file" | grep "^\- \*\*コミット\*\*:" | sed 's/.*コミット\*\*:\s*//')
  
  echo "State: $STATE"
  echo "Phase: $CURRENT_PHASE"
  echo "Branch: $BRANCH"
  echo "Files: $FILES_MODIFIED"
  echo "Commits: $COMMITS"
}

# 使用例
PLAN_FILE="$HOME/.claude/plans/issue-4-planning-from-issue-skill.md"
parse_metadata "$PLAN_FILE"
```

**出力例**:
```
State: pending
Phase: 0
Branch: feature/planning-from-issue-skill
Files: []
Commits: []
```

### フェーズ情報抽出

```bash
# 特定のフェーズを抽出
extract_phase() {
  local plan_file="$1"
  local phase_num="$2"
  local next_phase=$((phase_num + 1))
  
  # Phase セクションを抽出
  if [ "$phase_num" -eq 4 ]; then
    # Phase 4 は最後なので、次のセクションまで
    awk "/^### Phase ${phase_num}:/,/^## [^#]/" "$plan_file"
  else
    # Phase 1-3 は次のPhaseまで
    awk "/^### Phase ${phase_num}:/,/^### Phase ${next_phase}:/" "$plan_file" | head -n -1
  fi
}

# Goal を抽出
extract_goal() {
  local phase_content="$1"
  echo "$phase_content" | grep "^\*\*目標\*\*:" | sed 's/\*\*目標\*\*:\s*//'
}

# Tasks を抽出
extract_tasks() {
  local phase_content="$1"
  echo "$phase_content" | awk '/^\*\*タスク\*\*:/,/^\*\*ファイル\*\*:/' | grep -E '^\d+\.'
}

# Files を抽出
extract_files() {
  local phase_content="$1"
  echo "$phase_content" | awk '/^\*\*ファイル\*\*:/,/^\*\*コマンド\*\*:/' | grep '^\- '
}

# Commands を抽出（コードブロック記法を除外）
extract_commands() {
  local phase_content="$1"
  echo "$phase_content" | awk '
    /^\*\*コマンド\*\*:/ { in_section=1; next }
    /^### Phase [0-9]:/ { exit }
    in_section && /^```/ { in_code=!in_code; next }
    in_section && in_code { print }
  '
}

# 使用例
PLAN_FILE="$HOME/.claude/plans/issue-4-planning-from-issue-skill.md"
PHASE_CONTENT=$(extract_phase "$PLAN_FILE" 1)

GOAL=$(extract_goal "$PHASE_CONTENT")
TASKS=$(extract_tasks "$PHASE_CONTENT")
FILES=$(extract_files "$PHASE_CONTENT")
COMMANDS=$(extract_commands "$PHASE_CONTENT")

echo "Phase 1 Goal: $GOAL"
echo "Tasks: $TASKS"
echo "Files: $FILES"
echo "Commands: $COMMANDS"
```

### フェーズチェックリスト確認

```bash
# 完了したフェーズをカウント
count_completed_phases() {
  local plan_file="$1"
  grep -c "^\- \[x\] Phase" "$plan_file"
}

# 特定のフェーズが完了しているか確認
is_phase_completed() {
  local plan_file="$1"
  local phase_num="$2"
  
  if grep -q "^\- \[x\] Phase ${phase_num}:" "$plan_file"; then
    echo "yes"
  else
    echo "no"
  fi
}

# 使用例
PLAN_FILE="$HOME/.claude/plans/issue-4-planning-from-issue-skill.md"
COMPLETED=$(count_completed_phases "$PLAN_FILE")
echo "Completed phases: $COMPLETED / 4"

PHASE1_DONE=$(is_phase_completed "$PLAN_FILE" 1)
echo "Phase 1 completed: $PHASE1_DONE"
```

## メタデータ更新

### 状態更新

```bash
# 状態を更新
update_state() {
  local plan_file="$1"
  local new_state="$2"
  
  # バックアップ作成
  cp "$plan_file" "${plan_file}.bak"
  
  # sedで状態を更新
  sed -i "s/^\- \*\*状態\*\*: .*/- **状態**: $new_state/" "$plan_file"
  
  # 検証
  if grep -q "^\- \*\*状態\*\*: $new_state" "$plan_file"; then
    echo "State updated: $new_state"
    rm "${plan_file}.bak"
    return 0
  else
    echo "Error: State update failed"
    mv "${plan_file}.bak" "$plan_file"
    return 1
  fi
}

# 使用例
PLAN_FILE="$HOME/.claude/plans/issue-4-planning-from-issue-skill.md"
update_state "$PLAN_FILE" "in-progress"
```

### フェーズ番号更新

```bash
# 現在のフェーズを更新
update_current_phase() {
  local plan_file="$1"
  local new_phase="$2"
  
  sed -i "s/^\- \*\*現在のフェーズ\*\*: .*/- **現在のフェーズ**: $new_phase/" "$plan_file"
  echo "Current phase updated: $new_phase"
}

# 使用例
PLAN_FILE="$HOME/.claude/plans/issue-4-planning-from-issue-skill.md"
update_current_phase "$PLAN_FILE" 2
```

### ファイルリスト更新

```bash
# 変更ファイルを追加
add_modified_file() {
  local plan_file="$1"
  local file_path="$2"
  
  # 現在のファイルリストを取得
  FILES=$(grep "^\- \*\*変更ファイル\*\*:" "$plan_file" | sed 's/.*変更ファイル\*\*:\s*//')
  
  # 新しいファイルを追加
  if [ "$FILES" = "[]" ]; then
    NEW_FILES="[\"$file_path\"]"
  else
    # JSON配列形式で追加
    NEW_FILES=$(echo "$FILES" | sed "s/\]$/, \"$file_path\"]/" | sed 's/\[, /[/')
  fi
  
  sed -i "s|^\- \*\*変更ファイル\*\*: .*|- **変更ファイル**: $NEW_FILES|" "$plan_file"
  echo "File added: $file_path"
}

# 使用例
PLAN_FILE="$HOME/.claude/plans/issue-4-planning-from-issue-skill.md"
add_modified_file "$PLAN_FILE" ".claude/skills/executing-plan/SKILL.md"
```

### コミットハッシュ追加

```bash
# コミットハッシュを追加
add_commit() {
  local plan_file="$1"
  local commit_hash="$2"
  
  # 現在のコミットリストを取得
  COMMITS=$(grep "^\- \*\*コミット\*\*:" "$plan_file" | sed 's/.*コミット\*\*:\s*//')
  
  # 新しいコミットを追加
  if [ "$COMMITS" = "[]" ]; then
    NEW_COMMITS="[\"$commit_hash\"]"
  else
    NEW_COMMITS=$(echo "$COMMITS" | sed "s/\]$/, \"$commit_hash\"]/" | sed 's/\[, /[/')
  fi
  
  sed -i "s|^\- \*\*コミット\*\*: .*|- **コミット**: $NEW_COMMITS|" "$plan_file"
  echo "Commit added: $commit_hash"
}

# 使用例
PLAN_FILE="$HOME/.claude/plans/issue-4-planning-from-issue-skill.md"
COMMIT_HASH=$(git log -1 --format=%H)
add_commit "$PLAN_FILE" "$COMMIT_HASH"
```

### 最終更新日時更新

```bash
# 最終更新日時を更新
update_timestamp() {
  local plan_file="$1"
  local timestamp=$(date -Iseconds)
  
  sed -i "s|^\- \*\*最終更新\*\*: .*|- **最終更新**: $timestamp|" "$plan_file"
  echo "Timestamp updated: $timestamp"
}

# 使用例
PLAN_FILE="$HOME/.claude/plans/issue-4-planning-from-issue-skill.md"
update_timestamp "$PLAN_FILE"
```

### フェーズチェックリスト更新

```bash
# フェーズにチェックマークを付ける
mark_phase_completed() {
  local plan_file="$1"
  local phase_num="$2"
  
  sed -i "s/^\- \[ \] Phase ${phase_num}:/- [x] Phase ${phase_num}:/" "$plan_file"
  echo "Phase $phase_num marked as completed"
}

# 使用例
PLAN_FILE="$HOME/.claude/plans/issue-4-planning-from-issue-skill.md"
mark_phase_completed "$PLAN_FILE" 1
```

## 完全なワークフロー例

### Issue #4 のプランを実行

```bash
#!/bin/bash

# 0. 設定
PLAN_FILE="$HOME/.claude/plans/issue-4-planning-from-issue-skill.md"

# 1. プランファイル読み込み
if [ ! -f "$PLAN_FILE" ]; then
  echo "Error: Plan file not found: $PLAN_FILE"
  exit 1
fi

# 2. メタデータ解析
STATE=$(awk '/^## 実行メタデータ/,/^### フェーズチェックリスト/' "$PLAN_FILE" | grep "^\- \*\*状態\*\*:" | sed 's/.*状態\*\*:\s*//' | tr -d ' ')
CURRENT_PHASE=$(awk '/^## 実行メタデータ/,/^### フェーズチェックリスト/' "$PLAN_FILE" | grep "^\- \*\*現在のフェーズ\*\*:" | sed 's/.*現在のフェーズ\*\*:\s*//' | tr -d ' ')
BRANCH=$(awk '/^## 実行メタデータ/,/^### フェーズチェックリスト/' "$PLAN_FILE" | grep "^\- \*\*ブランチ\*\*:" | sed 's/.*ブランチ\*\*:\s*//' | tr -d ' ')

echo "Plan file: $PLAN_FILE"
echo "State: $STATE"
echo "Current phase: $CURRENT_PHASE"
echo "Branch: $BRANCH"
echo ""

# 3. 状態チェック
if [ "$STATE" = "completed" ]; then
  echo "Error: Plan is already completed"
  exit 1
fi

# 4. ブランチ確認・切り替え
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "Switching to branch: $BRANCH"
  
  # ブランチが存在するか確認
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout "$BRANCH"
  else
    git checkout -b "$BRANCH"
  fi
fi

# 5. 開始フェーズ決定
START_PHASE=$((CURRENT_PHASE + 1))
if [ "$START_PHASE" -lt 1 ]; then
  START_PHASE=1
fi

echo "Starting from Phase $START_PHASE"
echo ""

# 6. 状態を in-progress に更新
if [ "$STATE" = "pending" ]; then
  sed -i "s/^\- \*\*状態\*\*: .*/- **状態**: in-progress/" "$PLAN_FILE"
  echo "State updated: in-progress"
fi

# 7. フェーズを順次実行（フェーズ数を動的に取得）
MAX_PHASE=$(grep -c "^### Phase " "$PLAN_FILE")
for PHASE_NUM in $(seq $START_PHASE $MAX_PHASE); do
  echo "=========================================="
  echo "Phase $PHASE_NUM"
  echo "=========================================="
  
  # フェーズ内容を抽出
  if [ "$PHASE_NUM" -eq 4 ]; then
    PHASE_CONTENT=$(awk "/^### Phase ${PHASE_NUM}:/,/^## [^#]/" "$PLAN_FILE")
  else
    NEXT_PHASE=$((PHASE_NUM + 1))
    PHASE_CONTENT=$(awk "/^### Phase ${PHASE_NUM}:/,/^### Phase ${NEXT_PHASE}:/" "$PLAN_FILE" | head -n -1)
  fi
  
  # Goal を表示
  GOAL=$(echo "$PHASE_CONTENT" | grep "^\*\*目標\*\*:" | sed 's/\*\*目標\*\*:\s*//')
  echo "Goal: $GOAL"
  echo ""
  
  # Tasks を表示
  echo "Tasks:"
  echo "$PHASE_CONTENT" | awk '/^\*\*タスク\*\*:/,/^\*\*ファイル\*\*:/' | grep -E '^\d+\.'
  echo ""
  
  # ユーザー確認
  read -p "Execute Phase $PHASE_NUM? [y/n]: " CONFIRM
  if [ "$CONFIRM" != "y" ]; then
    echo "Cancelled."
    exit 0
  fi
  
  # ここで実際の実装作業を行う
  # （Claude が自動的にファイル作成・編集を行う）
  echo "Executing Phase $PHASE_NUM..."
  
  # （実装作業の例）
  # - ファイル作成
  # - ファイル編集
  # - コマンド実行
  
  # フェーズ完了後、メタデータ更新
  sed -i "s/^\- \*\*現在のフェーズ\*\*: .*/- **現在のフェーズ**: $PHASE_NUM/" "$PLAN_FILE"
  sed -i "s/^\- \[ \] Phase ${PHASE_NUM}:/- [x] Phase ${PHASE_NUM}:/" "$PLAN_FILE"
  
  TIMESTAMP=$(date -Iseconds)
  sed -i "s|^\- \*\*最終更新\*\*: .*|- **最終更新**: $TIMESTAMP|" "$PLAN_FILE"
  
  echo "Phase $PHASE_NUM completed."
  echo ""
done

# 8. 全フェーズ完了
echo "=========================================="
echo "All phases completed!"
echo "=========================================="

# 状態を completed に更新
sed -i "s/^\- \*\*状態\*\*: .*/- **状態**: completed/" "$PLAN_FILE"

# サマリー表示
COMPLETED_PHASES=$(grep -c "^\- \[x\] Phase" "$PLAN_FILE")
FILES_STR=$(grep "^\- \*\*変更ファイル\*\*:" "$PLAN_FILE" | sed 's/.*変更ファイル\*\*:\s*//')
if [ "$FILES_STR" = "[]" ]; then
  FILES_COUNT=0
else
  FILES_COUNT=$(echo "$FILES_STR" | grep -o ',' | wc -l)
  FILES_COUNT=$((FILES_COUNT + 1))
fi

echo "Summary:"
echo "- Completed phases: $COMPLETED_PHASES / $MAX_PHASE"
echo "- Files modified: $FILES_COUNT"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff main"
echo "2. Create PR: /creating-pr"
```

## プランファイル形式仕様

### 必須セクション

プランファイルには以下のセクションが必須です：

```markdown
# Issue #{番号}: {タイトル} - 実装プラン

## コンテキスト
（Issue情報）

## 要件分析
（要件）

## アーキテクチャ設計
（設計）

## 実装ステップ

### Phase 1: {フェーズ名}
**目標**: {goal}

**タスク**:
1. {task 1}
2. {task 2}

**ファイル**:
- `file1.md`
- `file2.ts`

**コマンド**:
```bash
{command}
```

### Phase 2: {フェーズ名}
...

### Phase 3: {フェーズ名}
...

### Phase 4: {フェーズ名}
...

## テスト戦略
（テスト）

## リスクと対策
（リスク）

## 複雑度見積もり
（複雑度）

## 実行メタデータ

- **状態**: pending / in-progress / completed
- **現在のフェーズ**: 0 / 1 / 2 / 3 / 4
- **ブランチ**: feature/{slug}
- **変更ファイル**: []
- **コミット**: []
- **最終更新**: {ISO8601}

### フェーズチェックリスト
- [ ] Phase 1: {phase name}
- [ ] Phase 2: {phase name}
- [ ] Phase 3: {phase name}
- [ ] Phase 4: {phase name}

---

🤖 Generated by planning-from-issue skill | Issue #{number}
```

### メタデータフィールド詳細

#### 状態 (State)

- **pending**: 未開始（プラン生成直後）
- **in-progress**: 実行中（少なくとも1フェーズ開始済み）
- **completed**: 完了（全フェーズ完了）

#### 現在のフェーズ (Current Phase)

- **0**: 未開始
- **1-4**: 実行中または完了したフェーズ番号

#### ブランチ (Branch)

- feature ブランチ名（例: `feature/planning-from-issue-skill`）
- プラン実行時に自動的にこのブランチに切り替えまたは作成

#### 変更ファイル (Files Modified)

- JSON配列形式: `["file1.md", "file2.ts"]`
- 各フェーズで変更されたファイルを追記

#### コミット (Commits)

- JSON配列形式: `["abc123...", "def456..."]`
- 各フェーズでコミットを作成した場合、ハッシュを追記

#### 最終更新 (Last Updated)

- ISO8601形式: `2026-05-24T10:30:00+00:00`
- メタデータ更新時に自動更新

## トラブルシューティング

### メタデータ解析エラー

**症状**: メタデータセクションが見つからない

**原因**: プランファイル形式が不正

**対処**:
```bash
# 必須セクションの存在確認
grep -q "^## 実行メタデータ" "$PLAN_FILE"
if [ $? -ne 0 ]; then
  echo "Error: Invalid plan format - missing metadata section"
  exit 1
fi
```

### メタデータ更新失敗

**症状**: sed による更新が反映されない

**原因**: 正規表現パターンの不一致

**対処**:
```bash
# 更新前にバックアップ
cp "$PLAN_FILE" "${PLAN_FILE}.bak"

# 更新
sed -i "s/pattern/replacement/" "$PLAN_FILE"

# 検証
if ! grep -q "expected" "$PLAN_FILE"; then
  echo "Error: Update failed, restoring backup"
  mv "${PLAN_FILE}.bak" "$PLAN_FILE"
fi
```

### ブランチ切り替えエラー

**症状**: ブランチが存在しない

**対処**:
```bash
# ブランチ存在確認
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
else
  echo "Creating new branch: $BRANCH"
  git checkout -b "$BRANCH"
fi
```

### フェーズ実行中断

**症状**: フェーズ実行中にエラー

**対処**:
1. メタデータは既に更新されているか確認
2. 未更新の場合、手動で Current Phase を更新
3. スキルを再実行して続きから再開

## 重要な注意事項

### プランファイルの手動編集

プランファイルを手動編集する場合：

1. **メタデータ形式を維持**: フィールド名、フォーマットを変更しない
2. **JSON配列形式を維持**: `[]` または `["item1", "item2"]`
3. **ISO8601形式を維持**: `YYYY-MM-DDTHH:MM:SS+00:00`

### 並行実行の制限

- 同じプランファイルを複数のセッションで同時実行しない
- メタデータの競合が発生する可能性

### バックアップ推奨

- 重要なプランはバックアップを取ってから実行
- `.bak` ファイルを自動生成（更新時）

## 関連リンク

- [planning-from-issue スキル](../planning-from-issue/SKILL.md)
- [CLAUDE.md プロジェクト規約](/home/ubuntu/dev-env-iac/CLAUDE.md)
- [Git 公式ドキュメント](https://git-scm.com/doc)
