# dev-env-iac 実装進捗

## Phase 1: 基盤構築（最小限実装）

### ✅ 完了項目

1. **基本ディレクトリ構造**
   - config/, iac/, scripts/, windows/ ディレクトリ作成
   - .gitignore 設定

2. **設定ファイル**
   - config/projects.yaml: プロジェクト定義
   - config/defaults.yaml: デフォルト設定

3. **トップレベルファイル**
   - Makefile: 基本コマンド（help, init, list, status, clean）
   - README.md: プロジェクト概要とクイックスタート

4. **instance-provisioningからのファイルコピー**
   - IAMリソース → iac/pulumi/shared/iam/
   - Pulumiバックエンド → iac/pulumi/shared/backend/
   - Ansibleロール → iac/ansible/roles/
   - Ansible group_vars, inventory, provision.yml

5. **Ansibleロールの整理**
   - common/: awscli, make, docker, ansible, git-switch-user
   - web-dev/: nvm, pulumi
   - jvm-dev/: sdkman

6. **Ansible provision.yml更新**
   - ツールチェーン選択機能（web-dev, jvm-dev, all）
   - 条件分岐による動的ロール読み込み

7. **Ansible group_vars拡張**
   - web-dev.yml: Node.js/TypeScript用変数
   - jvm-dev.yml: Java/Kotlin/Gradle用変数

### 🔄 次のステップ（優先順位順）

1. **Pulumiプロジェクトテンプレート作成**
   - iac/pulumi/projects/template/infra/ ディレクトリ
   - index.ts: EC2インスタンス定義（タグ拡張）
   - modules/ec2.ts: モジュール化
   - modules/security-group.ts: 案件別SG
   - modules/ami.ts: カスタムAMI検索
   - Pulumi.yaml, package.json, tsconfig.json
   - Makefile: プロジェクト操作用

2. **スクリプト作成**
   - scripts/list-instances.sh: 全インスタンス一覧
   - scripts/init-project.sh: 新規案件追加

3. **Windows統合スクリプト**
   - windows/setup-aws-cli.ps1
   - windows/ssh-config-generator.ps1

4. **カスタムAMIベイク機構**
   - scripts/bake-ami.sh
   - scripts/cleanup-old-amis.sh

### 📊 進捗率

Phase 1 基盤構築: **60%** 完了

- 基本構造: ✅ 100%
- Ansible構成: ✅ 100%
- Pulumiテンプレート: ⏳ 0%
- スクリプト: ⏳ 10%
- Windows統合: ⏳ 0%

## 動作確認

### 現在可能なコマンド

```bash
cd /home/ubuntu/dev-env-iac

# ヘルプ表示
make help

# プロジェクト一覧
make list

# インスタンス状態確認（AWS CLI設定済みの場合）
make status

# 一時ファイルクリーンアップ
make clean
```

### Ansibleロール確認

```bash
# ロール構造
ls -la iac/ansible/roles/

# provision.ymlの内容
cat iac/ansible/provision.yml
```

## 次回実装時の開始点

1. Pulumiプロジェクトテンプレートの作成から開始
2. instance-provisioning/iac/pulumi/ec2/index.ts を参考に拡張
3. タグ戦略とAMI検索ロジックを実装

## 注意事項

- まだPulumiプロジェクトが作成されていないため、実際のインフラデプロイは不可
- Ansibleロールは整理されたが、実行にはターゲットEC2が必要
- Windows統合スクリプトは未作成

