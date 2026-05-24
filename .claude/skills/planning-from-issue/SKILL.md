---
name: planning-from-issue
description: GitHub issueの内容から実装作業計画を生成します。ユーザーが「issueから作業計画」「issue {番号} の実装計画」「{番号}から計画を立てて」と言及した場合に使用します。このプロジェクト（dev-env-iac）の規約に従った構造化プランを生成します。
version: 1.0.0
tools: Read, Bash
---

# Issue作業計画生成スキル

このスキルは、dev-env-iacプロジェクトでGitHub issueの内容から実装作業計画を自動生成します。

## ワークフロー

### Phase 1: Issueデータ収集

以下のコマンドを**並列実行**してissue情報とリポジトリ状態を取得します：

1. `gh issue view {issue番号} --json number,title,body,labels,state,url,milestone` - Issue詳細を取得
2. `git branch --show-current` - 現在のブランチ名を確認
3. `git status --short` - 作業ツリー状態を確認

**出力**:
- Issue番号、タイトル、本文（Markdown）、ラベル、状態、URL
- 現在のブランチ名
- 作業ツリー状態

### Phase 2: Issue解析とプラン構造生成

1. **Issueタイプを判定**：
   - ラベルをチェック（`bug`, `enhancement`, `task`）
   - ラベルがない場合は本文キーワード分析
   - タイプ: Bug Report / Feature Request / Task / Generic

2. **要件を抽出**：
   - Markdownセクション（`##`）を解析
   - チェックボックス（`- [ ]`）をタスクリストとして抽出
   - 重要なキーワードを識別

3. **ファイルパスを抽出**：
   - インラインコード（`` `path/to/file.ts` ``）
   - コードブロック内のパス
   - Markdownリンク内のパス

4. **類似ファイルを検索**：
   - "skill" 言及 → `.claude/skills/*/SKILL.md` を検索
   - "pulumi" 言及 → `iac/pulumi/**/*.ts` を検索
   - "ansible" 言及 → `iac/ansible/roles/*` を検索

5. **プラン構造を選択**：
   - Bug Report → Root Cause Analysis, Regression Prevention
   - Feature Request → Design Considerations, Backward Compatibility
   - Task → Task Breakdown, Dependencies

### Phase 3: プランファイル生成

1. **ファイルパス生成**：
   ```bash
   ~/.claude/plans/issue-{番号}-{slug}.md
   ```
   - `{番号}`: Issue番号
   - `{slug}`: タイトルをslugify（小文字、ハイフン区切り、50文字制限）

2. **プランファイル構造**：
   ```markdown
   # Issue #{番号}: {タイトル} - 実装プラン
   
   ## Context
   - Issue情報サマリー
   
   ## Requirements Analysis
   - 機能要件
   - 受け入れ基準
   - 制約条件
   
   ## Architecture Design
   - 作成するファイル
   - 修正するファイル
   - 主要なアルゴリズム/アプローチ
   
   ## Implementation Steps
   - Phase 1: {フェーズ名}
   - Phase 2: {フェーズ名}
   - Phase 3: {フェーズ名}
   - Phase 4: {フェーズ名}
   
   ## Testing Strategy
   - Unit Tests
   - Integration Tests
   - Manual Verification
   
   ## Risks and Mitigation
   - リスク分析
   
   ## Estimated Complexity
   - 複雑度: Low / Medium / High
   - ファイル変更数
   
   ## Execution Metadata
   - State: pending
   - Current Phase: 0
   - Files Modified: []
   ```

3. **ファイル存在チェック**：
   - 既存の場合、ユーザーに確認:
     1. 上書き
     2. バージョン付き作成（`-v2.md`）
     3. キャンセル

### Phase 4: 出力とユーザーガイダンス

1. **プランファイル場所を表示**：
   ```
   Plan created: ~/.claude/plans/issue-{番号}-{slug}.md
   ```

2. **サマリー表示**：
   - Files to create: {数}
   - Files to modify: {数}
   - Implementation phases: {数}
   - Complexity: Low / Medium / High

3. **次のステップを提案**：
   ```
   Next steps:
   1. Review plan: cat ~/.claude/plans/issue-{番号}-{slug}.md
   2. Edit plan if needed
   3. Start implementation: git checkout -b feature/{slug}
   4. Or execute with Issue #5 skill (when available)
   ```

## エラーハンドリング

### Issue Not Found

**検出方法**:
```bash
# gh issue view の終了ステータスで判定（終了コード非0 = エラー）
if ! gh issue view {番号} --json number >/dev/null 2>&1; then
  # Issue が存在しない
fi
```

**エラーメッセージ**:
```
Issue #{番号} not found in this repository.

Please verify:
- Issue number is correct
- You are in the correct repository
- Issue is not deleted

Run 'gh issue list' to see available issues.
```

### Empty Issue Body

**検出方法**: Issue body が null または < 50 文字

**エラーメッセージ**:
```
Issue #{番号} has insufficient content for plan generation.

The issue body is too short or empty. Please add:
- Description of the feature/bug/task
- Requirements or acceptance criteria
- Any relevant context

Minimum recommended: 50 characters with at least one section.

Update issue: gh issue edit {番号} --body "..."
```

### Closed Issue

**検出方法**: Issue state が "CLOSED"

**エラーメッセージ**:
```
Issue #{番号} is already closed.

Do you want to:
1. Create a plan anyway (for documentation)
2. Re-open the issue: gh issue reopen {番号}
3. Cancel

Creating a plan for a closed issue may still be useful for documentation purposes.
```

### Plan File Already Exists

**検出方法**: プランファイルが既に存在

