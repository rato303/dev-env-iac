---
name: creating-pr
description: GitHub上でプルリクエストを作成します。ユーザーが「PRを作成」「プルリクエストを作る」「変更をプッシュしてPRを開く」「コードレビューをリクエスト」「PRオープン」「pull requestを作成」と言及した場合、または明示的に変更をプッシュしてPRを作成したい場合に使用します。このプロジェクト（dev-env-iac）の規約に従ったPRタイトル、ボディ、コミットメッセージを生成します。
version: 1.0.0
tools: Read, Bash
---

# PR作成スキル

このスキルは、dev-env-iacプロジェクトでGitHub PRを作成するプロセスを自動化します。

## ワークフロー

### Phase 1: 現状確認

以下のコマンドを**並列実行**して現在の状態を把握します：

1. `git status` - 変更ファイルとステータスを確認
2. `git diff` - 未コミット変更の差分を取得（ある場合）
3. `git diff --staged` - ステージング済み変更を確認（ある場合）
4. `git branch --show-current` - 現在のブランチ名を取得
5. `git log main..HEAD --oneline` - mainから分岐後のコミット一覧

### Phase 2: コミット作成（必要な場合）

未コミットの変更がある場合：

1. **変更内容を分析**：
   - `git diff` の出力から変更の性質を判断
   - 新機能追加、バグ修正、リファクタリング、ドキュメント更新などを識別

2. **コミットメッセージを生成**：
   - 形式: 1-2文で「何を」「なぜ」変えたかを簡潔に記述
   - 日本語または英語（変更内容に応じて適切な方を選択）
   - 必ず末尾に以下を追加：
     ```
     Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
     ```

3. **コミットを作成**：
   ```bash
   git add <変更されたファイル>
   git commit -m "$(cat <<'EOF'
   <コミットメッセージ本文>

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```

4. **コミット後、再度 `git status` で確認**

### Phase 3: PRメタデータ生成

1. **全コミットを分析**：
   - `git log main..HEAD` で全コミットメッセージを取得
   - `git diff main...HEAD` でmainとの総合差分を確認

2. **PRタイトルを生成**：
   - **70文字以内**（これは厳守）
   - プレフィックスを使用：
     - `feat:` - 新機能追加
     - `fix:` - バグ修正
     - `refactor:` - リファクタリング
     - `docs:` - ドキュメント更新
     - `chore:` - ビルド、設定変更
   - 例: `feat: CLAUDE.mdリファクタリングとPR作成スキル追加`

3. **PRボディを生成**：
   ```markdown
   ## Summary
   - <変更点1の要約>
   - <変更点2の要約>
   - <変更点3の要約>（最大3つ）

   ## Test plan
   - [ ] <検証項目1>
   - [ ] <検証項目2>
   - [ ] <検証項目3>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

### Phase 4: プッシュとPR作成

1. **リモートブランチの確認**：
   - `git rev-parse --abbrev-ref --symbolic-full-name @{u}` でトラッキングブランチを確認
   - 存在しない場合は `-u` オプション付きでプッシュ

2. **プッシュ実行**：
   ```bash
   # トラッキングブランチがない場合
   git push -u origin <現在のブランチ名>
   
   # トラッキングブランチがある場合
   git push
   ```

3. **PR作成**：
   ```bash
   gh pr create --title "<PRタイトル>" --body "$(cat <<'EOF'
   <PRボディ>
   EOF
   )"
   ```

4. **PR URLを返却**：
   - コマンド成功後、PR URLを表示
   - ユーザーに「PRを作成しました: <URL>」と報告

## エラーハンドリング

### 変更がない場合
- `git status` が "nothing to commit, working tree clean" を返す場合
- メッセージ: 「コミットする変更がありません。PRを作成するには、まずファイルを変更してください。」

### リモートブランチが存在しない場合
- 自動的に `git push -u origin <branch>` を実行
- 初回プッシュであることをユーザーに通知

### gh CLI未インストール
- `gh` コマンドが存在しない場合
- メッセージ: 「GitHub CLIがインストールされていません。`gh auth login` を実行してください。」

### コンフリクトがある場合
- `git push` がコンフリクトで失敗した場合
- メッセージ: 「リモートブランチとのコンフリクトがあります。`git pull --rebase` を実行して解決してください。」

### mainブランチで実行された場合
- 現在のブランチが `main` の場合
- メッセージ: 「mainブランチから直接PRは作成できません。フィーチャーブランチを作成してください。」
- 提案: 「`git checkout -b feature/<機能名>` でブランチを作成しますか？」

## プロジェクト固有の規約

### 言語
- **コミットメッセージ**: 日本語または英語（変更内容に応じて）
- **PR本文**: 日本語または英語
- **コード**: 英語識別子、日本語コメント（CLAUDE.mdの規約に準拠）

### タグ戦略
- このスキルはGit操作のみを扱うため、インフラリソースのタグは関与しない
- ただし、Pulumiコードを変更する場合は、タグの一貫性維持を意識

### ベースブランチ
- デフォルト: `main`
- プロジェクトによって異なる場合は、`git symbolic-ref refs/remotes/origin/HEAD` で確認

### Co-Authored-By タグ
- **必須**: 全てのコミットに `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>` を追加
- Claude Codeが生成したコミットであることを明示

## 使用例

### 例1: 未コミット変更からPR作成

**ユーザー**: "CLAUDE.mdを修正したので、PRを作成してください"

**スキルの動作**:
1. `git status` → CLAUDE.md が modified
2. `git diff CLAUDE.md` → 差分を分析
3. コミットメッセージ生成: "docs: CLAUDE.mdをAIエージェント基本方針に特化"
4. `git add CLAUDE.md` + `git commit`
5. PRタイトル生成: "docs: CLAUDE.mdリファクタリング"
6. PRボディ生成（Summary + Test plan）
7. `git push -u origin feature/claude-md-refactor`
8. `gh pr create ...`
9. "PRを作成しました: https://github.com/user/repo/pull/123"

### 例2: 既にコミット済みの変更からPR作成

**ユーザー**: "この変更でプルリクエストを作って"

**スキルの動作**:
1. `git status` → nothing to commit
2. `git log main..HEAD` → 既存コミットを確認
3. PRタイトル生成（既存コミットから推測）
4. PRボディ生成
5. `git push`
6. `gh pr create ...`
7. "PRを作成しました: https://github.com/user/repo/pull/124"

### 例3: 変更がない場合

**ユーザー**: "PRを作成して"

**スキルの動作**:
1. `git status` → nothing to commit, working tree clean
2. `git log main..HEAD` → no commits
3. メッセージ: "コミットする変更がありません。PRを作成するには、まずファイルを変更してください。"

## 参考資料

詳細なワークフローとコマンドリファレンスは `references/workflow.md` を参照してください。
