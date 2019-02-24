provider "aws" {
  region = "us-east-1"
}

resource "aws_iam_policy" "serverless" {
  name = "serverless"
  policy = "${file("IAMCredentials.json")}"
}
