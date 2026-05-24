# Issue作成ワークフロー詳細

このドキュメントは、creating-issueスキルで使用するGitHub CLIコマンドとプロジェクト固有の規約を詳細に記述します。

## GitHub CLI コマンド

### 認証確認

```bash
# GitHub CLIの認証状態確認
gh auth status

# ログイン（初回のみ）
gh auth login

# 認証トークンの確認
gh auth token
```

### issue作成

```bash
# 基本形式
gh issue create --title "<タイトル>" --body "<本文>"

# HEREDOCを使った複数行本文
gh issue create --title "タイトル" --body "$(cat <<'EOF'
## 問題の説明
バグの詳細...

## 再現手順
1. 手順1
2. 手順2

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# ラベル付き
gh issue create --title "タイトル" --body "本文" --label "bug,high-priority"

# アサイニー指定
gh issue create --title "タイトル" --body "本文" --assignee "@me"
gh issue create --title "タイトル" --body "本文" --assignee "username"

# マイルストーン指定
gh issue create --title "タイトル" --body "本文" --milestone "v1.0"

# 全てのオプションを組み合わせ
gh issue create \
  --title "バグ: AMI検索エラー" \
  --body "$(cat <<'EOF'
## 問題の説明
...
EOF
)" \
  --label "bug,high-priority" \
  --assignee "@me" \
  --milestone "Phase 1"
```

### issue確認

```bash
# issue一覧
gh issue list

# 自分がアサインされているissue
gh issue list --assignee "@me"

# 特定のラベルのissue
gh issue list --label "bug"

# 特定のissueを表示
gh issue view 123

# issueのURLを取得
gh issue view 123 --json url -q .url
```

### issue操作

```bash
# issueをクローズ
gh issue close 123

# issueを再オープン
gh issue reopen 123

# issueにコメント
gh issue comment 123 --body "コメント内容"

# issueを編集
gh issue edit 123 --title "新しいタイトル"
gh issue edit 123 --body "新しい本文"
gh issue edit 123 --add-label "documentation"
gh issue edit 123 --remove-label "bug"
```

### ファイルから本文を読み込む

```bash
# ファイルの内容をissue本文として使用
gh issue create --title "タイトル" --body-file /path/to/file.md

# 標準入力から本文を読み込む
cat /path/to/file.md | gh issue create --title "タイトル" --body -
```

## issueテンプレートの詳細

### Bug Reportテンプレート

**使用するケース**:
- バグ、エラー、問題の報告
- 期待される動作と実際の動作に差異がある
- 再現手順が明確

**テンプレート**:
```markdown
## 問題の説明
<バグの概要を簡潔に記述>

## 再現手順
1. <手順1>
2. <手順2>
3. <手順3>

## 期待される動作
<本来どうなるべきか>

## 実際の動作
<現在どうなっているか>

## 環境
- OS: Ubuntu 24.04 / macOS 14 / Windows 11
- ツール: Pulumi 3.113.0 / Ansible 2.15
- バージョン: Node.js 18.x

## 補足情報
<スクリーンショット、ログ、エラーメッセージなど>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**ラベル**: `bug`

### Feature Requestテンプレート

**使用するケース**:
- 新機能の追加
- 既存機能の改善
- 提案・アイデア

**テンプレート**:
```markdown
## 機能の概要
<追加・改善したい機能の説明>

## 背景・目的
<なぜこの機能が必要か、どんな問題を解決するか>

## 提案する実装
<どのように実装するか、技術的なアプローチ>

### 実装例
```typescript
// コード例（あれば）
```

## 代替案
<他に考えられるアプローチ、トレードオフ>

## 優先度
- [ ] High - 緊急、すぐに必要
- [ ] Medium - 重要だが緊急ではない
- [ ] Low - あると便利だが必須ではない

## 影響範囲
<この機能がどのコンポーネントに影響するか>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**ラベル**: `enhancement`

### Taskテンプレート

**使用するケース**:
- 作業タスク
- リファクタリング
- ドキュメント更新
- 定期的なメンテナンス

**テンプレート**:
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
- [ ] <条件3>

## 関連リソース
- 関連issue: #123
- 参考ドキュメント: [リンク]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**ラベル**: `task`

### Documentationテンプレート

**使用するケース**:
- ドキュメントの追加・更新
- README、CLAUDE.md、コメント等の改善