**エラーメッセージ**:
```
Plan file already exists: ~/.claude/plans/issue-{番号}-{slug}.md

Options:
1. Overwrite existing plan
2. Create versioned plan: issue-{番号}-{slug}-v2.md
3. View existing plan: cat ~/.claude/plans/issue-{番号}-{slug}.md
4. Cancel

[Select option: 1/2/3/4]
```

### GitHub CLI Not Authenticated

**検出方法**:
```bash
gh auth status 2>&1 | grep -q "not logged in"
```

**エラーメッセージ**:
```
GitHub CLI is not authenticated.

Run the following command to authenticate:
  gh auth login

Follow the prompts to complete authentication.
```

### Not in Git Repository

**検出方法**:
```bash
git rev-parse --is-inside-work-tree 2>&1
```

**エラーメッセージ**:
```
Not in a git repository.

This skill must be run from within a git repository.
Navigate to your project root directory and try again.
```

## 使用例

### 例1: Feature Request Issueから計画生成

**ユーザー**: "Issue #4から作業計画を作成して"

**スキルの動作**:
1. Issue #4 を取得:
   - Title: "機能: issueから作業計画を作成するスキル実装"
   - Labels: なし → 本文から "機能" キーワード検出 → Feature Request
   - Body: 機能の概要、背景・目的、提案する実装...

2. Issue解析:
   - Pattern: "スキル" 検出 → skill パターン
   - 参考ファイル検索: `.claude/skills/*/SKILL.md` 3件発見
   - チェックボックス抽出: 4件のサブタスク

3. プランファイル生成: `~/.claude/plans/issue-4-planning-from-issue-skill.md`
   - Context: Issue #4 情報
   - Requirements: 4つの機能要件
   - Files to create: SKILL.md, references/workflow.md
   - 4 phases: データ収集、解析、生成、出力

4. 出力:
   ```
   Plan created: ~/.claude/plans/issue-4-planning-from-issue-skill.md
   
   Summary:
   - Files to create: 2
   - Files to modify: 0
   - Implementation phases: 4
   - Complexity: Medium
   
   Next steps:
   1. Review plan: cat ~/.claude/plans/issue-4-planning-from-issue-skill.md
   2. Start implementation: git checkout -b feature/planning-from-issue-skill
   3. Or execute with Issue #5 skill (when available)
   
   Suggested branch: feature/planning-from-issue-skill
   ```

### 例2: Bug Report Issueから計画生成

**ユーザー**: "/planning-from-issue 7"

**スキルの動作**:
1. Issue #7 を取得:
   - Title: "バグ: AMI検索でエラーハンドリング不足"
   - Labels: `bug`
   - Body: 再現手順、期待される動作、実際の動作

2. Issue解析:
   - Type: Bug Report（ラベルから判定）
   - Files mentioned: `modules/ami.ts`
   - Pattern: Pulumi module

3. プラン生成:
   - Bug Report テンプレート適用
   - Root Cause Analysis セクション追加
   - Regression Prevention セクション追加

4. 出力:
   ```
   Plan created: ~/.claude/plans/issue-7-ami-error-handling-bug.md
   
   Summary:
   - Files to modify: 1 (modules/ami.ts)
   - Bug complexity: Low
   - Fix approach: Add try-catch with fallback logic
   
   Suggested branch: fix/ami-error-handling
   ```

### 例3: 空本文Issueでエラー

**ユーザー**: "Issue #10の作業計画を作成"

**スキルの動作**:
1. Issue #10 を取得:
   - Title: "タスク: リファクタリング"
   - Body: (空、0文字)

2. エラー検出: Body < 50文字

3. エラー出力:
   ```
   Issue #10 has insufficient content for plan generation.
   
   The issue body is empty. Please add:
   - Task description
   - Subtasks or checklist
   - Completion criteria
   
   Minimum recommended: 50 characters with at least one section.
   
   Update issue: gh issue edit 10 --body "..."
   ```

## プロジェクト固有の規約

### プランファイル命名規則

- **Location**: `~/.claude/plans/` (ユーザーレベル、リポジトリ外)
- **Format**: `issue-{番号}-{slug}.md`
- **Slug rules**:
  - 小文字化
  - 英数字以外をハイフンに置換
  - 連続ハイフンを1つに
  - 前後のハイフン削除
  - 最大50文字

**例**:
- "機能: issueから作業計画を作成するスキル実装" → `issue-4-planning-from-issue-skill.md`
- "バグ: AMI検索でエラー" → `issue-7-ami-error-bug.md`

### Issueタイプ判定ルール

1. **ラベル優先**:
   - `bug` → Bug Report
   - `enhancement` → Feature Request
   - `task` → Task
   - `documentation` → Task

2. **キーワード分析**（ラベルがない場合）:
   - タイトル/本文に「バグ」「エラー」「問題」「修正」→ Bug
   - 「機能」「追加」「実装」「新規」→ Feature
   - 「タスク」「TODO」「作業」「整備」→ Task

3. **デフォルト**: Generic

### プランファイル構造（必須セクション）

全てのプランファイルに以下のセクションを含める:

- `## Context` - Issue情報
- `## Requirements Analysis` - 要件
- `## Architecture Design` - 設計
- `## Implementation Steps` - 実装手順（4フェーズ）
- `## Testing Strategy` - テスト戦略
- `## Risks and Mitigation` - リスク
- `## Estimated Complexity` - 複雑度
- `## Execution Metadata` - 実行メタデータ（Issue #5用）

### Issue #5 連携用メタデータ

プランファイル末尾に以下を含める:

```markdown
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
```

Issue #5（作業計画実行スキル）がこのメタデータを読み取り、実行状態を管理します。

## 参考資料

詳細なワークフローとコマンドリファレンスは `references/workflow.md` を参照してください。
