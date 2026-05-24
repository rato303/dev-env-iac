# 次のステップ

## ✅ 完了したこと（Phase 1 - 60%）

このコミット（6949eeb）で以下が完了しました：

1. **基本構造**: ディレクトリ、設定ファイル、Makefile、README
2. **Ansible構成**: ロール整理（common/web-dev/jvm-dev）とツールチェーン選択
3. **共有リソース**: IAMとPulumiバックエンドのコピー

## 🔄 GitHubへのプッシュ手順

### 1. GitHubで新規リポジトリを作成

ブラウザでGitHubにアクセスし、新規リポジトリを作成：
- リポジトリ名: `dev-env-iac`
- 説明: "Multi-project development environment IaC"
- Public/Private: お好みで
- **重要**: README、.gitignore、ライセンスは追加しない（既にローカルに存在）

### 2. リモートリポジトリに接続

```bash
cd /home/ubuntu/dev-env-iac

# リモートリポジトリを追加（URLは自分のものに置き換え）
git remote add origin https://github.com/YOUR_USERNAME/dev-env-iac.git

# または SSH
# git remote add origin git@github.com:YOUR_USERNAME/dev-env-iac.git

# プッシュ
git push -u origin main
```

### 3. PRを作成（GitHub CLI使用の場合）

```bash
# GitHub CLIでログイン（初回のみ）
gh auth login

# ドラフトPRを作成
gh pr create \
  --title "feat: Phase 1基盤構築（60%）- 基本構造とAnsible構成" \
  --body-file .git/PR_TEMPLATE.md \
  --draft
```

または、GitHubのWebインターフェースから以下の内容でPRを作成：
- タイトル: `feat: Phase 1基盤構築（60%）- 基本構造とAnsible構成`
- 本文: `.git/PR_TEMPLATE.md` の内容をコピー
- ドラフトPRとして作成

## 📝 次の実装内容（Phase 1 - 残り40%）

### 優先度1: Pulumiプロジェクトテンプレート

```bash
# 作成するファイル
iac/pulumi/projects/template/infra/
├── Pulumi.yaml
├── Pulumi.dev.yaml.example
├── index.ts
├── package.json
├── tsconfig.json
├── Makefile
└── modules/
    ├── ec2.ts
    ├── security-group.ts
    └── ami.ts
```

**参考**: `/home/ubuntu/instance-provisioning/iac/pulumi/ec2/` を拡張

### 優先度2: ヘルパースクリプト

1. `scripts/list-instances.sh`: 全インスタンス一覧
2. `scripts/init-project.sh`: 新規案件追加

### 優先度3: Windows統合

1. `windows/setup-aws-cli.ps1`
2. `windows/ssh-config-generator.ps1`

### 優先度4: カスタムAMIベイク

1. `scripts/bake-ami.sh`
2. `scripts/cleanup-old-amis.sh`

## 🎯 次回実装開始時のコマンド

```bash
cd /home/ubuntu/dev-env-iac

# 進捗確認
cat PROGRESS.md

# 次のステップを確認
cat NEXT_STEPS.md

# 実装開始
# 1. Pulumiプロジェクトテンプレートの作成から開始
mkdir -p iac/pulumi/projects/template/infra/modules
cd iac/pulumi/projects/template/infra

# instance-provisioningを参考にindex.tsを作成
# タグ拡張とAMI検索ロジックを追加
```

## 📊 進捗管理

- **Phase 1**: 60% → 100% (Pulumiテンプレート + スクリプト)
- **Phase 2**: 0% → 100% (Windows統合)
- **Phase 3**: 0% → 100% (ECSタスク化)

各フェーズ完了時に新しいPRを作成することを推奨します。

## 🔗 関連ドキュメント

- プラン: `/home/ubuntu/.claude/plans/1-goofy-dove.md`
- 進捗: `PROGRESS.md`
- README: `README.md`
