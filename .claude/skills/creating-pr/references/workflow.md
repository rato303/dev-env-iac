# PR作成ワークフロー詳細

このドキュメントは、create-prスキルで使用するGit/GitHubコマンドとプロジェクト固有の規約を詳細に記述します。

## Git コマンドリファレンス

### ステータス確認

```bash
# 現在の変更を確認
git status

# 未コミット変更の差分
git diff

# ステージング済み変更の差分
git diff --staged

# 特定ファイルの差分
git diff <file-path>
```

### ブランチ操作

```bash
# 現在のブランチ名取得
git branch --show-current

# トラッキングブランチの確認
git rev-parse --abbrev-ref --symbolic-full-name @{u}

# デフォルトブランチの確認（origin/HEADが設定されている場合）
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'

# より確実な方法（origin/HEAD未設定でも動作）
git remote show origin | grep 'HEAD branch' | cut -d' ' -f5

# mainから分岐後のコミット一覧
git log main..HEAD

# mainから分岐後のコミット一覧（1行表示）
git log main..HEAD --oneline

# mainとの差分
git diff main...HEAD
```

### コミット作成

```bash
# ファイルをステージング
git add <file1> <file2> ...

# 全ての変更をステージング（注意: 機密ファイルに注意）
git add -A

# HEREDOCを使ったコミット（複数行メッセージ）
git commit -m "$(cat <<'EOF'
コミットメッセージ本文

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**重要な注意事項**:
- `git add -A` は使用を避け、具体的なファイル名を指定する
- `.env`、`*.pem`、`*.key` などの機密ファイルを誤ってコミットしない
- コミットメッセージは必ず `Co-Authored-By` タグを含める

### プッシュ

```bash
# 初回プッシュ（トラッキングブランチ設定付き）
git push -u origin <branch-name>

# 既存ブランチへプッシュ
git push

# 強制プッシュ（mainブランチでは絶対に使用しない）
git push --force-with-lease
```

**重要な注意事項**:
- `--force` や `--force-with-lease` は、ユーザーが明示的に要求した場合のみ使用
- `main` または `master` ブランチへの強制プッシュは禁止

### コミット履歴の確認

```bash
# コミット履歴（詳細）
git log

# コミット履歴（1行表示）
git log --oneline

# 最新5件のコミット
git log -n 5

# 特定ブランチとの差分コミット
git log main..HEAD

# グラフ表示
git log --graph --oneline --all
```

## GitHub CLI コマンド

### 認証確認

```bash
# GitHub CLIの認証状態確認
gh auth status

# ログイン（初回のみ）
gh auth login
```

### PR作成

```bash
# 基本形式
gh pr create --title "<タイトル>" --body "<本文>"

# HEREDOCを使った複数行本文
gh pr create --title "タイトル" --body "$(cat <<'EOF'
## Summary
- 変更点1
- 変更点2

## Test plan
- [ ] テスト項目1
- [ ] テスト項目2

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# ドラフトPRとして作成
gh pr create --title "タイトル" --body "..." --draft

# ベースブランチを指定
gh pr create --title "タイトル" --body "..." --base develop
```

### PR確認

```bash
# 現在のブランチのPRを表示
gh pr view

# PR一覧
gh pr list

# 特定のPRを表示
gh pr view 123

# PRのURLを取得
gh pr view --json url -q .url
```

### PR操作

```bash
# PRをマージ
gh pr merge 123

# PRをクローズ
gh pr close 123

# PRを再オープン
gh pr reopen 123

# レビューリクエスト
gh pr ready 123
```

## プロジェクト規約（dev-env-iac）

### PRタイトル形式

**基本ルール**:
- 70文字以内（厳守）
- プレフィックスを使用してカテゴリ分類
- 簡潔かつ具体的に

**プレフィックス一覧**:

| プレフィックス | 用途 | 例 |
|---------------|------|-----|
| `feat:` | 新機能追加 | `feat: Pulumiプロジェクトテンプレート追加` |
| `fix:` | バグ修正 | `fix: AMI検索エラーハンドリング修正` |
| `refactor:` | リファクタリング | `refactor: modules/ec2.tsのタグロジック整理` |
| `docs:` | ドキュメント更新 | `docs: CLAUDE.md規約セクション追加` |
| `chore:` | ビルド、設定変更 | `chore: .gitignoreにPulumiスタック追加` |
| `test:` | テスト追加・修正 | `test: AMIフォールバックのテスト追加` |
| `style:` | コードスタイル修正 | `style: TypeScript lintエラー修正` |

**良い例**:
- ✅ `feat: PR作成スキル実装とCLAUDE.md日本語化`
- ✅ `fix: Makefile downターゲットにxargs -rフラグ追加`
- ✅ `docs: README.mdの用語を「副業」から「複数プロジェクト」に統一`

**悪い例**:
- ❌ `update files` (何を更新したか不明)
- ❌ `feat: 新しい機能を追加しました。これにより開発者はより簡単に...` (長すぎる)
- ❌ `Fix bug` (どのバグか不明、小文字で始まっている)

### PRボディテンプレート

```markdown
## Summary
- <変更内容の要約1>
- <変更内容の要約2>
- <変更内容の要約3>

