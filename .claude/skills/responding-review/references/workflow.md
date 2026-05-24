# PRレビュー指摘対応ワークフロー詳細

このドキュメントは、responding-reviewスキルで使用するGitHub CLI / Git コマンドとプロジェクト固有の規約を詳細に記述します。

## GitHub CLI コマンド

### PR情報の取得

```bash
# 基本形式
gh pr view <PR番号>

# JSON形式で特定フィールドを取得
gh pr view <PR番号> --json number,title,state,url,headRefName,baseRefName

# 実行例
gh pr view 8 --json number,title,state,url,headRefName --jq '{number: .number, title: .title, state: .state, url: .url, branch: .headRefName}'
```

**出力例**:
```json
{
  "number": 8,
  "title": "docs: CLAUDE.mdとREADME.md追加",
  "state": "OPEN",
  "url": "https://github.com/rato303/dev-env-iac/pull/8",
  "branch": "feature/pulumi-template"
}
```

### レビューコメントの取得

```bash
# GitHub API経由でレビューコメント取得
gh api repos/{owner}/{repo}/pulls/<PR番号>/comments

# jqで整形
gh api repos/{owner}/{repo}/pulls/{PR番号}/comments --jq '.[] | {id: .id, path: .path, line: .line, body: .body, user: .user.login}'

# 実行例（dev-env-iacリポジトリでPR #8の場合）
gh api repos/{owner}/{repo}/pulls/8/comments --jq '.[] | {id: .id, path: .path, line: .line, body: .body[0:100], user: .user.login}'
```

**出力例**:
```json
{
  "id": 3294158924,
  "path": "CLAUDE.md",
  "line": 28,
  "body": "Projectタグの値が不明確です...",
  "user": "gemini-code-assist[bot]"
}
```

### レビューコメントへの返信（重要）

**✅ 正しい方法** - POST /replies エンドポイント:
```bash
gh api repos/{owner}/{repo}/pulls/{PR番号}/comments/{comment_id}/replies \
  -f body="返信内容"

# 実行例
gh api repos/{owner}/{repo}/pulls/8/comments/3294158924/replies \
  -f body="ご指摘ありがとうございます。

CLAUDE.mdの記述を修正しました。

対応コミット: 44e0a73604afabc875ff748d7b5b428b2852e76e"
```

**❌ 間違った方法** - PATCH（元のコメントを上書き）:
```bash
# これは絶対に使わない！
gh api --method PATCH repos/{owner}/{repo}/pulls/comments/{comment_id} \
  -f body="返信内容"
```

**重要な違い**:
- `POST .../replies`: 新しいコメントとしてスレッドに追加される（`in_reply_to_id` フィールドで親コメントと関連付け）
- `PATCH .../comments/{id}`: 既存のコメント本文を**上書き**（元の内容が失われる）

### レビューコメント返信の確認

```bash
# 特定のコメントの返信を確認
gh api repos/{owner}/{repo}/pulls/comments/{comment_id} --jq '{id: .id, body: .body, in_reply_to_id: .in_reply_to_id}'

# PR全体のコメント一覧（返信含む）
gh api repos/{owner}/{repo}/pulls/{PR番号}/comments --jq '.[] | select(.in_reply_to_id != null) | {id: .id, in_reply_to_id: .in_reply_to_id, body: .body[0:50]}'
```

## Git コマンド

### ブランチ確認と切り替え

```bash
# 現在のブランチ確認
git branch --show-current

# ブランチ一覧
git branch -a

# ブランチ切り替え
git checkout <ブランチ名>

# リモートブランチから新規ブランチ作成して切り替え
git checkout -b <ローカルブランチ名> origin/<リモートブランチ名>
```

### コミット作成

```bash
# ファイルをステージング
git add <ファイル名>

# 複数ファイルを一度にステージング
git add file1.md file2.ts file3.yaml

# コミット作成（HEREDOCでメッセージ）
git commit -m "$(cat <<'EOF'
fix: レビュー指摘対応 - タグ定義の明確化と統一

- CLAUDE.md: Projectタグの説明を修正
- ec2.ts: タグ名をManagedByに統一

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

### プッシュ

```bash
# 現在のブランチをプッシュ
git push

# 初回プッシュ（トラッキングブランチ設定）
git push -u origin <ブランチ名>

# 強制プッシュ（通常は使わない）
git push --force  # 危険！
```

### コミットハッシュ取得

```bash
# 最新コミットのハッシュ（フル）
git log -1 --format=%H

