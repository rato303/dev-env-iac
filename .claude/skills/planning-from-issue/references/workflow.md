# Issue作業計画生成ワークフロー詳細

このドキュメントは、planning-from-issueスキルで使用するGitHub CLI / Git コマンドとプロジェクト固有の規約を詳細に記述します。

## GitHub CLI コマンド

### Issue情報の取得

```bash
# 基本形式
gh issue view {issue番号}

# JSON形式で特定フィールドを取得
gh issue view {issue番号} --json number,title,body,labels,state,url,milestone

# 実行例
gh issue view 4 --json number,title,body,labels,state,url --jq '{number: .number, title: .title, body: .body[0:200], labels: [.labels[].name], state: .state, url: .url}'
```

**出力例**:
```json
{
  "number": 4,
  "title": "機能: issueから作業計画を作成するスキル実装",
  "body": "## 機能の概要\nGitHub issueの内容から、実装の作業計画を生成するスキルを実装します。\n\n## 背景・目的\nissueに記載された要件から、実装手順や必要なファイル変更を自動的に計画することで...",
  "labels": [],
  "state": "OPEN",
  "url": "https://github.com/rato303/dev-env-iac/issues/4"
}
```

### Issueリスト取得

```bash
# 全てのオープンissue
gh issue list

# クローズ済みissue含む
gh issue list --state all

# JSON形式
gh issue list --json number,title,state,labels --jq '.[] | {number: .number, title: .title, state: .state, labels: [.labels[].name]}'
```

### Issue編集

```bash
# 本文を編集
gh issue edit {issue番号} --body "新しい本文"

# タイトルを編集
gh issue edit {issue番号} --title "新しいタイトル"

# ラベルを追加
gh issue edit {issue番号} --add-label "bug,enhancement"
```

## Git コマンド

### ブランチ確認

```bash
# 現在のブランチ確認
git branch --show-current

# 全ブランチ一覧
git branch -a

# リモートブランチのみ
git branch -r
```

### 作業ツリー状態確認

```bash
# 短縮形式
git status --short

# ポーセリン形式（スクリプト向け）
git status --porcelain
```

**出力例**:
```
 M .claude/skills/planning-from-issue/SKILL.md
?? .claude/skills/planning-from-issue/references/workflow.md
```

### Gitリポジトリ確認

```bash
# リポジトリ内かどうか
git rev-parse --is-inside-work-tree

# リポジトリルートパス取得
git rev-parse --show-toplevel
```

## プランファイル生成アルゴリズム

### Slugify アルゴリズム

```bash
# タイトルをファイル名用slugに変換
slugify() {
  local title="$1"
  echo "$title" | \
    tr '[:upper:]' '[:lower:]' | \
    sed 's/[^a-z0-9]/-/g' | \
    sed 's/--*/-/g' | \
    sed 's/^-//;s/-$//' | \
    cut -c1-50
}

# 使用例
TITLE="機能: issueから作業計画を作成するスキル実装"
SLUG=$(slugify "$TITLE")
echo "$SLUG"
# 出力: "planning-from-issue-skill"
```

### Issueタイプ判定アルゴリズム

```bash
detect_issue_type() {
  local labels="$1"
  local title="$2"
  local body="$3"
  
  # ラベル優先
  if echo "$labels" | grep -q "bug"; then
    echo "bug"
    return
  fi
  
  if echo "$labels" | grep -q "enhancement"; then
    echo "enhancement"
    return
  fi
  
  if echo "$labels" | grep -q "task\|documentation"; then
    echo "task"
    return
  fi
  
  # キーワード分析
  local text="$title $body"
  
  if echo "$text" | grep -iq "バグ\|エラー\|問題\|修正\|bug\|error\|fix"; then
    echo "bug"
    return
  fi
  
  if echo "$text" | grep -iq "機能\|追加\|実装\|新規\|feature\|add\|implement"; then
    echo "enhancement"
    return
  fi
  
  if echo "$text" | grep -iq "タスク\|TODO\|作業\|整備\|task\|work"; then
    echo "task"
    return
  fi
  
  # デフォルト
  echo "generic"
}

# 使用例
TYPE=$(detect_issue_type "" "機能: issueから作業計画を作成するスキル実装" "## 機能の概要...")
echo "$TYPE"
# 出力: "enhancement"
```

### ファイルパス抽出アルゴリズム