**テンプレート**:
```markdown
## ドキュメントの対象
<どのドキュメントを更新するか>

## 現状の問題
<現在のドキュメントの何が不足しているか>

## 追加・更新する内容
- [ ] <項目1>
- [ ] <項目2>
- [ ] <項目3>

## 完了条件
- [ ] <条件1>
- [ ] <条件2>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**ラベル**: `documentation`

## プロジェクト規約（dev-env-iac）

### issueタイトルのベストプラクティス

**基本ルール**:
- 簡潔かつ具体的（50-70文字程度）
- 何の issue かが一目で分かる
- プレフィックスはオプション（ラベルで代用可能）

**プレフィックス（オプション）**:
- `バグ:` - バグ報告
- `機能:` - 機能追加
- `タスク:` - 作業タスク
- `ドキュメント:` - ドキュメント更新
- `質問:` - 質問・相談

**良い例**:
- ✅ "CLAUDE.md整備とPR作成スキル実装"
- ✅ "バグ: AMI検索でエラーハンドリングが不足"
- ✅ "機能: カスタムAMIベイク機構の実装"
- ✅ "ドキュメント: README.mdのクイックスタート追加"

**悪い例**:
- ❌ "修正" (何を修正するか不明)
- ❌ "バグ報告です。AMI検索機能でエラーが発生して困っています。" (長すぎる)
- ❌ "issue" (内容が不明)

### ラベル戦略

| ラベル | 説明 | 使用例 |
|-------|------|--------|
| `bug` | バグ、エラー、問題 | AMI検索エラー |
| `enhancement` | 機能追加・改善 | カスタムAMIベイク機構 |
| `task` | 作業タスク | Pulumiテンプレート作成 |
| `documentation` | ドキュメント更新 | README.md更新 |
| `question` | 質問・相談 | Pulumi backend設定について |
| `help wanted` | 協力を求める | レビュー依頼 |
| `good first issue` | 初心者向け | 簡単な修正 |
| `priority: high` | 優先度高 | 緊急のバグ修正 |
| `priority: low` | 優先度低 | 将来的な改善 |

### ファイルからissue生成時のガイドライン

#### 長いファイル（5000文字以上）の場合

**要約を作成**:
1. ファイルの主要セクションを抽出
2. 詳細は「詳細は添付ファイル参照」と記載
3. 可能であれば、ファイルをGitHub Gistにアップロードしてリンク

**例**:
```markdown
## 概要
<ファイルの要約>

## 詳細
詳細は以下のファイルを参照してください:
- Gist: https://gist.github.com/...
- または、このissueにファイルを添付

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

#### マークダウン形式の維持

- 見出し（`#`, `##`, `###`）は維持
- リスト（`-`, `*`, `1.`）は維持
- コードブロック（` ``` `）は維持
- テーブルは維持

#### 相対パスの処理

ファイル内に相対パスがある場合:
- 画像: `![image](./path/to/image.png)` → `![image](https://github.com/user/repo/blob/main/path/to/image.png)`
- リンク: `[doc](./path/to/doc.md)` → `[doc](https://github.com/user/repo/blob/main/path/to/doc.md)`

#### コードブロックの処理

コードブロックがある場合、言語指定を維持:

```markdown
```typescript
// TypeScript code
const example = "code";
```
```

## ワークフロー例

### 完全なissue作成フロー（ファイルから）

```bash
# 1. ファイルを確認
cat /tmp/work-summary-20260524-083217.md

# 2. ファイル内容を分析（スキル内部で自動実行）
# - タイトル生成
# - issueタイプ判定
# - テンプレート選択

# 3. issue作成
gh issue create \
  --title "タスク: CLAUDE.md整備とPR作成スキル実装" \
  --body "$(cat /tmp/work-summary-20260524-083217.md && echo -e '\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)')" \
  --label "task,documentation"

# 4. issue番号とURLを取得
# 出力例: https://github.com/user/dev-env-iac/issues/1
```

### 完全なissue作成フロー（手動入力）

```bash
# 1. issue作成
gh issue create \
  --title "バグ: AMI検索でtry-catchエラーハンドリングが不足" \
  --body "$(cat <<'EOF'
## 問題の説明
`modules/ami.ts` の `getBaseAmi()` で、カスタムAMI検索時のエラーハンドリングが不足している。

## 再現手順
1. カスタムAMIが存在しない環境で実行
2. `getBaseAmi()` を呼び出す
3. エラーが発生

## 期待される動作
try-catchでエラーをキャッチし、Ubuntu base AMIにフォールバック

## 実際の動作
エラーがスローされ、プロセスが停止

## 環境
- OS: Ubuntu 24.04
- Pulumi: 3.113.0
- Node.js: 18.x

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" \
  --label "bug,high-priority" \
  --assignee "@me"

# 2. issue番号とURLを取得
# 出力例: https://github.com/user/dev-env-iac/issues/2
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
# - GitHub.com を選択
# - HTTPS を選択
# - Authenticate Git with GitHub credentials: Yes
# - ブラウザで認証
```

### リポジトリが検出されない

**エラー**:
```
could not determine the current repository
```

**解決方法**:
```bash
# Gitリポジトリのルートディレクトリに移動
cd /path/to/repository

# または、リポジトリを明示的に指定
gh issue create --repo owner/repo --title "タイトル" --body "本文"
```

### ラベルが存在しない

**エラー**:
```
label 'nonexistent-label' does not exist
```

**解決方法**:
```bash
# 既存のラベルを確認
gh label list

# 新しいラベルを作成
gh label create "task" --description "作業タスク" --color "0052CC"
```

## 関連リンク

- [GitHub CLI マニュアル](https://cli.github.com/manual/)
- [GitHub Issues ガイド](https://docs.github.com/en/issues)
- [マークダウン記法](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