# 最新コミットのハッシュ（短縮版）
git log -1 --format=%h

# 最新コミットの詳細
git log -1 --format="%H %s"
```

**出力例**:
```
44e0a73604afabc875ff748d7b5b428b2852e76e
```

## プロジェクト規約（dev-env-iac）

### コミットメッセージ規約

#### プレフィックス

| プレフィックス | 用途 | レビュー対応での使用例 |
|------------|------|---------------------|
| `fix:` | バグ修正 | タグ名の間違い、タイポ、ロジックエラー |
| `refactor:` | リファクタリング | コード構造の改善、命名変更 |
| `docs:` | ドキュメント更新 | README、CLAUDE.md、コメント修正 |
| `style:` | フォーマット修正 | インデント、空白、改行 |
| `test:` | テスト追加・修正 | テストコード関連 |

レビュー指摘対応の多くは `fix:` を使用します。

#### 本文形式

```
<プレフィックス>: レビュー指摘対応 - <要約>

- <ファイル名>: <修正内容1>
- <ファイル名>: <修正内容2>
- <ファイル名>: <修正内容3>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**良い例**:
```
fix: レビュー指摘対応 - タグ定義の明確化と統一

- CLAUDE.md: Projectタグの説明を「キー」から「nameフィールド」に修正
- ec2.ts: ProvisionedByタグをManagedByに統一（CLAUDE.md定義に合わせる）

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**悪い例**:
```
fix

修正しました
```
（要約なし、詳細なし、Co-Authored-Byなし）

### レビューコメント返信規約

#### 基本テンプレート

```markdown
ご指摘ありがとうございます。

<対応内容の説明（1-2文）>

対応コミット: <commit-hash>
```

#### 実例

**指摘1への返信例**:
```markdown
ご指摘ありがとうございます。

CLAUDE.mdの記述を修正し、`Project` タグには `config/projects.yaml` の `name` フィールド（表示名）を使用することを明記しました。既存の実装がこの方針に沿っていることを確認しています。

対応コミット: 44e0a73604afabc875ff748d7b5b428b2852e76e
```

**指摘2への返信例**:
```markdown
ご指摘ありがとうございます。

タグ名の混在を解消するため、`ec2.ts` の `ProvisionedBy` を `ManagedBy` に統一しました。これにより、プロジェクト全体でCLAUDE.mdで定義した規約に従ったタグ名が使用されます。

対応コミット: 44e0a73604afabc875ff748d7b5b428b2852e76e
```

#### 返信時の注意点

1. **礼儀正しく**: 必ず「ご指摘ありがとうございます」から始める
2. **具体的に**: 何をどう修正したか明確に記述
3. **コミットハッシュ必須**: 対応内容が追跡可能にする
4. **簡潔に**: 1-2文で要点をまとめる

### ブランチ戦略

- **PRのheadブランチで作業**: `gh pr view --json headRefName` で取得
- **mainブランチから直接対応しない**: レビュー対応は常にフィーチャーブランチで
- **ブランチ名規約**: `feature/<機能名>`, `fix/<バグ名>`, `docs/<ドキュメント名>`

## ワークフロー例

### 完全なレビュー対応フロー

```bash
# 1. PR情報取得
gh pr view 8 --json number,title,headRefName,state,url

# 2. レビューコメント取得
gh api repos/{owner}/{repo}/pulls/8/comments --jq '.[] | {id: .id, path: .path, line: .line, body: .body, user: .user.login}'

# 3. 現在のブランチ確認
git branch --show-current

# 4. 必要に応じてブランチ切り替え
git checkout feature/pulumi-template

# 5. ファイル修正（Editツール使用）
# ...

# 6. ステージングとコミット
git add CLAUDE.md iac/pulumi/projects/template/infra/modules/ec2.ts
git commit -m "$(cat <<'EOF'
fix: レビュー指摘対応 - タグ定義の明確化と統一

- CLAUDE.md: Projectタグの説明を「キー」から「nameフィールド」に修正
- ec2.ts: ProvisionedByタグをManagedByに統一（CLAUDE.md定義に合わせる）

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# 7. プッシュ
git push

# 8. コミットハッシュ取得
COMMIT_HASH=$(git log -1 --format=%H)
echo $COMMIT_HASH

# 9. コメント1に返信
gh api repos/{owner}/{repo}/pulls/8/comments/3294158924/replies \
  -f body="ご指摘ありがとうございます。

