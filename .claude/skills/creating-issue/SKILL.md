---
name: creating-issue
description: GitHub上でissueを作成します。ユーザーが「issueを作成」「GitHub issueを作る」「バグを報告」「機能リクエストを登録」「タスクを登録」「課題を登録」と言及した場合、または明示的にissueを作成したい場合に使用します。ファイル内容からissueを生成することも可能です。このプロジェクト（dev-env-iac）の規約に従ったissueタイトルとボディを生成します。
version: 1.0.0
tools: Read, Bash
---

# Issue作成スキル

このスキルは、dev-env-iacプロジェクトでGitHub issueを作成するプロセスを自動化します。

## ワークフロー

### Phase 1: issue内容の準備

#### ケース1: ユーザーから直接指示がある場合

**ユーザーの入力例**:
- "「CLAUDE.md整備」というタイトルでissueを作成"
- "バグ報告: AMI検索が失敗する"
- "機能追加: カスタムAMIベイク機構の実装"

**処理**:
1. ユーザーが指定したタイトルを使用
2. 詳細な本文が必要な場合はユーザーに確認
3. 適切なテンプレートを選択（Bug/Feature/Task）

#### ケース2: ファイルから生成する場合

**ユーザーの入力例**:
- "/tmp/work-summary.md の内容でissueを作成"
- "このファイルをissueにして"

**処理**:
1. **ファイルを読み込み**: `Read` ツールでファイル内容を取得
2. **内容を分析**:
   - ファイル内の見出しから適切なタイトルを生成
   - 本文全体を issue本文として使用（必要に応じて整形）
3. **issueタイプを判定**:
   - 「バグ」「エラー」「問題」→ Bug Report
   - 「機能」「追加」「実装」→ Feature Request
   - 「タスク」「TODO」「作業」→ Task
   - 「ドキュメント」「文書」「README」→ Documentation
   - その他 → フリーフォーム

### Phase 2: issueテンプレートの適用

#### Bug Reportテンプレート

```markdown
## 問題の説明
<バグの概要>

## 再現手順
1. <手順1>
2. <手順2>
3. <手順3>

## 期待される動作
<本来の動作>

## 実際の動作
<現在の動作>

## 環境
- OS: 
- ツール: 
- バージョン: 

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

#### Feature Requestテンプレート

```markdown
## 機能の概要
<追加したい機能の説明>

## 背景・目的
<なぜこの機能が必要か>

## 提案する実装
<どのように実装するか>

## 代替案
<他に考えられるアプローチ>

## 優先度
- [ ] High
- [ ] Medium
- [ ] Low

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

#### Taskテンプレート

```markdown
## タスクの概要
<実施すべき作業の説明>

## 背景
<なぜこのタスクが必要か>

## 実施内容
- [ ] <サブタスク1>
- [ ] <サブタスク2>
- [ ] <サブタスク3>

## 完了条件
- [ ] <条件1>
- [ ] <条件2>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

#### Documentationテンプレート

```markdown
## 変更内容
<ドキュメントの変更概要>

## 対象ファイル
- [ ] <ファイル1>
- [ ] <ファイル2>
- [ ] <ファイル3>

## 目的
<なぜこのドキュメント変更が必要か>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

#### フリーフォームテンプレート

ファイル内容をそのまま使用、末尾にフッターのみ追加：

```markdown
<ファイル内容>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Phase 3: issueメタデータの設定

1. **ラベルの設定**:
   - Bug Report → `bug`
   - Feature Request → `enhancement`
   - Task → `task`
   - Documentation → `documentation`
   - ファイルから生成 → 内容に応じて自動判定

2. **アサイニーの設定** (オプション):
   - ユーザーが指定した場合のみ設定
   - デフォルトは未設定

3. **マイルストーンの設定** (オプション):
   - ユーザーが指定した場合のみ設定
   - デフォルトは未設定

### Phase 4: GitHub issue作成

1. **gh CLIで issue作成**:
   ```bash
   gh issue create \
     --title "<issueタイトル>" \
     --body "$(cat <<'EOF'
<issue本文>
EOF
)" \
     --label "<ラベル>"
   ```

2. **issue番号とURLを取得**:
   - コマンド出力からissue番号を抽出
   - issue URLを返却

3. **ユーザーに報告**:
   - "issueを作成しました: <URL>"
   - issue番号も表示

## エラーハンドリング

### gh CLI未インストール

**検出方法**:
```bash
command -v gh >/dev/null 2>&1
```

**エラーメッセージ**:
```
GitHub CLIがインストールされていません。
以下のコマンドでインストールしてください:

