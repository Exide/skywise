terraform {

  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    region = "us-west-2"
    bucket = "skywise"
    key = "terraform"
    dynamodb_table = "skywise-terraform-lock"
  }
}

provider "aws" {
  region = "us-west-2"
}