## Test plan
- [ ] <検証手順1>
- [ ] <検証手順2>
- [ ] <検証手順3>

## Related issues
<!-- 関連するissueがあれば記載 -->
- Closes #123
- Relates to #456

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**セクション説明**:

1. **Summary**:
   - 1-3個の箇条書き
   - 「何を」変更したかを簡潔に
   - 技術的な詳細は不要（コードレビューで確認可能）

2. **Test plan**:
   - マークダウンチェックリスト形式
   - レビュアーが検証すべき項目
   - 手動テスト、自動テスト、動作確認など

3. **Related issues** (オプション):
   - 関連するissueをリンク
   - `Closes #123` でissueを自動クローズ
   - `Relates to #456` で関連付けのみ

4. **フッター**:
   - Claude Codeで生成されたことを明示
   - 絵文字とリンク付き

### コミットメッセージ規約

**基本ルール**:
- 1-2文で簡潔に
- 「何を」「なぜ」変えたかを記述
- 日本語または英語（変更内容に応じて）
- 必ず `Co-Authored-By` タグを含める

**フォーマット**:
```
<変更内容の簡潔な説明（1文）>

<詳細説明（オプション）>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**良い例**:
```
feat: PR作成スキルを実装

SKILL.mdとreferences/workflow.mdを追加。
GitHub PR作成プロセスを自動化。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
docs: CLAUDE.mdをAIエージェント基本方針に特化

詳細なコマンドリファレンスを削除し、プロジェクトの性質と
重要な設計原則に焦点を当てた内容に変更。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**悪い例**:
```
Update files
```
（何を更新したか不明、Co-Authored-Byタグがない）

```
fix: バグ修正
```
（どのバグか不明、詳細不足）

### ブランチ命名規約

**推奨パターン**:
- `feature/<機能名>`: 新機能開発
- `fix/<バグ名>`: バグ修正
- `refactor/<対象>`: リファクタリング
- `docs/<ドキュメント名>`: ドキュメント更新

**例**:
- `feature/pulumi-template`
- `feature/pr-creation-skill`
- `fix/ami-search-error`
- `refactor/ec2-tags`
- `docs/claude-md-improvement`

**避けるべき例**:
- `test` (何のテストか不明)
- `update` (何を更新するか不明)
- `my-branch` (内容が分からない)

## ワークフロー例

### 完全なPR作成フロー

```bash
# 1. 現在の状態確認
git status
git diff
git log main..HEAD --oneline

# 2. 変更をステージング（未コミットの場合）
git add CLAUDE.md README.md

# 3. コミット作成
git commit -m "$(cat <<'EOF'
docs: CLAUDE.mdとREADME.mdの用語統一

「副業」という表現を「複数プロジェクト」に変更し、
より汎用的な表現に統一。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# 4. プッシュ（初回）
git push -u origin feature/terminology-update

# 5. PR作成
gh pr create --title "docs: 用語統一（副業→複数プロジェクト）" --body "$(cat <<'EOF'
## Summary
- CLAUDE.mdの「副業ベースで複数案件」を「複数プロジェクト」に変更
- README.mdも同様に統一
- プロジェクトの本質的な特徴は維持

## Test plan
- [ ] CLAUDE.mdとREADME.mdで用語が統一されていることを確認
- [ ] 他のドキュメントとの矛盾がないことを確認

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## トラブルシューティング

### gh CLIが認証されていない

**エラー**:
```
To get started with GitHub CLI, please run: gh auth login
```

**解決方法**:
```bash
gh auth login
# プロンプトに従って認証
```

### リモートブランチとのコンフリクト

**エラー**:
```
! [rejected] feature-branch -> feature-branch (non-fast-forward)
```

**解決方法**:
```bash
# リベースで解決
git pull --rebase origin feature-branch

# コンフリクトがあれば解決
# ファイルを編集後
git add <resolved-files>
git rebase --continue

# 再度プッシュ
git push
```

### mainブランチで作業している

**エラー**:
```
error: You are on branch 'main'
```

**解決方法**:
```bash
# 新しいブランチを作成
git checkout -b feature/new-feature

# 作業を続行
```

## 関連リンク

- [GitHub CLI マニュアル](https://cli.github.com/manual/)
- [Git コマンドリファレンス](https://git-scm.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
