# コミット作成ワークフロー詳細

このドキュメントは、committing スキルで使用する Git コマンドとプロジェクト固有の規約を詳細に記述します。

## Git コマンドリファレンス

### 変更内容の確認

```bash
# 現在の変更を確認
git status

# 未コミット変更の要約
git status --short

# ステージング済み変更の差分
git diff --staged

# 未ステージング変更の差分
git diff

# 特定ファイルの差分
git diff <file-path>

# 統計情報付き差分
git diff --stat
git diff --staged --stat
```

### ファイルのステージング

```bash
# 特定ファイルをステージング
git add <file-path>

# 複数ファイルを一度にステージング
git add file1.md file2.ts file3.yaml

# 変更されたファイルをすべてステージング（新規ファイル除く）
git add -u

# 全ての変更をステージング（新規ファイル含む）
git add -A

# インタラクティブステージング（Claude Codeでは使用不可）
# git add -i
```

### コミット作成

```bash
# HEREDOCでコミットメッセージを渡す（推奨）
git commit -m "$(cat <<'EOF'
feat: コミット作成スキル追加

- SKILL.md: スキル定義作成
- workflow.md: ワークフローリファレンス作成

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"

# 簡単なメッセージの場合
git commit -m "feat: コミット作成スキル追加

Co-Authored-By: Claude Code <noreply@anthropic.com>"

# コミットハッシュ取得
git log -1 --format=%H

# コミットハッシュ（短縮版）
git log -1 --format=%h

# コミットの詳細表示
git log -1
```

## コミットメッセージ生成アルゴリズム

### アルゴリズム1: プレフィックス判定

```bash
#!/bin/bash

# 変更ファイルを取得
STAGED_FILES=$(git diff --staged --name-only)
UNSTAGED_FILES=$(git diff --name-only)
ALL_FILES="${STAGED_FILES}${UNSTAGED_FILES}"

# 新規ファイルの判定
NEW_FILES=$(git status --short | grep '^??' | awk '{print $2}')

# プレフィックス判定
PREFIX=""

if [ -n "$NEW_FILES" ]; then
  # 新規ファイルがある場合
  PREFIX="feat"
elif echo "$ALL_FILES" | grep -q '\.md$' && [ $(echo "$ALL_FILES" | wc -l) -eq $(echo "$ALL_FILES" | grep '\.md$' | wc -l) ]; then
  # .mdファイルのみの変更
  PREFIX="docs"
elif echo "$ALL_FILES" | grep -qE 'test|spec'; then
  # テストファイルの変更
  PREFIX="test"
elif echo "$ALL_FILES" | grep -qE 'package\.json|Makefile|\.config'; then
  # 設定ファイルの変更
  PREFIX="chore"
elif git diff --staged | grep -qE '^\+.*fix|^\+.*bug|^\+.*error'; then
  # コミット内容に "fix", "bug", "error" が含まれる
  PREFIX="fix"
elif git diff --staged | grep -qE '^\-.*function|^\-.*class' && git diff --staged | grep -qE '^\+.*function|^\+.*class'; then
  # 関数やクラスの書き換え（リファクタリング）
  PREFIX="refactor"
else
  # デフォルト（内容を見て最適なものを選ぶ）
  PREFIX="feat"
fi

echo "$PREFIX"
```

### アルゴリズム2: サマリー生成

```bash
#!/bin/bash

# 変更ファイル数
FILE_COUNT=$(git diff --staged --name-only | wc -l)

# 主要な変更ファイル（最大3つ）
MAIN_FILES=$(git diff --staged --name-only | head -3)

# 変更行数
ADDITIONS=$(git diff --staged --numstat | awk '{sum+=$1} END {print sum}')
DELETIONS=$(git diff --staged --numstat | awk '{sum+=$2} END {print sum}')

# サマリー生成
if [ $FILE_COUNT -eq 1 ]; then
  SUMMARY=$(echo "$MAIN_FILES" | sed 's|.*/||' | sed 's|\..*||')
  echo "${PREFIX}: ${SUMMARY}実装"
elif [ $FILE_COUNT -le 3 ]; then
  SUMMARY=$(echo "$MAIN_FILES" | tr '\n' ',' | sed 's|,|、|g' | sed 's|、$||')
  echo "${PREFIX}: ${SUMMARY}更新"
else
  SUMMARY="${FILE_COUNT}ファイル更新"
  echo "${PREFIX}: ${SUMMARY}"
fi
```

### アルゴリズム3: 本文生成

```bash
#!/bin/bash

# 変更ファイル一覧
FILES=$(git diff --staged --name-only)

# 各ファイルの変更内容をサマリー化
BODY=""
for FILE in $FILES; do
  # ファイル名
  FILENAME=$(basename "$FILE")
  
  # 追加/削除行数
  STATS=$(git diff --staged --numstat "$FILE" | awk '{print "+"$1" -"$2}')
  
  # 簡易的な変更内容判定
  if git diff --staged "$FILE" | grep -q '^+++.*'; then
    CHANGE="新規作成"
  elif [ $(git diff --staged --numstat "$FILE" | awk '{print $1-$2}') -gt 0 ]; then
    CHANGE="機能追加"
  else
    CHANGE="修正"
  fi
  
  BODY="${BODY}- ${FILENAME}: ${CHANGE}\n"
done

echo -e "$BODY"
```