```bash
extract_file_paths() {
  local body="$1"
  
  # パターン1: インラインコード `path/to/file.ext`
  echo "$body" | grep -oP '`[a-zA-Z0-9_\-\/\.]+\.(ts|md|yaml|yml|json|sh|py|js)`' | sed 's/`//g'
  
  # パターン2: Markdownリンク [text](./path/to/file)
  echo "$body" | grep -oP '\]\((\./[a-zA-Z0-9_\-\/\.]+)\)' | sed 's/](\(.*\))/\1/'
  
  # パターン3: コードブロック内のパス（簡易版）
  # コードブロック内の ./ で始まる行
  echo "$body" | awk '/```/,/```/ {print}' | grep -oP '\.\/[a-zA-Z0-9_\-\/\.]+\.(ts|md|yaml|yml|json|sh|py|js)'
}

# 使用例
BODY="## 提案する実装
- [ ] \`.claude/skills/planning-from-issue/SKILL.md\` の作成
- [ ] [workflow](./references/workflow.md) の作成"

extract_file_paths "$BODY"
# 出力:
# .claude/skills/planning-from-issue/SKILL.md
# ./references/workflow.md
```

### パターン検出と類似ファイル検索

```bash
find_similar_files() {
  local title="$1"
  local body="$2"
  local text="$title $body"
  
  # Skillパターン
  if echo "$text" | grep -iq "skill\|スキル"; then
    echo "# Skill pattern detected"
    find /home/ubuntu/dev-env-iac/.claude/skills -name "SKILL.md" -type f 2>/dev/null
    return
  fi
  
  # Pulumiパターン
  if echo "$text" | grep -iq "pulumi\|infrastructure\|インフラ\|IaC"; then
    echo "# Pulumi pattern detected"
    find /home/ubuntu/dev-env-iac/iac/pulumi -name "*.ts" -type f 2>/dev/null | head -10
    return
  fi
  
  # Ansibleパターン
  if echo "$text" | grep -iq "ansible\|provisioning\|プロビジョニング"; then
    echo "# Ansible pattern detected"
    find /home/ubuntu/dev-env-iac/iac/ansible/roles -type d -mindepth 1 -maxdepth 1 2>/dev/null
    return
  fi
  
  # デフォルト: ドキュメントファイル
  echo "# Generic pattern - checking documentation"
  find /home/ubuntu/dev-env-iac -name "*.md" -type f -not -path "*/node_modules/*" 2>/dev/null | head -10
}

# 使用例
TITLE="機能: issueから作業計画を作成するスキル実装"
BODY="GitHub issueの内容から、実装の作業計画を生成するスキルを実装します。"

find_similar_files "$TITLE" "$BODY"
# 出力:
# # Skill pattern detected
# /home/ubuntu/dev-env-iac/.claude/skills/creating-issue/SKILL.md
# /home/ubuntu/dev-env-iac/.claude/skills/creating-pr/SKILL.md
# /home/ubuntu/dev-env-iac/.claude/skills/responding-review/SKILL.md
```

## プランファイル構造テンプレート

### Generic Template（基本形）

```markdown
# Issue #{number}: {title} - 実装プラン

## Context

- **Issue**: #{number} - {url}
- **Title**: {title}
- **Labels**: {labels}
- **State**: {state}

### Issue Body Summary
{issue本文の要約}

## Requirements Analysis

### Functional Requirements
- [ ] {requirement 1}
- [ ] {requirement 2}

### Acceptance Criteria
- [ ] {criteria 1}
- [ ] {criteria 2}

### Constraints
- {constraint 1}

## Architecture Design

### Files to Create
- \`path/to/file.md\` - Purpose: {reasoning}

### Files to Modify
- \`path/to/existing.ts\` - Changes: {reasoning}

### Key Algorithms/Approaches
- {approach 1}

### Integration Points
- {integration 1}

## Implementation Steps

### Phase 1: {phase name}
**Goal**: {goal}

**Tasks**:
1. {task 1}
2. {task 2}

**Files**:
- \`file1.md\`
- \`file2.ts\`

**Commands**:
\`\`\`bash
{command 1}
\`\`\`

### Phase 2: {phase name}
...

### Phase 3: {phase name}
...

### Phase 4: {phase name}
...

## Testing Strategy

### Unit Tests
- {test 1}

### Integration Tests
- {test 1}

### Manual Verification
- [ ] {verification step 1}
- [ ] {verification step 2}

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| {risk 1} | {impact} | {mitigation} |

## Dependencies

### External Dependencies
- {dependency 1}

### Internal Dependencies
- Related Issue: #{issue_number}

## Estimated Complexity

- **Complexity**: Low / Medium / High
- **Files Changed**: ~{number}
- **New Files**: ~{number}
- **Testing Effort**: Low / Medium / High

## Execution Metadata

- **State**: pending
- **Current Phase**: 0
- **Branch**: feature/{slug}
- **Files Modified**: []
- **Commits**: []
- **Last Updated**: {timestamp}

### Phase Checklist
- [ ] Phase 1: {phase name}
- [ ] Phase 2: {phase name}
- [ ] Phase 3: {phase name}
- [ ] Phase 4: {phase name}

---

🤖 Generated by planning-from-issue skill | Issue #{number}
```

