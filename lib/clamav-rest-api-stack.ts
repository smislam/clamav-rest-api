import * as cdk from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage, FargateService, FargateTaskDefinition, LogDrivers } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export class ClamavRestApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const vpc = new Vpc(this, 'app-vpc', {});

    const cluster = new Cluster(this, 'Cluster', {vpc});
    
    const taskDefinition = new FargateTaskDefinition(this, 'TaskDef', {
      cpu: 2048,
      memoryLimitMiB: 5120
    });

    const clamContainer = taskDefinition.addContainer('clamAvContainer', {
      containerName: 'clamAv',
      image: ContainerImage.fromRegistry("clamav/clamav"),
      cpu: 1024,
      memoryLimitMiB: 4096,
      portMappings: [{
        containerPort: 3310,
        hostPort: 3310
      }],
      logging: LogDrivers.awsLogs({streamPrefix: 'clamav-service'}),
    });
    
    const clamContainerRest = taskDefinition.addContainer('myContainer', {
      containerName: 'clamAvRest',
      image: ContainerImage.fromAsset('./snooper'),
      cpu: 256,
      memoryLimitMiB: 512,
      portMappings: [{
        containerPort: 8080,
        hostPort: 8080
      }],
      logging: LogDrivers.awsLogs({streamPrefix: 'clamav-rest-service'}),
    });

    const ecsClamApiService = new FargateService(this, 'clamav-rest-Service', {
      cluster,
      taskDefinition: taskDefinition,
      desiredCount: 1
    });

    const alb = new ApplicationLoadBalancer(this, 'clamav-rest-alb', {
      vpc,
      internetFacing: true
    });

    const listener = alb.addListener('clamav-rest-listener', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
    });

    listener.addTargets('clamav-rest-target', {
      port: 80,
      targets: [ecsClamApiService.loadBalancerTarget({
        containerName: clamContainerRest.containerName,
        containerPort: 8080
      })],
      protocol: ApplicationProtocol.HTTP,
      healthCheck: {
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 10,
        timeout: cdk.Duration.seconds(20),
        interval: cdk.Duration.seconds(30)
      }
    });

    new cdk.CfnOutput(this, 'alb-url', {
      value: alb.loadBalancerDnsName,
      exportName: 'calmav-rest-stack-loadBalancerDnsName'
    });
    
  }
}