### 統合: 完全なコミットメッセージ生成

```bash
#!/bin/bash

# 1. プレフィックス判定
PREFIX=$(determine_prefix)

# 2. サマリー生成
SUMMARY=$(generate_summary)

# 3. 本文生成
BODY=$(generate_body)

# 4. Co-Authored-Byタグ追加
CO_AUTHORED="Co-Authored-By: Claude Code <noreply@anthropic.com>"

# 5. 完全なメッセージ構築
COMMIT_MESSAGE="${PREFIX}: ${SUMMARY}

${BODY}

${CO_AUTHORED}"

# 6. コミット実行
git commit -m "$COMMIT_MESSAGE"
```

## プロジェクト規約（dev-env-iac）

### コミットメッセージ規約

#### プレフィックス

| プレフィックス | 用途 | 例 |
|------------|------|-----|
| `feat:` | 新機能追加 | `feat: コミット作成スキル追加` |
| `fix:` | バグ修正 | `fix: レビュー指摘対応 - タグ定義の明確化` |
| `refactor:` | リファクタリング | `refactor: コミットメッセージ生成ロジック改善` |
| `docs:` | ドキュメント更新 | `docs: CLAUDE.md更新` |
| `chore:` | ビルド、設定変更 | `chore: package.json更新` |
| `test:` | テスト追加・修正 | `test: コミット作成スキルのテスト追加` |

#### 本文形式

```
<プレフィックス>: <サマリー（1行）>

- <ファイル名1>: <変更内容1>
- <ファイル名2>: <変更内容2>
- <ファイル名3>: <変更内容3>

Co-Authored-By: Claude Code <noreply@anthropic.com>
```

**良い例**:
```
feat: コミット作成スキル追加

- SKILL.md: スキル定義作成
- workflow.md: ワークフローリファレンス作成

Co-Authored-By: Claude Code <noreply@anthropic.com>
```

**悪い例**:
```
update

Modified files
```
（プレフィックスなし、サマリー不明確、Co-Authored-Byなし）

### Co-Authored-By タグ

- **必須**: 全てのコミットに `Co-Authored-By: Claude Code <noreply@anthropic.com>` を追加
- **位置**: コミットメッセージの末尾（空行の後）
- **フォーマット**: `Co-Authored-By: Name <email>`
- **複数人**: 複数行で記述可能

### 言語選択ガイドライン

| 変更内容 | 言語 | 理由 |
|---------|------|------|
| *.mdファイルのみ | 日本語 | ドキュメントは日本語で記述 |
| スキルファイル（SKILL.md等） | 日本語 | プロジェクト規約 |
| TypeScript/Python等のコードファイル | 英語 | コード変更は英語で記述 |
| 設定ファイル（package.json等） | 英語 | 標準的な慣例 |
| 混在 | 主要な変更に合わせる | 日本語ファイルが主なら日本語 |

## ワークフロー例

### 完全なコミット作成フロー

```bash
# 1. 変更確認
git status
git diff

# 2. ステージング（必要に応じて）
git add .claude/skills/committing/SKILL.md
git add .claude/skills/committing/references/workflow.md

# 3. ステージング済み変更確認
git diff --staged

# 4. コミット作成
git commit -m "$(cat <<'EOF'
feat: コミット作成スキル追加

- SKILL.md: スキル定義作成
- workflow.md: ワークフローリファレンス作成

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"

# 5. コミットハッシュ確認
git log -1 --format=%H

# 6. コミット内容確認
git show
```

## トラブルシューティング

### Git設定エラー

**エラー**:
```
*** Please tell me who you are.

Run

  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"
```

**解決方法**:
```bash
# ユーザー名とメールアドレスを設定
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 設定確認
git config user.name
git config user.email
```

### pre-commit フック失敗

**症状**:
コミット作成時にpre-commitフックがエラーを返す

**解決方法**:
```bash
# フックの内容確認
cat .git/hooks/pre-commit

# フックを一時的にスキップ（非推奨、問題を修正すべき）
git commit --no-verify -m "..."

# 推奨: フックが指摘する問題を修正してから再度コミット
```

### 空のコミットメッセージ

**エラー**:
```
Aborting commit due to empty commit message.
```

**原因**: HEREDOCの引用符が正しくない、変数展開エラー

**解決方法**:
```bash
# シングルクォートで囲むことで変数展開を防ぐ
git commit -m "$(cat <<'EOF'
...
EOF
)"

# ダブルクォートの場合、$記号をエスケープ
git commit -m "$(cat <<EOF
Cost\$: 100
EOF
)"
```

### ステージングされていない変更

**症状**:
`git commit`実行時に「no changes added to commit」

**解決方法**:
```bash
# 変更ファイルを確認
git status

# ステージング
git add <file>

# または、全てステージング
git add -A

# コミット
git commit -m "..."
```

## 参考リンク

- [Git 公式ドキュメント - git-commit](https://git-scm.com/docs/git-commit)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Co-Authored-By トレーラー](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/creating-a-commit-with-multiple-authors)