Ubuntu/Debian:
  sudo apt install gh

macOS:
  brew install gh

インストール後、以下のコマンドで認証してください:
  gh auth login
```

### 認証エラー

**検出方法**:
```bash
gh auth status
```

**エラーメッセージ**:
```
GitHub CLIが認証されていません。
以下のコマンドで認証してください:

  gh auth login

ブラウザが開き、GitHubアカウントで認証を行います。
```

### リポジトリ未検出

**検出方法**:
```bash
git rev-parse --is-inside-work-tree
```

**エラーメッセージ**:
```
現在のディレクトリはGitリポジトリではありません。
Gitリポジトリのルートディレクトリで実行してください。
```

### ファイルが存在しない

**ユーザーがファイルを指定したが存在しない場合**:

**エラーメッセージ**:
```
指定されたファイルが見つかりません: <ファイルパス>

ファイルパスを確認してください。
```

### 空のファイル

**ファイル内容が空の場合**:

**エラーメッセージ**:
```
指定されたファイルは空です: <ファイルパス>

issueを作成するには、ファイルに内容を記述してください。
```

## 使用例

### 例1: ユーザーが直接指定する場合

**ユーザー**: "「CLAUDE.md整備とPR作成スキル実装」というタイトルでissueを作成して"

**スキルの動作**:
1. タイトル: "CLAUDE.md整備とPR作成スキル実装"
2. 本文をユーザーに確認（または簡潔な本文を自動生成）
3. Taskテンプレートを適用
4. ラベル: `task`
5. `gh issue create ...`
6. "issueを作成しました: https://github.com/user/repo/issues/1"

### 例2: ファイルから生成する場合

**ユーザー**: "/tmp/work-summary-20260524-083217.md の内容でissueを作成して"

**スキルの動作**:
1. ファイルを `Read` ツールで読み込み
2. 内容を分析:
   - タイトル: ファイル内の最初の見出し（例: "作業サマリー: CLAUDE.md整備とPR作成スキル実装"）
   - 本文: ファイル内容全体
3. issueタイプ判定: Task（「作業」「実施内容」等のキーワードから）
4. フリーフォームテンプレート適用（ファイル内容をそのまま使用）
5. ラベル: `task`, `documentation`
6. `gh issue create ...`
7. "issueを作成しました: https://github.com/user/repo/issues/2"

### 例3: バグ報告の場合

**ユーザー**: "AMI検索が失敗するバグを報告したい"

**スキルの動作**:
1. タイトル: "バグ: AMI検索が失敗する"
2. Bug Reportテンプレートを適用
3. ユーザーに詳細を確認:
   - 再現手順
   - 期待される動作
   - 実際の動作
   - 環境情報
4. ラベル: `bug`
5. `gh issue create ...`
6. "issueを作成しました: https://github.com/user/repo/issues/3"

## プロジェクト固有の規約

### issueタイトル形式

- **簡潔かつ具体的**: 何の issue かが一目で分かる
- **プレフィックス** (オプション):
  - `バグ:` - バグ報告
  - `機能:` - 機能追加リクエスト
  - `タスク:` - 作業タスク
  - `ドキュメント:` - ドキュメント更新

**良い例**:
- ✅ "CLAUDE.md整備とPR作成スキル実装"
- ✅ "バグ: AMI検索でtry-catchエラーハンドリングが不足"
- ✅ "機能: カスタムAMIベイク機構の実装"

**悪い例**:
- ❌ "修正" (何を修正するか不明)
- ❌ "新しい機能" (どんな機能か不明)
- ❌ "TODO" (具体性がない)

### ラベル戦略

| ラベル | 用途 |
|-------|------|
| `bug` | バグ報告 |
| `enhancement` | 機能追加・改善 |
| `task` | 作業タスク |
| `documentation` | ドキュメント更新 |
| `question` | 質問・相談 |
| `help wanted` | 協力を求める |
| `good first issue` | 初心者向け |

### ファイルからissue生成時の注意点

- ファイル内容が長い場合（5000文字以上）は、要約を作成
- マークダウン形式を維持
- コードブロックがある場合は、そのまま転載
- 画像リンクがある場合は、相対パスを絶対パスに変換

## 参考資料

詳細なワークフローとコマンドリファレンスは `references/workflow.md` を参照してください。