### Bug Report Template（追加セクション）

Generic Templateに以下を追加:

```markdown
## Bug Analysis

### Root Cause Hypothesis
{issue本文の「実際の動作」セクションから推測}

### Reproduction Steps (from issue)
1. {step 1}
2. {step 2}

### Expected vs Actual Behavior
- **Expected**: {issue本文の「期待される動作」}
- **Actual**: {issue本文の「実際の動作」}

### Proposed Fix
- Approach: {fix approach}
- Files to modify: {files}

## Regression Prevention

### Tests to Add
- [ ] Test for reproduction scenario
- [ ] Edge case: {edge case 1}

### Code Review Checklist
- [ ] Error handling added
- [ ] Edge cases covered
- [ ] Similar code patterns checked
```

### Feature Request Template（追加セクション）

Generic Templateに以下を追加:

```markdown
## Design Considerations

### API Design (if applicable)
{API structure}

### User Experience
- User workflow: {workflow description}
- Edge cases: {edge cases}

### Backward Compatibility
- **Breaking changes**: {list or "None"}
- **Migration path**: {approach or "N/A"}
- **Deprecation strategy**: {strategy or "N/A"}

### Alternative Approaches (from issue)
{issue本文の「代替案」セクション}

**Rationale for chosen approach**: {reasoning}

### Performance Considerations
- Expected impact: {description}
- Optimization strategy: {strategy}
```

### Task Template（追加セクション）

Generic Templateに以下を追加:

```markdown
## Task Breakdown

### Subtasks (from issue)
{issue本文のチェックボックスを抽出}

- [ ] {subtask 1}
- [ ] {subtask 2}
- [ ] {subtask 3}

### Dependencies Between Subtasks
- {subtask A} depends on {subtask B}
- {subtask C} blocks {subtask D}

### Completion Criteria (from issue)
{issue本文の「完了条件」セクション}

- [ ] {criteria 1}
- [ ] {criteria 2}

### Timeline Estimate
- Subtask 1: {estimate}
- Subtask 2: {estimate}
- Total: {total estimate}
```

## 完全なワークフロー例

### Issue #4 からプラン生成

```bash
# 1. Issue情報取得（並列実行）
gh issue view 4 --json number,title,body,labels,state,url,milestone &
PID1=$!

git branch --show-current &
PID2=$!

git status --short &
PID3=$!

# 待機
wait $PID1 $PID2 $PID3

# 2. Issue情報を変数に格納
ISSUE_JSON=$(gh issue view 4 --json number,title,body,labels,state,url)
ISSUE_NUM=$(echo "$ISSUE_JSON" | jq -r '.number')
ISSUE_TITLE=$(echo "$ISSUE_JSON" | jq -r '.title')
ISSUE_BODY=$(echo "$ISSUE_JSON" | jq -r '.body')
ISSUE_LABELS=$(echo "$ISSUE_JSON" | jq -r '[.labels[].name] | join(",")')
ISSUE_STATE=$(echo "$ISSUE_JSON" | jq -r '.state')
ISSUE_URL=$(echo "$ISSUE_JSON" | jq -r '.url')

CURRENT_BRANCH=$(git branch --show-current)

# 3. エラーチェック: 本文が短すぎる
BODY_LENGTH=${#ISSUE_BODY}
if [ "$BODY_LENGTH" -lt 50 ]; then
  echo "Error: Issue body too short ($BODY_LENGTH characters)"
  exit 1
fi

# 4. Issueタイプ判定
ISSUE_TYPE=$(detect_issue_type "$ISSUE_LABELS" "$ISSUE_TITLE" "$ISSUE_BODY")
echo "Issue type: $ISSUE_TYPE"

# 5. Slugify
slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//' | cut -c1-50
}

SLUG=$(slugify "$ISSUE_TITLE")
echo "Slug: $SLUG"

# 6. プランファイルパス
PLAN_FILE="$HOME/.claude/plans/issue-${ISSUE_NUM}-${SLUG}.md"

# 7. ファイル存在チェック
if [ -f "$PLAN_FILE" ]; then
  echo "Plan file already exists: $PLAN_FILE"
  echo "Options:"
  echo "1. Overwrite"
  echo "2. Create versioned (v2)"
  echo "3. Cancel"
  read -p "Select option [1/2/3]: " OPTION
  
  case "$OPTION" in
    2)
      PLAN_FILE="$HOME/.claude/plans/issue-${ISSUE_NUM}-${SLUG}-v2.md"
      ;;
    3)
      echo "Cancelled."
      exit 0
      ;;
  esac
fi

# 8. ファイルパス抽出
FILE_PATHS=$(extract_file_paths "$ISSUE_BODY")
echo "File paths mentioned: $FILE_PATHS"

# 9. 類似ファイル検索
SIMILAR_FILES=$(find_similar_files "$ISSUE_TITLE" "$ISSUE_BODY")
echo "Similar files found:"
echo "$SIMILAR_FILES"

# 10. プランファイル生成（Writeツール使用）
# ... プラン内容を生成してファイルに書き込み ...

# 11. 出力
echo ""
echo "Plan created: $PLAN_FILE"
echo ""
echo "Summary:"
echo "- Files to create: 2"
echo "- Files to modify: 0"
echo "- Implementation phases: 4"
echo "- Complexity: Medium"
echo ""
echo "Next steps:"
echo "1. Review plan: cat $PLAN_FILE"
echo "2. Edit plan if needed"
echo "3. Start implementation: git checkout -b feature/$SLUG"
echo "4. Or execute with Issue #5 skill (when available)"
echo ""
echo "Suggested branch: feature/$SLUG"
```

