# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際の基本方針を定義します。

## プロジェクトの性質

このリポジトリは、**複数プロジェクトを非連続的に実施する開発者**向けの開発環境IaCです。

### 目的
- 案件ごとに開発環境を完全分離（コスト管理とセキュリティ確保）
- 素早い作成・破棄サイクル（カスタムAMIベイクで初回15分→2回目以降3分）
- タグベースの案件追跡とコスト配分

### 言語規約
- **コメント・ドキュメント**: 日本語
- **コード識別子**: 英語
- この規約はすべてのコードとドキュメントに適用

## 重要な設計原則

### 1. Session Manager専用アクセス
- **全インスタンスはSession Manager経由でのみアクセス可能**
- SSH鍵は使用しない、インバウンドセキュリティグループルールも設定しない
- アウトバウンドは443（HTTPS）とDNS（UDP/TCP 53）のみ許可

### 2. タグベースのリソース管理
すべてのリソースに以下のタグを必ず付与：
- `Project`: プロジェクト名（config/projects.yamlのnameフィールド）
- `Environment`: 環境（dev/staging/prod）
- `Toolchain`: ツールチェーン種別（web-dev/jvm-dev）
- `CostCenter`: コスト配分先
- `Owner`: 管理者メールアドレス
- `ManagedBy`: "dev-env-iac"（固定値）

### 3. カスタムAMI戦略
- `modules/ami.ts`の`getBaseAmi()`は、`ManagedBy=dev-env-iac` + `Toolchain=<name>`でタグ付けされたカスタムAMIを優先検索
- カスタムAMIが存在しない場合、Canonical Ubuntu 24.04（Noble）にフォールバック
- AMI IDは常にタグ`BaseAmiId`に記録

### 4. Pulumiバックエンド設定
- S3バックエンドのURLとリージョンは**SSM Parameter Store**（`/pulumi/backend/url`、`/pulumi/backend/region`）に保存
- 全PulumiプロジェクトのMakefileはSSMから設定を取得
- スタックはパスフレーズなし（`PULUMI_CONFIG_PASSPHRASE=""`）で開発利便性を優先

## 開発ワークフロー

このプロジェクトでは、Issue作成からPRマージまでの一連のワークフローを、Claude Codeの専用スキルを使って自動化しています。

### Issue-to-PR ライフサイクル

```
Issue作成 → プラン生成 → 実装 → コミット → PR作成 → レビュー対応 → マージ
    ↓          ↓         ↓       ↓        ↓          ↓
creating-  planning-  executing- committing creating-  responding-
issue      from-issue  plan                  pr         review
```

1. **Issue作成** (`creating-issue` スキル)
   - GitHub issueを作成
   - テンプレート適用（Bug/Feature/Task/Documentation）
   - ラベル自動付与

2. **プラン生成** (`planning-from-issue` スキル)
   - Issueから実装プランを生成
   - プランファイル: `~/.claude/plans/issue-{番号}-{slug}.md`
   - 4フェーズの実装ステップ、受け入れ基準、リスク分析を含む

3. **プラン実行** (`executing-plan` スキル)
   - プランに従って段階的に実装
   - 各フェーズ完了後にメタデータ更新（State, Phase, Files Modified）
   - 進捗をプランファイルに記録

4. **コミット作成** (`committing` スキル)
   - 変更をGitコミット
   - プロジェクト規約に準拠したコミットメッセージを生成
   - 必ずCo-Authored-Byタグを付与

5. **PR作成** (`creating-pr` スキル)
   - 変更をプッシュしてGitHub PRを作成
   - PRタイトル・ボディを自動生成
   - Test planを含む

6. **レビュー対応** (`responding-review` スキル)
   - レビュー指摘に対応
   - ファイル修正、コミット作成、コメント返信、スレッドResolveを自動化

### スキル使用ガイド

各スキルは自然言語パターンで発動します：

| スキル | 発動パターン例 | 用途 |
|--------|---------------|------|
| `creating-issue` | 「issueを作成」「バグ報告」 | GitHub issue作成 |
| `planning-from-issue` | 「issue {番号} から計画」「{番号} の実装プラン」 | Issueからプラン生成 |
| `executing-plan` | 「プランを実行」「計画に従って実装」 | プラン実行 |
| `committing` | 「コミットを作成」「変更をコミット」 | Gitコミット作成 |
| `creating-pr` | 「PRを作成」「プルリクエストを作る」 | GitHub PR作成 |
| `responding-review` | 「レビュー指摘に対応」「指摘を修正」 | レビュー対応 |

**プランファイル管理**:
- 保存場所: `~/.claude/plans/issue-{番号}-{slug}.md`（ユーザーホーム：個人開発者向けプロジェクトのため、案件ごとに独立した開発環境を想定）
- メタデータ: State (pending/in-progress/completed), Current Phase (0-4), Files Modified, Commits
- 実行状態を追跡し、中断・再開が可能

**ブランチ戦略**:
- フィーチャーブランチ: `feature/{slug}`
- バグ修正ブランチ: `fix/{slug}`
- プラン生成時にブランチ名を提案

### コミット規約

すべてのコミットは以下の形式に従います：

**形式**:
```
{prefix}: {要約（1-2文）}

- {ファイル名}: {変更内容}
- {ファイル名}: {変更内容}

Co-Authored-By: Claude <noreply@anthropic.com>
```

