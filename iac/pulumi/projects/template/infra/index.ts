import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { getBaseAmi } from "./modules/ami";
import { createProjectSecurityGroup } from "./modules/security-group";
import { createDevInstance } from "./modules/ec2";

// Pulumi設定を取得
const config = new pulumi.Config();
const awsConfig = new pulumi.Config("aws");
const region = awsConfig.require("region");

// プロジェクト設定
const projectName = config.require("projectName");
const environment = config.get("environment") || "dev";
const toolchain = config.require("toolchain");  // "web-dev" | "jvm-dev"

// ネットワーク設定
const vpcId = config.require("vpcId");
const subnetId = config.require("subnetId");

// インスタンス設定
const instanceName = config.get("instanceName") || `${projectName}-${environment}`;
const instanceType = config.get("instanceType") || "t3.medium";
const volumeSize = config.getNumber("volumeSize") || 60;

// IAMロール設定
const roleType = config.get("roleType") || "basic";
const iamInstanceProfile = roleType === "super" ? "WebSuperDeveloper" : "WebBasicDeveloper";

// コスト管理
const costCenter = config.get("costCenter") || projectName;
const owner = config.get("owner") || "admin@example.com";

// AMI検索
const amiId = pulumi.output(getBaseAmi({ toolchain, region }));

// SecurityGroup作成
const securityGroup = createProjectSecurityGroup(`${projectName}-${environment}-sg`, {
    projectName,
    environment,
    vpcId
});

// EC2インスタンス作成
const instance = createDevInstance(instanceName, {
    instanceName,
    projectName,
    environment,
    toolchain,
    amiId: amiId,
    instanceType,
    subnetId,
    securityGroupId: securityGroup.id,
    iamInstanceProfile,
    volumeSize,
    costCenter,
    owner
});

// エクスポート
export const instanceId = instance.id;
export const publicIp = instance.publicIp;
export const privateIp = instance.privateIp;
export const publicDns = instance.publicDns;
export const securityGroupId = securityGroup.id;
export const usedAmiId = amiId;
export const usedVpcId = vpcId;
export const usedSubnetId = subnetId;
