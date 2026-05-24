import * as aws from "@pulumi/aws";

export interface AmiSearchOptions {
    toolchain: string;      // "web-dev" | "jvm-dev"
    region: string;
}

/**
 * カスタムAMIを検索し、存在しなければUbuntu base AMIを返す
 */
export async function getBaseAmi(options: AmiSearchOptions): Promise<string> {
    const { toolchain, region } = options;

    // カスタムAMIを検索（try-catchでラップ）
    let customAmiId: string | undefined;
    try {
        const customAmi = await aws.ec2.getAmi({
            filters: [
                { name: "name", values: [`dev-env-${toolchain}-base-*`] },
                { name: "tag:Toolchain", values: [toolchain] },
                { name: "tag:ManagedBy", values: ["dev-env-iac"] }
            ],
            mostRecent: true,
            owners: ["self"]
        }, { async: true });
        customAmiId = customAmi.id;
    } catch (e) {
        console.log(`ℹ No custom AMI found for ${toolchain}, proceeding to fallback`);
    }

    if (customAmiId) {
        console.log(`✓ Using custom AMI: ${customAmiId} (${toolchain})`);
        return customAmiId;
    }

    // カスタムAMIが存在しない場合、Ubuntu base AMIを取得
    console.log(`⚠ No custom AMI found for ${toolchain}, using Ubuntu base`);
    const ubuntuAmi = await aws.ec2.getAmi({
        filters: [
            { name: "name", values: ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-*"] },
            { name: "architecture", values: ["x86_64"] }
        ],
        mostRecent: true,
        owners: ["099720109477"]  // Canonical
    }, { async: true });

    return ubuntuAmi.id;
}