CLAUDE.mdの記述を修正し、\`Project\` タグには \`config/projects.yaml\` の \`name\` フィールド（表示名）を使用することを明記しました。既存の実装がこの方針に沿っていることを確認しています。

対応コミット: $COMMIT_HASH"

# 10. コメント2に返信
gh api repos/{owner}/{repo}/pulls/8/comments/3294158925/replies \
  -f body="ご指摘ありがとうございます。

タグ名の混在を解消するため、\`ec2.ts\` の \`ProvisionedBy\` を \`ManagedBy\` に統一しました。これにより、プロジェクト全体でCLAUDE.mdで定義した規約に従ったタグ名が使用されます。

対応コミット: $COMMIT_HASH"
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

### PRが見つからない

**エラー**:
```
pull request not found
```

**確認事項**:
1. PR番号が正しいか確認
2. リポジトリが正しいか確認: `git remote -v`
3. PRがクローズされていないか確認: `gh pr list --state all`

### ブランチが一致しない

**症状**:
現在のブランチがPRのheadブランチと異なる

**解決方法**:
```bash
# PRのブランチを確認
PR_BRANCH=$(gh pr view 8 --json headRefName --jq .headRefName)

# ブランチ切り替え
git checkout $PR_BRANCH
```

### プッシュがコンフリクト

**エラー**:
```
error: failed to push some refs to 'origin'
hint: Updates were rejected because the remote contains work that you do not have locally.
```

**解決方法**:
```bash
# リモートの変更を取り込む（rebase推奨）
git pull --rebase

# コンフリクトがあれば解決
# ...

# 解決後、プッシュ
git push
```

### レビューコメント返信APIエラー

**エラー**:
```
HTTP 422: Validation Failed
```

**考えられる原因と対処**:
1. **コメントIDが間違っている**: コメントID確認
2. **コメントが既に削除されている**: Web UIで確認
3. **PR番号が間違っている**: PR番号確認
4. **認証エラー**: `gh auth status` で確認、必要なら `gh auth refresh`

## 重要な教訓（PR #8での実体験）

### 失敗事例: PATCHでコメントを上書き

**何が起きたか**:
PR #8のレビュー対応中に、以下のコマンドを実行:
```bash
gh api --method PATCH repos/{owner}/{repo}/pulls/comments/3294158924 \
  -f body="ご指摘ありがとうございます。対応しました。"
```

**結果**:
- 元のgemini-code-assistのレビューコメント本文が**完全に上書き**された
- 「Projectタグの値が不明確」という元の指摘内容が失われた
- 私の返信内容だけが残り、何の指摘だったか分からなくなった

**復旧を試みた結果**:
- Web UIで "edited" 表示を確認 → 表示されず
- 編集履歴から復旧不可能
- GitHub Supportに連絡するしか方法がなかった（実際は現状維持を選択）

### 正しい方法

**正しいコマンド**:
```bash
gh api repos/{owner}/{repo}/pulls/8/comments/3294158924/replies \
  -f body="ご指摘ありがとうございます。対応しました。"
```

**結果**:
- 元のgemini-code-assistのコメントはそのまま残る
- 私の返信が**新しいコメント**としてスレッドに追加される
- `in_reply_to_id: 3294158924` で親コメントと関連付けられる
- Web UIでスレッド形式で表示される

### 教訓まとめ

1. **PATCHは編集、POSTは新規作成**: エンドポイントの違いを理解する
2. **レビューコメントへの返信は必ず `/replies`**: これは絶対のルール
3. **編集履歴は必ずしも表示されない**: 誤って上書きした場合の復旧は困難
4. **テスト環境で確認**: 本番PRで初めて試さない

### 参考リンク

- [GitHub API: Create a reply for a review comment](https://docs.github.com/en/rest/pulls/comments#create-a-reply-for-a-review-comment)
- [GitHub API: Update a review comment](https://docs.github.com/en/rest/pulls/comments#update-a-review-comment)
- 実際の失敗事例: [PR #8 コメント #3294158924](https://github.com/rato303/dev-env-iac/pull/8#discussion_r3294158924), [#3294158925](https://github.com/rato303/dev-env-iac/pull/8#discussion_r3294158925)

## 関連リンク

- [GitHub CLI マニュアル](https://cli.github.com/manual/)
- [GitHub REST API - Pulls](https://docs.github.com/en/rest/pulls)
- [Git 公式ドキュメント](https://git-scm.com/doc)
