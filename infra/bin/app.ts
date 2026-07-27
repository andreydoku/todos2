#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { Todos2Stack } from '../lib/todos-stack'

const app = new cdk.App()

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
}

new Todos2Stack(app, 'Todos2Stack-dev', { env, environment: 'dev' })
new Todos2Stack(app, 'Todos2Stack-prod', { env, environment: 'prod' })
