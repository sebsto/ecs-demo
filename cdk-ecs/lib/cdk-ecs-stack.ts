import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
import ecr = require('@aws-cdk/aws-ecr');
import ecs_patterns = require('@aws-cdk/aws-ecs-patterns');

export class CdkEcsStack extends cdk.Stack {

 private readonly TAG = "-20200521";

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create VPC with public/private subnet in 2 AZ + NAT Gateway + IGW 
    const vpc = new ec2.Vpc(this, `MyCDKVpc${this.TAG}`, {
      maxAzs: 2 // Default is all AZs in region
    });

    // create ECS cluster in the VPC
    const cluster = new ecs.Cluster(this, `MyCDKCluster${this.TAG}`, {
      vpc: vpc
    });

    // import existing repo 
    const repo = ecr.Repository.fromRepositoryArn(this, `MyCDKRepo${this.TAG}`, 'arn:aws:ecr:eu-west-1:486652066693:repository/nginx');

    // Create a load-balanced Fargate service and make it public
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, `MyFargateService${this.TAG}`, {
      cluster,
      taskImageOptions : {
        image : ecs.ContainerImage.fromEcrRepository(repo, 'latest'),
        containerName: "nginx"
      },
      desiredCount: 2  // Default is 1
    });

    // Output the DNS where you can access your service
    new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: fargateService.loadBalancer.loadBalancerDnsName });

    // just for a demo to have quicker container registration
    fargateService.targetGroup.configureHealthCheck({
      healthyThresholdCount : 2,
      unhealthyThresholdCount : 2,
      timeout : cdk.Duration.seconds(3),
      interval : cdk.Duration.seconds(5) 
    });

    // https://github.com/aws/aws-cdk/issues/4015
    // fargateService.targetGroup.deregistrationDelaySec = 10;
    fargateService.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '10');
  }
}