## トラブルシューティング

### GitHub CLI 認証エラー

**エラー**:
```
To get started with GitHub CLI, please run: gh auth login
```

**解決方法**:
```bash
gh auth login
# プロンプトに従って認証
# - GitHub.com を選択
# - HTTPS を選択
# - Authenticate Git with GitHub credentials: Yes
# - ブラウザで認証
```

### Issueが見つからない

**エラー**:
```
issue not found
```

**確認事項**:
1. Issue番号が正しいか確認
2. リポジトリが正しいか確認: `git remote -v`
3. Issueがクローズされていないか確認: `gh issue list --state all`

### プランファイル作成に失敗

**エラー**:
```
Permission denied: /home/ubuntu/.claude/plans/issue-4-...
```

**解決方法**:
```bash
# ディレクトリが存在するか確認
ls -la ~/.claude/plans/

# ディレクトリがない場合は作成
mkdir -p ~/.claude/plans/

# 権限を確認
ls -ld ~/.claude/plans/

# 権限を修正（必要に応じて）
chmod 755 ~/.claude/plans/
```

### Git リポジトリエラー

**エラー**:
```
fatal: not a git repository
```

**解決方法**:
```bash
# リポジトリルートに移動
cd /home/ubuntu/dev-env-iac

# または適切なプロジェクトディレクトリに移動
cd /path/to/your/project

# 再度スキルを実行
/planning-from-issue 4
```

### Issue本文が空

**症状**: Issue本文が空またはNULL

**対処**:
```bash
# Issue本文を確認
gh issue view 4 --json body --jq '.body'

# 空の場合は編集
gh issue edit 4 --body "$(cat <<'EOF'
## 機能の概要
...

## 背景・目的
...
EOF
)"
```

## 重要な注意事項

### プランファイルの管理

1. **場所**: `~/.claude/plans/` はユーザーレベル、リポジトリ外
2. **Git管理対象外**: プランファイルはgitにコミットしない
3. **バックアップ**: 重要なプランは手動でバックアップ推奨
4. **クリーンアップ**: 古いプランは定期的に削除推奨

### Slugify の制限

- 最大50文字に制限
- 日本語は全て削除される（ハイフンに変換）
- 結果として読みにくいslugになる場合がある

**例**:
```
"機能: issueから作業計画を作成するスキル実装"
→ "planning-from-issue-skill"
（日本語部分が消えて意味が取りにくい）
```

**対策**: プランファイル内の先頭に元のタイトルを必ず含める

### Issue #5 との連携

プランファイルの `## Execution Metadata` セクションは Issue #5（作業計画実行スキル）が読み取ります。

**重要なフィールド**:
- `State`: pending / in-progress / completed
- `Current Phase`: 0-4
- `Files Modified`: 変更ファイルリスト
- `Commits`: コミットハッシュリスト
- `Phase Checklist`: 各フェーズの完了状態

Issue #5 未実装の現時点では、このセクションは将来の拡張のために含めます。

## 関連リンク

- [GitHub CLI マニュアル](https://cli.github.com/manual/)
- [GitHub REST API - Issues](https://docs.github.com/en/rest/issues)
- [Git 公式ドキュメント](https://git-scm.com/doc)
- [jq マニュアル](https://stedolan.github.io/jq/manual/)