**プレフィックス**:
| プレフィックス | 用途 | 例 |
|-------------|------|-----|
| `feat:` | 新機能追加 | `feat: planning-from-issueスキル追加` |
| `fix:` | バグ修正、レビュー指摘対応 | `fix: AMI検索のエラーハンドリング追加` |
| `refactor:` | リファクタリング（動作変更なし） | `refactor: getBaseAmi関数を分割` |
| `docs:` | ドキュメント更新 | `docs: CLAUDE.mdに開発フロー追加` |
| `chore:` | ビルド、設定変更 | `chore: package.json依存関係更新` |
| `test:` | テスト追加・修正 | `test: AMI検索のユニットテスト追加` |

**Co-Authored-Byタグ**:
- **必須**: すべてのコミットに `Co-Authored-By: Claude <noreply@anthropic.com>` を追加
- Claude Codeが生成したコミットであることを明示

**良い例**:
```
feat: CLAUDE.mdに開発ワークフロー規約を追加

- CLAUDE.md: Issue-to-PRライフサイクルの記述追加
- CLAUDE.md: コミット規約とPR規約のセクション追加
- CLAUDE.md: スキル使用ガイドの追加

Co-Authored-By: Claude <noreply@anthropic.com>
```

**悪い例**:
```
update
```
（プレフィックスなし、詳細なし、Co-Authored-Byなし）

### PR規約

**PRタイトル**:
- **70文字以内**（厳守）
- コミットと同じプレフィックスを使用
- 例: `feat: CLAUDE.mdに開発ワークフロー規約を追加`

**PRボディ構造**:
```markdown
## Summary
- <変更点1の要約>
- <変更点2の要約>
- <変更点3の要約>

## Test plan
- [ ] <検証項目1>
- [ ] <検証項目2>
- [ ] <検証項目3>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**ベースブランチ**:
- デフォルト: `main`
- mainブランチから直接PRは作成しない（必ずフィーチャーブランチから）

### レビュー対応フロー

PRレビュー指摘への対応は `responding-review` スキルで自動化されます。

**フロー**:
1. **レビューコメント取得**: `gh api repos/{owner}/{repo}/pulls/{PR}/comments`
2. **ファイル修正**: 指摘内容に従ってファイルを修正
3. **コミット作成**: `fix: レビュー指摘対応 - {要約}`
4. **コメント返信**: 各レビューコメントに返信を投稿（`gh api repos/{owner}/{repo}/pulls/{PR}/comments/{comment_id}/replies`）
5. **スレッドResolve**: GraphQL mutationでスレッドをResolve（`gh api graphql -f id="<thread_id>" -f query='mutation($id: ID!) { resolveReviewThread(input: {threadId: $id}) { thread { id isResolved } } }'`）

**返信フォーマット**:
```markdown
ご指摘ありがとうございます。

{対応内容の説明（1-2文）}

対応コミット: {commit-hash}
```

**重要な教訓**:

❌ **絶対にやってはいけないこと**:
```bash
gh api --method PATCH repos/{owner}/{repo}/pulls/comments/{comment_id} \
  -f body="返信内容"
```
→ 元のレビューコメントを**上書き**してしまう（元の指摘内容が失われる）

✅ **正しい方法**:
```bash
gh api repos/{owner}/{repo}/pulls/{PR}/comments/{comment_id}/replies \
  -f body="返信内容"
```
→ スレッドに**返信を追加**（元のコメントはそのまま残る）

この教訓はPR #8での実際の失敗経験から得られました。レビューコメントへの返信は必ず `/replies` エンドポイントを使用し、元のコメントを保護してください。

## アーキテクチャ概要

### 3層構造
1. **設定層**（`config/`）: プロジェクト定義（projects.yaml）とデフォルト設定（defaults.yaml）
2. **Pulumi層**（`iac/pulumi/`）: インフラストラクチャ定義
   - `shared/`: 共有リソース（IAMロール、バックエンド設定）
   - `projects/template/`: 新規案件用テンプレート
3. **Ansible層**（`iac/ansible/`）: 開発環境のプロビジョニング
   - ツールチェーン別ロール（common/web-dev/jvm-dev）

### ツールチェーン分離
- **web-dev**: Node.js/TypeScript開発（nvm、pulumi）
- **jvm-dev**: JVM言語開発（sdkman）
- **common**: 全環境共通（awscli、make、docker、ansible、git-switch-user）

## 開発時の留意点

### 新規プロジェクト追加時
1. `config/projects.yaml`に案件定義を追加（既存の書式を踏襲）
2. `iac/pulumi/projects/template/infra/`をコピーして新規プロジェクトディレクトリを作成
3. コピーしたプロジェクトの`Pulumi.yaml`と`package.json`の`name`フィールドを更新
4. スタック設定（`Pulumi.<stack>.yaml`）で、`projectName`、`vpcId`、`subnetId`、`toolchain`を設定

### 既存プロジェクトの修正時
- **タグの一貫性を維持**: 新しいリソースにも必ず上記6つのタグを付与
- **AMI検索ロジックを変更しない**: カスタムAMI優先、Ubuntu フォールバックのパターンを維持
- **Makefileのパターンを踏襲**: `PULUMI_CONFIG_PASSPHRASE=""`の設定、`login-to-backend.sh`の使用

### Git管理
- EC2インスタンスには`ProvisioningRepositoryVersion`タグでGitコミットハッシュを記録（`modules/ec2.ts`の`getGitCommitHash()`）
- これによりインフラとコードのバージョン追跡が可能

### コマンドの確認方法
- 具体的なコマンドやワークフローは`README.md`を参照
- 各ディレクトリの`Makefile`で`make help`を実行してコマンド一覧を確認
